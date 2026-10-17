import http from 'http';
import fs from 'fs';
import path from 'path';

function requestGet(path: string): Promise<any> {
  return new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:3000${path}`, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve(data);
        }
      });
    }).on('error', reject);
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
  const incomingRes = await requestGet('/api/radiography/incoming');
  console.log('✓ /api/radiography/incoming returned success:', incomingRes.success, 'Count:', incomingRes.count);

  if (!incomingRes.success) {
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
