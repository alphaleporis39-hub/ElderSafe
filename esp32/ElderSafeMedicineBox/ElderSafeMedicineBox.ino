/**
 * ============================================================
 *  ElderSafe Medicine Box — ESP32 Firmware
 *  Target: ESP32 (any dev board: DOIT, Wemos, NodeMCU-32S)
 *
 *  What this sketch does:
 *    1. Connects to Wi-Fi with auto-reconnect.
 *    2. Registers the device with the ElderSafe backend on boot.
 *    3. Sends a heartbeat POST every HEARTBEAT_INTERVAL_MS.
 *    4. Reads a reed switch / magnetic sensor on SENSOR_PIN.
 *       When the compartment is opened, sends MEDICINE_COMPARTMENT_OPENED.
 *    5. Prints all server responses to Serial Monitor.
 *    6. Retries failed HTTP requests up to MAX_RETRIES times.
 *    7. Never blocks the loop indefinitely (non-blocking design).
 *
 *  Libraries required:
 *    - WiFi.h          (bundled with Arduino ESP32 core)
 *    - HTTPClient.h    (bundled with Arduino ESP32 core)
 *    - ArduinoJson     (install via Library Manager: "ArduinoJson" by Benoit Blanchon)
 *
 *  Tested with: Arduino ESP32 core >= 2.0.x
 * ============================================================
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <time.h>

// ─── CONFIGURE THESE ─────────────────────────────────────────────────────────

#define WIFI_SSID        "iPhone (2)"
#define WIFI_PASSWORD    "12345678"


// ElderSafe backend base URL — MUST point at the backend API server.
// Standalone backend (this repo):        "http://192.168.x.x:3001"  ← node server/standalone.cjs
// Optional Vite dev API (same Wi-Fi):    "http://192.168.x.x:5173"  ← npm run dev
// Production (public HTTPS backend):     "https://your-backend.example.com"
// Do NOT add a trailing slash.
#define SERVER_URL       "http://172.20.10.3:3001"

// Must match DEVICE_API_KEY on the server (default: "eldersafe_esp32_secret_token")
#define DEVICE_TOKEN     "eldersafe_esp32_secret_token"

// Medicine box identity (must be registered in the backend)
#define DEVICE_ID        "MEDBOX-001"
#define ELDER_ID         "elder-001"
#define FIRMWARE_VERSION "v1.0.0-esp32"

// Compartment number this sensor is monitoring (1 = morning, 2 = afternoon, 3 = evening, 4 = night)
// Flash one ESP32 per compartment and set COMPARTMENT_NUM accordingly.
#define COMPARTMENT_NUM  1

// GPIO pin connected to reed switch / magnetic sensor
// HIGH = compartment closed, LOW = compartment opened (or invert below)
#define SENSOR_PIN       GPIO_NUM_4

// Heartbeat interval in milliseconds (30 seconds)
#define HEARTBEAT_INTERVAL_MS  30000UL

// Max HTTP retries per request
#define MAX_RETRIES      3

// HTTP timeout per attempt (milliseconds)
#define HTTP_TIMEOUT_MS  5000

// Debounce time for sensor (milliseconds)
#define DEBOUNCE_MS      500UL

// NTP server for accurate timestamps
#define NTP_SERVER       "pool.ntp.org"
#define NTP_GMT_OFFSET   19800  // IST = UTC+5:30 = 19800 seconds
#define NTP_DST_OFFSET   0

// ─── STATE ───────────────────────────────────────────────────────────────────

unsigned long lastHeartbeatMs   = 0;
unsigned long lastSensorEventMs = 0;
bool          lastSensorState   = HIGH;   // HIGH = closed (assuming active-low reed switch)
bool          registered        = false;

// ─── FORWARD DECLARATIONS ────────────────────────────────────────────────────

bool  connectWiFi();
void  ensureWiFi();
bool  httpPost(const char* path, const String& body, int retries = MAX_RETRIES);
bool  registerDevice();
bool  sendHeartbeat();
bool  sendCompartmentEvent(int compartment);
String getISOTimestamp();
void  syncTime();

// ─── SETUP ───────────────────────────────────────────────────────────────────

void setup() {
  Serial.begin(115200);
  delay(500);

  Serial.println();
  Serial.println(F("============================================"));
  Serial.println(F("  ElderSafe Medicine Box — ESP32 Firmware  "));
  Serial.println(F("============================================"));
  Serial.print(F("Device ID   : ")); Serial.println(DEVICE_ID);
  Serial.print(F("Compartment : ")); Serial.println(COMPARTMENT_NUM);
  Serial.print(F("Server URL  : ")); Serial.println(SERVER_URL);
  Serial.println();

  // Sensor pin — internal pull-up so reed switch pulls LOW when open
  pinMode(SENSOR_PIN, INPUT_PULLUP);

  // Connect to Wi-Fi
  if (!connectWiFi()) {
    Serial.println(F("[WARN] Wi-Fi not available on boot — will retry in loop."));
  }

  // Sync time via NTP
  syncTime();

  // Register device on boot
  registered = registerDevice();
}

// ─── MAIN LOOP ────────────────────────────────────────────────────────────────

void loop() {
  // 1. Keep Wi-Fi alive
  ensureWiFi();

  // 2. Read sensor with debounce
  bool currentState = digitalRead(SENSOR_PIN);
  if (currentState != lastSensorState) {
    unsigned long now = millis();
    if ((now - lastSensorEventMs) > DEBOUNCE_MS) {
      lastSensorEventMs = now;
      lastSensorState   = currentState;

      // LOW = compartment opened (reed switch released / lid lifted)
      if (currentState == LOW) {
        Serial.println(F("[SENSOR] Compartment opened — sending event..."));
        sendCompartmentEvent(COMPARTMENT_NUM);
      } else {
        Serial.println(F("[SENSOR] Compartment closed."));
      }
    }
  }

  // 3. Periodic heartbeat
  if (millis() - lastHeartbeatMs >= HEARTBEAT_INTERVAL_MS) {
    lastHeartbeatMs = millis();
    sendHeartbeat();
  }

  // 4. Small yield — prevents watchdog resets
  delay(50);
}

// ─── WI-FI ────────────────────────────────────────────────────────────────────

bool connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return true;

  Serial.print(F("[WiFi] Connecting to "));
  Serial.print(WIFI_SSID);
  Serial.print(F(" ..."));

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED) {
    if (millis() - start > 15000UL) {      // 15-second timeout
      Serial.println(F(" TIMEOUT"));
      return false;
    }
    delay(500);
    Serial.print('.');
  }

  Serial.println(F(" CONNECTED"));
  Serial.print(F("[WiFi] IP address: "));
  Serial.println(WiFi.localIP());
  return true;
}

void ensureWiFi() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println(F("[WiFi] Lost connection — reconnecting..."));
    connectWiFi();
  }
}

// ─── TIME ─────────────────────────────────────────────────────────────────────

void syncTime() {
  if (WiFi.status() != WL_CONNECTED) return;
  Serial.print(F("[NTP] Syncing time..."));
  configTime(NTP_GMT_OFFSET, NTP_DST_OFFSET, NTP_SERVER);

  // Wait up to 5 seconds for time to be set
  struct tm timeinfo;
  unsigned long start = millis();
  while (!getLocalTime(&timeinfo)) {
    if (millis() - start > 5000UL) {
      Serial.println(F(" FAILED (will use fallback)"));
      return;
    }
    delay(200);
  }
  Serial.println(F(" SYNCED"));
}

/**
 * Returns current time as ISO-8601 string: "2026-09-22T10:03:15Z"
 * Falls back to "1970-01-01T00:00:00Z" if NTP not synced.
 */
