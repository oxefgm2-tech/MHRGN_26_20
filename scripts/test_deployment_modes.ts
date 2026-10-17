import http from 'http';

async function postMode(body: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request(
      'http://127.0.0.1:3000/api/system/deployment-mode',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
        },
      },
      (res) => {
        let respData = '';
        res.on('data', (chunk) => (respData += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(respData));
          } catch (e) {
            resolve(respData);
          }
        });
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function getMode(): Promise<any> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      'http://127.0.0.1:3000/api/system/deployment-mode',
      { method: 'GET' },
      (res) => {
        let respData = '';
        res.on('data', (chunk) => (respData += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(respData));
          } catch (e) {
            resolve(respData);
          }
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

async function run() {
  console.log('Testing Deployment Mode Adapter Behavior...');

  // Test 1: LAN Windows
  const lanRes = await postMode({ mode: 'lan_windows', databaseType: 'embedded_json' });
  console.log('1. LAN Mode Response:', lanRes.message, '| Warnings:', lanRes.warnings);

  // Test 2: Incompatible databaseType (postgresql requested while provider is json)
  const pgMismatchRes = await postMode({ mode: 'vps_ubuntu', databaseType: 'postgresql' });
  console.log('2. VPS Postgres Discrepancy Warnings:', pgMismatchRes.warnings);

  // Test 3: Cloud hosted (blueprint)
  const cloudRes = await postMode({ mode: 'cloud_hosted' });
  console.log('3. Cloud Hosted Response:', cloudRes.message, '| Status:', cloudRes.config.status, '| Warnings:', cloudRes.warnings);

  // Revert back to safe default
  await postMode({ mode: 'lan_windows', databaseType: 'embedded_json' });

  const getStatus = await getMode();
  console.log('4. Profile details active mode:', getStatus.activeProfileDetails.mode, '| DB Engine:', getStatus.activeProfileDetails.databaseEngine);

  console.log('✅ Deployment Mode Adapter & Validation test completed.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
