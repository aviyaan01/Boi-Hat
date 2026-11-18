#!/usr/bin/env node

/**
 * Boi-Hat Production Deployment Smoke Test Suite
 * Usage: node scripts/smoke-prod.js --url https://<your-render-service>.onrender.com
 */

const https = require('https');
const http = require('http');

const args = process.argv.slice(2);
let targetUrl = process.env.API_URL || 'https://boi-hat-api.onrender.com';

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--url' && args[i + 1]) {
    targetUrl = args[i + 1];
    break;
  }
}

targetUrl = targetUrl.replace(/\/+$/, '');

console.log('================================================================');
console.log(`🚀 BOI-HAT PRODUCTION SMOKE TEST: ${targetUrl}`);
console.log('================================================================\n');

function request(urlStr, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const client = url.protocol === 'https:' ? https : http;
    const startTime = Date.now();

    const req = client.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        const latencyMs = Date.now() - startTime;
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (_) {}
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data,
          json,
          latencyMs,
        });
      });
    });

    req.on('error', reject);
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runSmokeTests() {
  let passed = 0;
  let failed = 0;

  // Test 1: Security Protocol
  if (targetUrl.startsWith('https://')) {
    console.log('  ✓ [SECURITY] Target uses secure HTTPS encryption');
    passed++;
  } else {
    console.warn('  ⚠️ [SECURITY] Target URL is not using HTTPS (Warning for production)');
    failed++;
  }

  // Test 2: GET /health
  try {
    const res = await request(`${targetUrl}/health`);
    if (res.statusCode === 200 && res.json && res.json.status === 'ok') {
      console.log(`  ✓ [HEALTH] GET /health returned 200 OK (${res.latencyMs}ms)`);
      if (res.json.db === 'ok') {
        console.log(`  ✓ [DATABASE] PostgreSQL connection is verified (db: ok)`);
        passed++;
      } else {
        console.error(`  ✗ [DATABASE] Database status reported unhealthy: ${res.json.db}`);
        failed++;
      }
      passed++;
    } else {
      console.error(`  ✗ [HEALTH] GET /health failed (Status: ${res.statusCode}): ${res.data}`);
      failed++;
    }
  } catch (err) {
    console.error(`  ✗ [HEALTH] Network error contacting /health: ${err.message}`);
    failed++;
  }

  // Test 3: Security Headers (Helmet)
  try {
    const res = await request(`${targetUrl}/health`);
    const hasSecHeaders =
      res.headers['x-content-type-options'] === 'nosniff' ||
      res.headers['strict-transport-security'] ||
      res.headers['x-dns-prefetch-control'];

    if (hasSecHeaders) {
      console.log('  ✓ [SECURITY] Production security headers (Helmet) detected');
      passed++;
    } else {
      console.warn('  ⚠️ [SECURITY] Helmet security headers not fully detected');
    }
  } catch (err) {
    failed++;
  }

  // Test 4: Live Username Availability Check
  try {
    const testUsername = `smoke_${Math.floor(1000 + Math.random() * 9000)}`;
    const res = await request(`${targetUrl}/auth/username-available?u=${testUsername}`);
    if (res.statusCode === 200 && res.json) {
      const data = res.json.data || res.json;
      if (typeof data.available === 'boolean') {
        console.log(`  ✓ [AUTH] GET /auth/username-available?u=${testUsername} returned 200 OK (${res.latencyMs}ms, available: ${data.available})`);
        passed++;
      } else {
        console.error(`  ✗ [AUTH] Unexpected response structure for username availability: ${res.data}`);
        failed++;
      }
    } else {
      console.error(`  ✗ [AUTH] Username check returned error ${res.statusCode}: ${res.data}`);
      failed++;
    }
  } catch (err) {
    console.error(`  ✗ [AUTH] Network error testing username check: ${err.message}`);
    failed++;
  }

  console.log('\n================================================================');
  console.log(`SMOKE TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runSmokeTests().catch((err) => {
  console.error('Fatal smoke test runner error:', err);
  process.exit(1);
});
