import { WebSocket } from 'ws';

async function run() {
  console.log('==================================================');
  console.log('🧪 Running Acceptance Test: Internal Messenger WS (P1.3)');
  console.log('==================================================');

  return new Promise<void>((resolve, reject) => {
    const ws = new WebSocket('ws://127.0.0.1:3000/ws');
    const timer = setTimeout(() => {
      ws.close();
      reject(new Error('WebSocket connection timed out after 3000ms.'));
    }, 3000);

    ws.on('open', () => {
      console.log('✓ WebSocket connection opened successfully on ws://127.0.0.1:3000/ws');
      ws.send(JSON.stringify({ type: 'ping' }));
    });

    ws.on('message', (data) => {
      console.log('✓ WebSocket message received from server:', data.toString().substring(0, 80));
      clearTimeout(timer);
      ws.close();
      console.log('==================================================');
      console.log('✅ P1.3 ACCEPTANCE TEST PASSED (Live WebSocket /ws operational)');
      console.log('==================================================');
      resolve();
    });

    ws.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

run().catch((err) => {
  console.error('❌ P1.3 Acceptance Test Failed:', err);
  process.exit(1);
});
