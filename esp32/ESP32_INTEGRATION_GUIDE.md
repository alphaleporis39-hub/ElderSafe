# ElderSafe ESP32 Medicine Box — Integration Reference

## A. Wiring Assumptions

```
ESP32 Dev Board
┌─────────────────────────────────────┐
│  GPIO4  ──────┐ Reed Switch         │
│  3.3V   ──── [MAGNET SWITCH] ──── GND│
│                                     │
│  (Internal INPUT_PULLUP active)     │
│  • Compartment CLOSED → GPIO4 HIGH  │
│  • Compartment OPENED → GPIO4 LOW   │
└─────────────────────────────────────┘

Power: USB (5V) or Li-Po via onboard regulator
Wi-Fi: Built-in (2.4 GHz, 802.11 b/g/n)
```

**Reed Switch Wiring (NO = normally open):**

| Reed Switch Pin | ESP32 Pin |
|---|---|
| Terminal A | GPIO4 (SENSOR_PIN) |
| Terminal B | GND |

The sketch uses `INPUT_PULLUP`, so no external resistor is needed.  
When the magnet is near the switch (compartment closed) → circuit closed → GPIO reads `HIGH`.  
When the magnet moves away (compartment opened) → circuit opens → GPIO reads `LOW` → event fires.

**Alternative sensors** (same wiring):
- Hall effect sensor (e.g., A3144)
- Micro switch / push button
- IR break-beam (digital out to GPIO4)

---

## B. Required Libraries

Install via **Arduino IDE → Tools → Manage Libraries**:

| Library | Author | Version | Notes |
|---|---|---|---|
| `WiFi.h` | Espressif | Built-in | Part of ESP32 Arduino core |
| `HTTPClient.h` | Espressif | Built-in | Part of ESP32 Arduino core |
| `ArduinoJson` | Benoit Blanchon | ≥ 6.x | Search "ArduinoJson" in Library Manager |
| `time.h` | C stdlib | Built-in | Part of ESP32 Arduino core |

**ESP32 Board Support** (if not installed):
1. Arduino IDE → File → Preferences → Additional Boards Manager URLs
2. Add: `https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json`
3. Tools → Board → Boards Manager → search "esp32" → Install "esp32 by Espressif Systems"

**Board selection:** Tools → Board → ESP32 Arduino → **ESP32 Dev Module**

---

## C. Required Backend URL

### Development (Vite Dev Server, same Wi-Fi network)

```
SERVER_URL = "http://192.168.1.XXX:5173"
```

Find your dev machine's local IP:
- **Windows:** `ipconfig` → look for "IPv4 Address" under Wi-Fi adapter
- **macOS/Linux:** `ifconfig | grep inet`

> **Important:** The ESP32 and dev machine must be on the **same Wi-Fi network**.

### Production (Standalone server, e.g. Raspberry Pi)

```
SERVER_URL = "http://192.168.1.XXX:3001"
node server/standalone.cjs
```

### Endpoints the ESP32 uses

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/devices/register` | Boot-time registration |
| `POST` | `/api/devices/heartbeat` | Keep-alive every 30s |
| `POST` | `/api/devices/events` | Send medicine event |

---

## D. JSON Payloads

### 1. Register (sent once on boot)

```json
POST /api/devices/register
Authorization: Bearer eldersafe_esp32_secret_token
Content-Type: application/json

{
  "deviceId": "MEDBOX-001",
  "deviceType": "medicine_box",
  "name": "Mohan Medicine Box",
  "elderId": "elder-001",
  "firmwareVersion": "v1.0.0-esp32"
}
```

**Success response:**
```json
{ "success": true, "deviceId": "MEDBOX-001" }
```

### 2. Heartbeat (every 30 seconds)

```json
POST /api/devices/heartbeat
Authorization: Bearer eldersafe_esp32_secret_token
Content-Type: application/json

{
  "deviceId": "MEDBOX-001",
  "timestamp": "2026-09-22T10:00:00Z"
}
```

**Success response:**
```json
{ "success": true }
```

### 3. Medicine Compartment Opened (on sensor trigger)

```json
POST /api/devices/events
Authorization: Bearer eldersafe_esp32_secret_token
Content-Type: application/json

{
  "deviceId": "MEDBOX-001",
  "event": "MEDICINE_COMPARTMENT_OPENED",
  "compartment": 1,
  "timestamp": "2026-09-22T10:03:15Z"
}
```

**Success response (medication matched):**
```json
{
  "success": true,
  "event": "MEDICINE_COMPARTMENT_OPENED",
  "deviceId": "MEDBOX-001",
  "matchedMedication": {
    "id": "m1",
    "name": "Blood Pressure Medicine",
    "status": "taken",
    "takenAt": "10:03 am"
  }
}
```

**Compartment → Medication mapping:**

| Compartment # | Medication | Scheduled |
|---|---|---|
| 1 | Blood Pressure Medicine | 09:00 AM |
| 2 | Afternoon Medicine (Multivitamin) | 01:30 PM |
| 3 | Evening Medicine (Cholesterol) | 08:30 PM |
| 4 | Night Medicine | 09:00 PM |

**Error responses:**
```json
{ "success": false, "error": "Unauthorized: Invalid or missing device token in Authorization header" }
{ "success": false, "error": "Device \"MEDBOX-001\" is not registered." }
{ "success": false, "error": "Invalid event \"BAD_EVENT\". Must be one of: ..." }
```

---

## E. Example Serial Monitor Output

Connect at **115200 baud** in Arduino IDE Serial Monitor.

```
============================================
  ElderSafe Medicine Box — ESP32 Firmware  
