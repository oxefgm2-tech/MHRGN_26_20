import http from 'http';
import fs from 'fs';
import path from 'path';

function requestGet(urlPath: string): Promise<any> {
  return new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:3000${urlPath}`, (res) => {
      let respData = '';
      res.on('data', (chunk) => (respData += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(respData));
        } catch {
          resolve(respData);
        }
      });
    }).on('error', reject);
  });
}

async function run() {
  console.log('==================================================');
  console.log('🧪 Running Acceptance Test: Legacy SQL Server (P1.7)');
  console.log('==================================================');

  // Check 1: PowerShell script file existence
  const ps1Path = path.resolve(process.cwd(), 'patches', 'P1.7-legacy-sql-server', 'source', 'Connect-LegacyDatabases.ps1');
  if (!fs.existsSync(ps1Path)) {
    throw new Error('Connect-LegacyDatabases.ps1 missing.');
  }
  console.log('✓ PowerShell helper script exists:', fs.statSync(ps1Path).size, 'bytes');

  // Check 2: Legacy DB schemas endpoint (dam2000 & Parsian1405)
  const schemasRes = await requestGet('/api/legacy-db/schemas');
  console.log('✓ /api/legacy-db/schemas returned success:', schemasRes.success, {
    dam2000Tables: schemasRes.dam2000?.tables?.length,
    parsianTables: schemasRes.parsian1405?.tables?.length,
  });

  if (!schemasRes.success || !schemasRes.dam2000 || !schemasRes.parsian1405) {
    throw new Error('Legacy schemas endpoint failed.');
  }

  // Check 3: Read-only schema exploration
  const sqlSchemaRes = await requestGet('/api/legacy/sql/schema?dbName=dam2000');
  console.log('✓ /api/legacy/sql/schema returned tables count:', sqlSchemaRes.tables?.length);

  if (!Array.isArray(sqlSchemaRes.tables)) {
    throw new Error('SQL schema table exploration failed.');
  }

  console.log('==================================================');
  console.log('✅ P1.7 ACCEPTANCE TEST PASSED (Read-only Dry-Run)');
  console.log('==================================================');
}

run().catch((err) => {
  console.error('❌ P1.7 Acceptance Test Failed:', err);
  process.exit(1);
});
