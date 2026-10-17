import http from 'http';
import fs from 'fs';
import path from 'path';

function requestHttp(options: http.RequestOptions, postData?: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve(data);
        }
      });
    });
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function requestGet(urlPath: string, token?: string): Promise<any> {
  return requestHttp({
    hostname: '127.0.0.1',
    port: 3000,
    path: urlPath,
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

async function run() {
  console.log('==================================================');
  console.log('🧪 Running Acceptance Test: Radiography Module (P1.6)');
  console.log('==================================================');

  // Check 1: Hardware scripts existence
  const scriptsDir = path.resolve(process.cwd(), 'patches', 'P1.6-radiography-dicom', 'scripts');
  const requiredScripts = [
    'Configure-Win7RadiographySecurity.ps1',
    'setup-ncase3-radiography.sh',
    'RadiographyAgent.hta',
    'Run-RadiographyAgent.bat',
    'Start-RadiographySync.ps1',
    'radiography-viewer.html',
  ];

  for (const s of requiredScripts) {
    const p = path.join(scriptsDir, s);
    if (!fs.existsSync(p)) {
      throw new Error(`Missing script: ${s}`);
    }
    console.log(`  ✓ Script validated: ${s} (${fs.statSync(p).size} bytes)`);
  }

  // Check 2: Server API endpoint
  const loginBody = JSON.stringify({
    username: 'dr.bayati',
    password: process.env.AUTH_BOOTSTRAP_TOKEN || 'mpc-bootstrap-2026-secure-token-x7k9m2',
  });
  const loginRes = await requestHttp({
    hostname: '127.0.0.1',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(loginBody),
    },
  }, loginBody);
  const token = loginRes?.token || '';

  const incomingRes = await requestGet('/api/radiography/incoming', token);
  console.log('✓ /api/radiography/incoming returned success:', incomingRes?.success, 'Count:', incomingRes?.count);

  if (!incomingRes?.success) {
    throw new Error('Radiography API returned failure.');
  }

  console.log('==================================================');
  console.log('✅ P1.6 ACCEPTANCE TEST PASSED (Hardware Scripts & API)');
  console.log('==================================================');
}

run().catch((err) => {
  console.error('❌ P1.6 Acceptance Test Failed:', err);
  process.exit(1);
});