============================================
Device ID   : MEDBOX-001
Compartment : 1
Server URL  : http://192.168.1.42:5173

[WiFi] Connecting to HomeNetwork ......... CONNECTED
[WiFi] IP address: 192.168.1.107
[NTP] Syncing time... SYNCED
[ElderSafe] Registering device...
[HTTP] POST /api/devices/register (attempt 1/3) ... HTTP 200
  Response: {"success":true,"deviceId":"MEDBOX-001"}
[ElderSafe] Device registered successfully.

[ElderSafe] Heartbeat at 2026-09-22T10:00:01Z
[HTTP] POST /api/devices/heartbeat (attempt 1/3) ... HTTP 200
  Response: {"success":true}

[SENSOR] Compartment opened — sending event...
[ElderSafe] Sending MEDICINE_COMPARTMENT_OPENED for compartment 1
[HTTP] POST /api/devices/events (attempt 1/3) ... HTTP 200
  Response: {"success":true,"event":"MEDICINE_COMPARTMENT_OPENED","deviceId":"MEDBOX-001","matchedMedication":{"id":"m1","name":"Blood Pressure Medicine","status":"taken","takenAt":"10:03 am"}}

[SENSOR] Compartment closed.

[ElderSafe] Heartbeat at 2026-09-22T10:00:31Z
[HTTP] POST /api/devices/heartbeat (attempt 1/3) ... HTTP 200
  Response: {"success":true}
```

**Retry output (server unreachable):**
```
[HTTP] POST /api/devices/heartbeat (attempt 1/3) ... FAILED (error -1)
  Retrying in 1s...
[HTTP] POST /api/devices/heartbeat (attempt 2/3) ... FAILED (error -1)
  Retrying in 2s...
[HTTP] POST /api/devices/heartbeat (attempt 3/3) ... FAILED (error -1)
[HTTP] All retries exhausted.
```

---

## F. End-to-End Test Procedure

### Step 1 — Prepare the backend

```powershell
# In the ElderSafe project folder, start the dev server
npm run dev

# Verify API is alive
Invoke-RestMethod -Uri "http://localhost:5173/api/devices" -Method Get
```

### Step 2 — Find your machine's local IP

```powershell
ipconfig
# Note the IPv4 Address under your Wi-Fi adapter, e.g. 192.168.1.42
```

### Step 3 — Configure the sketch

Open `esp32/ElderSafeMedicineBox/ElderSafeMedicineBox.ino` and set:

```cpp
#define WIFI_SSID     "YourActualSSID"
#define WIFI_PASSWORD "YourActualPassword"
#define SERVER_URL    "http://192.168.1.42:5173"   // ← your IP
#define DEVICE_TOKEN  "eldersafe_esp32_secret_token"
```

### Step 4 — Flash the ESP32

1. Connect ESP32 via USB
2. Arduino IDE → Tools → Board → ESP32 Dev Module
3. Tools → Port → select the COM port
4. Click **Upload**
5. Open Serial Monitor at **115200 baud**

### Step 5 — Watch the dashboard update live

1. Open `http://localhost:5173` in a browser
2. Login → Dashboard
3. When the compartment sensor triggers:
   - Serial Monitor shows HTTP 200
   - Dashboard **"Today's medicines"** card updates: `✓ Blood Pressure Medicine — Taken at 10:03 AM`
   - Dashboard **"Today's routine"** timeline adds: `Medicine box opened: Blood Pressure Medicine confirmed`
   - Dashboard notification bell increments

### Step 6 — Simulate without physical hardware (developer test)

```powershell
# Simulate the exact same event the ESP32 would send
Invoke-RestMethod `
  -Uri "http://localhost:5173/api/devices/events" `
  -Method Post `
  -Headers @{ Authorization = "Bearer eldersafe_esp32_secret_token" } `
  -ContentType "application/json" `
  -Body '{"deviceId":"MEDBOX-001","event":"MEDICINE_COMPARTMENT_OPENED","compartment":1,"timestamp":"2026-09-22T10:03:00Z"}'

# Or run the full automated test suite
node scripts/test-esp32.cjs
```

### Configuration variables (no reflash needed)

Change timing windows at runtime via API:

```powershell
Invoke-RestMethod `
  -Uri "http://localhost:5173/api/devices/config" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"gracePeriodMinutes":90,"reminderWindowMinutes":20,"missedWindowMinutes":120}'
```

---

## Quick Reference Card (print and tape to the medicine box)

```
ElderSafe Medicine Box v1.0
────────────────────────────
Device ID   : MEDBOX-001
Compartment : 1 (Morning), 2 (Afternoon), 3 (Evening), 4 (Night)
Token       : eldersafe_esp32_secret_token
Heartbeat   : every 30 seconds
Sensor Pin  : GPIO4 (reed switch, INPUT_PULLUP)

Endpoints:
  POST /api/devices/register
  POST /api/devices/heartbeat
  POST /api/devices/events

On boot  → register
Every 30s → heartbeat
Lid open  → MEDICINE_COMPARTMENT_OPENED
```
