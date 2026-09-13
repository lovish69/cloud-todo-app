// Unit tests for the Todo REST API
// NOTE: BASE uses 127.0.0.1 (IPv4) instead of "localhost" because CI runners
// (GitHub Actions) resolve localhost to IPv6 (::1) while the server listens
// on IPv4 (0.0.0.0), which causes "fetch failed" errors.
const assert = require('assert');

const BASE = 'http://127.0.0.1:3000';

// Wait until the server is accepting connections (up to ~20 seconds)
async function waitForServer(retries = 20) {
  for (let i = 0; i < retries; i++) {
    try {
      await fetch(`${BASE}/health`);
      return;
    } catch {
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  throw new Error('Server did not become ready in time');
}

async function runTests() {
    console.log('Running Todo API Tests...\n');
    let passed = 0, failed = 0;

    async function test(name, fn) {
        try {
            await fn();
            console.log(`  PASS: ${name}`);
            passed++;
        } catch(e) {
            console.log(`  FAIL: ${name} - ${e.message}`);
            failed++;
        }
    }

    // Make sure the server is up before running the tests
    await waitForServer();

    // Test 1: GET all tasks
    await test('GET /api/tasks returns array', async () => {
        const res = await fetch(`${BASE}/api/tasks`);
        const data = await res.json();
        assert.ok(Array.isArray(data), 'Should return an array');
        assert.ok(data.length > 0, 'Should have tasks');
    });

    // Test 2: Create a task
    let createdId;
    await test('POST /api/tasks creates a task', async () => {
        const res = await fetch(`${BASE}/api/tasks`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({title: 'Test Task', tag: 'Test'})
        });
        const data = await res.json();
        createdId = data.id;
        assert.equal(data.title, 'Test Task');
        assert.equal(data.completed, false);
    });

    // Test 3: Update a task
    await test('PUT /api/tasks/:id updates a task', async () => {
        const res = await fetch(`${BASE}/api/tasks/${createdId}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({completed: true})
        });
        const data = await res.json();
        assert.equal(data.completed, true);
    });

    // Test 4: Delete a task
    await test('DELETE /api/tasks/:id deletes a task', async () => {
        const res = await fetch(`${BASE}/api/tasks/${createdId}`, {method: 'DELETE'});
        const data = await res.json();
        assert.equal(data.message, 'Task deleted');
    });

    // Test 5: Health check
    await test('GET /health returns healthy', async () => {
        const res = await fetch(`${BASE}/health`);
        const data = await res.json();
        assert.equal(data.status, 'healthy');
    });

    console.log(`\nResults: ${passed} passed, ${failed} failed`);
    process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(e => {
    console.error(e.message);
    process.exit(1);
});
