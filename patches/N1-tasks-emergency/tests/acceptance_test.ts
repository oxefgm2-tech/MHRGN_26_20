import fs from 'fs';
import path from 'path';
import http from 'http';

function checkFileExistsAndNonEmpty(filePath: string): boolean {
  if (!fs.existsSync(filePath)) return false;
  const stat = fs.statSync(filePath);
  return stat.size > 0;
}

function requestHttp(options: http.RequestOptions, body?: any): Promise<{ statusCode: number; data: any }> {
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
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function run() {
  console.log('======================================================');
  console.log('🧪 Running Acceptance Test: N1 Tasks & Emergency Summon');
  console.log('======================================================');

  const patchDir = path.resolve(process.cwd(), 'patches', 'N1-tasks-emergency');
  const srcTab = path.join(patchDir, 'source', 'StaffTasksDelegationTab.tsx');
  const srcModal = path.join(patchDir, 'source', 'EmergencySummonModal.tsx');
  const diffFile = path.join(patchDir, 'server_endpoints.diff');

  // Check 1: Source files exist and are non-empty
  if (!checkFileExistsAndNonEmpty(srcTab)) {
    throw new Error(`Missing or empty file: ${srcTab}`);
  }
  const tabSize = fs.statSync(srcTab).size;
  console.log(`  ✓ StaffTasksDelegationTab.tsx verified (${tabSize} bytes)`);

  if (!checkFileExistsAndNonEmpty(srcModal)) {
    throw new Error(`Missing or empty file: ${srcModal}`);
  }
  const modalSize = fs.statSync(srcModal).size;
  console.log(`  ✓ EmergencySummonModal.tsx verified (${modalSize} bytes)`);

  // Check 2: Diff contains all 5 required endpoints
  if (!checkFileExistsAndNonEmpty(diffFile)) {
    throw new Error(`Missing or empty diff file: ${diffFile}`);
  }
  const diffContent = fs.readFileSync(diffFile, 'utf8');
  const requiredEndpoints = [
    "app.get('/api/staff'",
    "app.get('/api/tasks'",
    "app.post('/api/tasks'",
    "app.patch('/api/tasks/:id'",
    "app.delete('/api/tasks/:id'",
  ];

  for (const ep of requiredEndpoints) {
    if (!diffContent.includes(ep)) {
      throw new Error(`Diff missing required endpoint: ${ep}`);
    }
    console.log(`  ✓ Diff contains endpoint: ${ep}`);
  }

  // Check 3: Live server verification for /api/tasks
  console.log('  Testing live server endpoint GET /api/tasks...');
  let liveServerOk = false;
  try {
    // Attempt auth login to obtain token
    const loginRes = await requestHttp({
      hostname: '127.0.0.1',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, { username: 'admin', password: 'mpc-bootstrap-2026-secure-token-x7k9m2' });

    const token = loginRes.data?.token || '';
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const tasksRes = await requestHttp({
      hostname: '127.0.0.1',
      port: 3000,
      path: '/api/tasks',
      method: 'GET',
      headers,
    });

    console.log(`  ✓ Server responded: Status ${tasksRes.statusCode}`, {
      success: tasksRes.data?.success,
      count: tasksRes.data?.count,
    });

    if (tasksRes.statusCode === 200 && tasksRes.data?.success === true) {
      liveServerOk = true;
    } else {
      throw new Error(`GET /api/tasks returned non-200 status: ${tasksRes.statusCode}`);
    }
  } catch (err: any) {
    throw new Error(`Live server test failed: ${err.message}`);
  }

  console.log('======================================================');
  console.log('✅ N1 ACCEPTANCE TEST PASSED (Files, Diff Endpoints, Live Server Verified)');
  console.log('======================================================');
}

run().catch((err) => {
  console.error('❌ N1 Acceptance Test Failed:', err);
  process.exit(1);
});
