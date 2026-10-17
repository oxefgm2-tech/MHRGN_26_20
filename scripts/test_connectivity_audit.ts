import http from 'http';

async function postConnectivity(body: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request(
      'http://127.0.0.1:3000/api/system/test-connectivity',
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

async function run() {
  console.log('Testing Real Connectivity Endpoint...');
  
  // Test 1: Valid Target (localhost:3000)
  const validRes = await postConnectivity({ targetIp: '127.0.0.1', port: 3000 });
  console.log('Valid Target Result:', validRes);

  // Test 2: Invalid Domain
  const invalidRes = await postConnectivity({ targetDomain: 'nonexistent-mehregan-domain.invalid', port: 80 });
  console.log('Invalid Domain Result:', invalidRes);

  if (validRes.isReachable === true && invalidRes.isReachable === false) {
    console.log('✅ TEST PASSED: Connectivity test correctly reflects real network socket state without Math.random() simulation.');
  } else {
    console.error('❌ TEST FAILED: Unexpected connectivity result.');
    process.exit(1);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