String getISOTimestamp() {
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) {
    return String(F("1970-01-01T00:00:00Z"));
  }
  char buf[30];
  // Format: YYYY-MM-DDTHH:MM:SSZ
  strftime(buf, sizeof(buf), "%Y-%m-%dT%H:%M:%SZ", &timeinfo);
  return String(buf);
}

// ─── HTTP ─────────────────────────────────────────────────────────────────────

/**
 * POST a JSON body to SERVER_URL + path.
 * Includes Authorization: Bearer DEVICE_TOKEN header.
 * Returns true if HTTP 200 received.
 */
bool httpPost(const char* path, const String& body, int retries) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println(F("[HTTP] No Wi-Fi — skipping request."));
    return false;
  }

  String url = String(F(SERVER_URL)) + String(path);

  for (int attempt = 1; attempt <= retries; attempt++) {
    HTTPClient http;
    http.begin(url);
    http.addHeader(F("Content-Type"), F("application/json"));
    http.addHeader(F("Authorization"), String(F("Bearer ")) + String(F(DEVICE_TOKEN)));
    http.setTimeout(HTTP_TIMEOUT_MS);

    Serial.print(F("[HTTP] POST "));
    Serial.print(path);
    Serial.print(F(" (attempt "));
    Serial.print(attempt);
    Serial.print(F("/"));
    Serial.print(retries);
    Serial.print(F(") ... "));

    int code = http.POST(body);

    if (code > 0) {
      String response = http.getString();
      http.end();

      Serial.print(F("HTTP "));
      Serial.println(code);
      Serial.print(F("  Response: "));
      Serial.println(response);

      return (code == 200);
    } else {
      Serial.print(F("FAILED (error "));
      Serial.print(code);
      Serial.println(F(")"));
      http.end();

      if (attempt < retries) {
        unsigned long backoff = 1000UL * attempt;
        Serial.print(F("  Retrying in "));
        Serial.print(backoff / 1000);
        Serial.println(F("s..."));
        delay(backoff);
      }
    }
  }

  Serial.println(F("[HTTP] All retries exhausted."));
  return false;
}

