import http from 'http';

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
  console.log('🧪 Running Acceptance Test: IPPanel SMS Module (P1.2)');
  console.log('==================================================');

  // Test 1: SMS status endpoint
  const statusRes = await requestGet('/api/sms/status');
  console.log('1. /api/sms/status Response:', {
    success: statusRes.success,
    isActive: statusRes.data?.isActive,
    senderNumber: statusRes.data?.senderNumber,
    creditStatus: statusRes.data?.creditStatus,
  });

  if (!statusRes.success || !statusRes.data) {
    throw new Error('Failed to retrieve SMS status.');
  }

  // Test 2: SMS credit endpoint
  const creditRes = await requestGet('/api/sms/credit');
  console.log('2. /api/sms/credit Response:', creditRes);

  if (typeof creditRes !== 'object') {
    throw new Error('Failed to call SMS credit endpoint.');
  }

  console.log('==================================================');
  console.log('✅ P1.2 ACCEPTANCE TEST PASSED (Endpoints contract verified)');
  console.log('==================================================');
}

run().catch((err) => {
  console.error('❌ P1.2 Acceptance Test Failed:', err);
  process.exit(1);
});
