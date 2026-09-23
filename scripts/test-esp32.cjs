// ─── ESP32 Hardware Integration Test Script ────────────────────────────────
//
// Demonstrates and verifies all ElderSafe ESP32 API endpoints without physical hardware.
//
// Usage:
//   node scripts/test-esp32.cjs [baseUrl] [deviceToken]
//
// Example:
//   node scripts/test-esp32.cjs http://localhost:5173 eldersafe_esp32_secret_token
// ─────────────────────────────────────────────────────────────────────────────

const BASE_URL = process.argv[2] || 'http://localhost:5173';
const TOKEN = process.argv[3] || 'eldersafe_esp32_secret_token';

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function runTests() {
  console.log(`\n📡 Testing ElderSafe ESP32 IoT API at: ${BASE_URL}\n`);

  let passed = 0;
  let total = 0;

  async function test(name, fn) {
    total++;
    try {
      await fn();
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ [FAIL] ${name}:`, err.message);
    }
  }

  // Test 1: Register Device
  await test('POST /api/devices/register (Valid token & payload)', async () => {
    const res = await request('/api/devices/register', {
      method: 'POST',
      headers: { Authorization: `Bearer ${TOKEN}` },
      body: JSON.stringify({
        deviceId: 'MEDBOX-001',
        deviceType: 'medicine_box',
        name: 'Mohan Medicine Box',
        elderId: 'elder-001',
      }),
    });
    if (res.status !== 200 || !res.data.success || res.data.deviceId !== 'MEDBOX-001') {
      throw new Error(`Unexpected response: ${JSON.stringify(res.data)}`);
    }
  });

  // Test 2: Register without token (Should 401)
  await test('POST /api/devices/register (Missing token → 401 Unauthorized)', async () => {
    const res = await request('/api/devices/register', {
      method: 'POST',
      body: JSON.stringify({
        deviceId: 'MEDBOX-001',
        deviceType: 'medicine_box',
      }),
    });
    if (res.status !== 401) {
      throw new Error(`Expected status 401, got ${res.status}`);
    }
  });

  // Test 3: Heartbeat
  await test('POST /api/devices/heartbeat (Valid device & timestamp)', async () => {
    const res = await request('/api/devices/heartbeat', {
      method: 'POST',
      headers: { Authorization: `Bearer ${TOKEN}` },
      body: JSON.stringify({
        deviceId: 'MEDBOX-001',
        timestamp: new Date().toISOString(),
      }),
    });
    if (res.status !== 200 || !res.data.success) {
      throw new Error(`Unexpected response: ${JSON.stringify(res.data)}`);
    }
  });

  // Test 4: Heartbeat for unregistered device (Should 403)
  await test('POST /api/devices/heartbeat (Unregistered device → 403 Forbidden)', async () => {
    const res = await request('/api/devices/heartbeat', {
      method: 'POST',
      headers: { Authorization: `Bearer ${TOKEN}` },
      body: JSON.stringify({
        deviceId: 'UNKNOWN-BOX-999',
        timestamp: new Date().toISOString(),
      }),
    });
    if (res.status !== 403) {
      throw new Error(`Expected status 403, got ${res.status}`);
    }
  });

  // Test 5: Event - Compartment Opened (Take Medication)
  await test('POST /api/devices/events (MEDICINE_COMPARTMENT_OPENED compartment 1)', async () => {
    const res = await request('/api/devices/events', {
      method: 'POST',
      headers: { Authorization: `Bearer ${TOKEN}` },
      body: JSON.stringify({
        deviceId: 'MEDBOX-001',
        event: 'MEDICINE_COMPARTMENT_OPENED',
        compartment: 1,
        timestamp: new Date().toISOString(),
      }),
    });
    if (res.status !== 200 || !res.data.success) {
      throw new Error(`Unexpected response: ${JSON.stringify(res.data)}`);
    }
    if (!res.data.matchedMedication) {
      throw new Error('Expected matchedMedication in response');
    }
    console.log(`     Matched: "${res.data.matchedMedication.name}" (Status: ${res.data.matchedMedication.status})`);
  });

  // Test 5b: Event - Compartment 4 (Night)
  await test('POST /api/devices/events (MEDICINE_COMPARTMENT_OPENED compartment 4)', async () => {
    const res = await request('/api/devices/events', {
      method: 'POST',
      headers: { Authorization: `Bearer ${TOKEN}` },
      body: JSON.stringify({
        deviceId: 'MEDBOX-001',
        event: 'MEDICINE_COMPARTMENT_OPENED',
        compartment: 4,
        timestamp: new Date().toISOString(),
      }),
    });
    if (res.status !== 200 || !res.data.success) {
      throw new Error(`Unexpected response: ${JSON.stringify(res.data)}`);
    }
    if (!res.data.matchedMedication) {
      throw new Error('Expected matchedMedication in response');
    }
    console.log(`     Matched: "${res.data.matchedMedication.name}" (Status: ${res.data.matchedMedication.status})`);
  });

  // Test 6: Event - Invalid Event Name (Should 400)
  await test('POST /api/devices/events (Invalid event name → 400 Bad Request)', async () => {
    const res = await request('/api/devices/events', {
      method: 'POST',
      headers: { Authorization: `Bearer ${TOKEN}` },
      body: JSON.stringify({
        deviceId: 'MEDBOX-001',
        event: 'INVALID_EVENT_NAME',
      }),
    });
    if (res.status !== 400) {
      throw new Error(`Expected status 400, got ${res.status}`);
    }
  });

  // Test 7: GET /api/devices (List status)
  await test('GET /api/devices (Retrieve device status list)', async () => {
    const res = await request('/api/devices', { method: 'GET' });
    if (res.status !== 200 || !res.data.success || !Array.isArray(res.data.devices)) {
      throw new Error(`Unexpected response: ${JSON.stringify(res.data)}`);
    }
    const dev = res.data.devices.find(d => d.deviceId === 'MEDBOX-001');
    if (!dev) throw new Error('MEDBOX-001 not found in device list');
    console.log(`     Device: ${dev.name}, Online: ${dev.online}`);

    // Verify 4 medications exist
    if (!Array.isArray(res.data.medications) || res.data.medications.length < 4) {
      throw new Error(`Expected 4 medications, got ${res.data.medications?.length || 0}`);
    }
    console.log(`     Medications: ${res.data.medications.length} (including Night slot)`);
  });

  console.log(`\n🎉 Results: ${passed}/${total} tests passed.\n`);
}

runTests().catch(err => {
  console.error('Fatal error running tests:', err);
  process.exit(1);
});