// ─── ELDERSAFE API CALLS ──────────────────────────────────────────────────────

/**
 * Register this device with the ElderSafe backend.
 * Call once on boot. Safe to call again after reboot.
 */
bool registerDevice() {
  Serial.println(F("[ElderSafe] Registering device..."));

  StaticJsonDocument<256> doc;
  doc[F("deviceId")]        = F(DEVICE_ID);
  doc[F("deviceType")]      = F("medicine_box");
  doc[F("name")]            = F("Mohan Medicine Box");
  doc[F("elderId")]         = F(ELDER_ID);
  doc[F("firmwareVersion")] = F(FIRMWARE_VERSION);

  String body;
  serializeJson(doc, body);

  bool ok = httpPost("/api/devices/register", body);
  if (ok) {
    Serial.println(F("[ElderSafe] Device registered successfully."));
  } else {
    Serial.println(F("[ElderSafe] Registration failed — will retry on next boot."));
  }
  return ok;
}

/**
 * Send a heartbeat to update lastSeen and keep device marked online.
 */
bool sendHeartbeat() {
  StaticJsonDocument<128> doc;
  doc[F("deviceId")]  = F(DEVICE_ID);
  doc[F("timestamp")] = getISOTimestamp();

  String body;
  serializeJson(doc, body);

  Serial.print(F("[ElderSafe] Heartbeat at "));
  Serial.println(getISOTimestamp());

  return httpPost("/api/devices/heartbeat", body);
}

/**
 * Send MEDICINE_COMPARTMENT_OPENED when the sensor triggers.
 * The backend will match this to the correct scheduled medication
 * and update its status to "taken".
 */
bool sendCompartmentEvent(int compartment) {
  StaticJsonDocument<192> doc;
  doc[F("deviceId")]   = F(DEVICE_ID);
  doc[F("event")]      = F("MEDICINE_COMPARTMENT_OPENED");
  doc[F("compartment")] = compartment;
  doc[F("timestamp")]  = getISOTimestamp();

  String body;
  serializeJson(doc, body);

  Serial.print(F("[ElderSafe] Sending MEDICINE_COMPARTMENT_OPENED for compartment "));
  Serial.println(compartment);

  return httpPost("/api/devices/events", body);
}
