import fs from 'fs';
import path from 'path';
import http from 'http';

function checkFileExistsAndNonEmpty(filePath: string): boolean {
  if (!fs.existsSync(filePath)) return false;
  const stat = fs.statSync(filePath);
  return stat.size > 0;
}

function requestHttp(options: http.RequestOptions): Promise<{ statusCode: number; data: any }> {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let raw = '';
      res.on('data', (c) => (raw += c));
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode || 0, data: JSON.parse(raw) });
        } catch {
          resolve({ statusCode: res.statusCode || 0, data: raw });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function run() {
  console.log('======================================================');
  console.log('🧪 Running Acceptance Test: N3 Telephony Secretary & IVR');
  console.log('======================================================');

  const patchDir = path.resolve(process.cwd(), 'patches', 'N3-telephony-ivr');
  const srcTab = path.join(patchDir, 'source', 'TelephonySecretaryTab.tsx');
  const srcSvc = path.join(patchDir, 'source', 'telephonyModemService.ts');
  const legPy = path.join(patchDir, 'legacy', 'modem_ivr_daemon.py');
  const legPs1 = path.join(patchDir, 'legacy', 'Start-ModemVoiceService.ps1');
  const legBat = path.join(patchDir, 'legacy', 'start-modem-daemon.bat');
  const diffFile = path.join(patchDir, 'server_endpoints.diff');

  // Check 1: UI / Management files exist
  if (!checkFileExistsAndNonEmpty(srcTab)) throw new Error(`Missing UI tab: ${srcTab}`);
  console.log(`  ✓ TelephonySecretaryTab.tsx verified (${fs.statSync(srcTab).size} bytes)`);

  if (!checkFileExistsAndNonEmpty(srcSvc)) throw new Error(`Missing service: ${srcSvc}`);
  console.log(`  ✓ telephonyModemService.ts verified (${fs.statSync(srcSvc).size} bytes)`);

  // Check 2: Legacy 56K files exist
  if (!checkFileExistsAndNonEmpty(legPy)) throw new Error(`Missing legacy script: ${legPy}`);
  console.log(`  ✓ legacy/modem_ivr_daemon.py verified (${fs.statSync(legPy).size} bytes)`);

  if (!checkFileExistsAndNonEmpty(legPs1)) throw new Error(`Missing legacy ps1: ${legPs1}`);
  console.log(`  ✓ legacy/Start-ModemVoiceService.ps1 verified (${fs.statSync(legPs1).size} bytes)`);

  if (!checkFileExistsAndNonEmpty(legBat)) throw new Error(`Missing legacy bat: ${legBat}`);
  console.log(`  ✓ legacy/start-modem-daemon.bat verified (${fs.statSync(legBat).size} bytes)`);

  // Check 3: Every required route exists in server_endpoints.diff
  if (!checkFileExistsAndNonEmpty(diffFile)) throw new Error(`Missing diff file: ${diffFile}`);
  const diffContent = fs.readFileSync(diffFile, 'utf8');

  const requiredRoutes = [
    '/api/telephony/modems',
    '/api/telephony/config',
    '/api/telephony/calls',
    '/api/telephony/upload-recording',
    '/api/telephony/recordings/:filename',
    '/api/telephony/calls/:id',
    '/api/telephony/calls/:id/convert-to-appointment',
    '/api/telephony/calls/:id/convert-to-petshop-order',
    '/api/telephony/calls/batch-review',
    '/api/telephony/ai-structure-transcript',
    '/api/telephony/simulate-call',
  ];

  for (const route of requiredRoutes) {
    if (!diffContent.includes(route)) {
      throw new Error(`Diff file missing route: ${route}`);
    }
    console.log(`  ✓ Diff includes route: ${route}`);
  }

  // Check 4: Live server endpoint test
  console.log('  Testing live server endpoint GET /api/telephony/modems...');
  const res = await requestHttp({
    hostname: '127.0.0.1',
    port: 3000,
    path: '/api/telephony/modems',
    method: 'GET',
  });

  if (res.statusCode !== 200 || !res.data?.success) {
    throw new Error(`GET /api/telephony/modems returned unexpected response: ${JSON.stringify(res)}`);
  }
  console.log(`  ✓ Live server returned 200 OK: activePort=${res.data.activePort}`);

  console.log('======================================================');
  console.log('✅ N3 ACCEPTANCE TEST PASSED (UI, Legacy Files, Diff Routes, Live Server Verified)');
  console.log('======================================================');
}

run().catch((err) => {
  console.error('❌ N3 Acceptance Test Failed:', err);
  process.exit(1);
});
