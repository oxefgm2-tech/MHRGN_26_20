import fs from 'fs';
import path from 'path';

async function run() {
  console.log('======================================================');
  console.log('🧪 Running Acceptance Test: N2 Bale Bot Sync Bridge');
  console.log('======================================================');

  const patchDir = path.resolve(process.cwd(), 'patches', 'N2-bale-sync');
  const patchSrcFile = path.join(patchDir, 'source', 'baleBotSyncService.ts');
  const projectSrcFile = path.resolve(process.cwd(), 'src', 'services', 'baleBotSyncService.ts');
  const diffFile = path.join(patchDir, 'server_endpoints.diff');

  // Check 1: Patch source file exists and is non-empty
  if (!fs.existsSync(patchSrcFile) || fs.statSync(patchSrcFile).size === 0) {
    throw new Error(`Missing or empty patch source file: ${patchSrcFile}`);
  }
  const fileSize = fs.statSync(patchSrcFile).size;
  console.log(`  ✓ Patch source file exists and verified (${fileSize} bytes)`);

  // Check 2: Parse and test module exports from canonical source
  const syncModule = await import(projectSrcFile);
  if (typeof syncModule.generateBaleClinicInfo !== 'function') {
    throw new Error('generateBaleClinicInfo is not exported as function');
  }
  if (typeof syncModule.generateBaleWorkingHours !== 'function') {
    throw new Error('generateBaleWorkingHours is not exported as function');
  }
  if (typeof syncModule.generateBaleMenuConfig !== 'function') {
    throw new Error('generateBaleMenuConfig is not exported as function');
  }
  console.log('  ✓ Module functions imported and validated successfully');

  // Check 3: Functional generation test
  const clinicInfo = syncModule.generateBaleClinicInfo({
    clinicName: 'کلینیک دامپزشکی مهرگان',
    address: 'اصفهان، خ توحید',
  });
  if (!clinicInfo.name || !clinicInfo.coordinates) {
    throw new Error('generateBaleClinicInfo output invalid');
  }
  console.log('  ✓ generateBaleClinicInfo output valid:', clinicInfo.name);

  const workingHours = syncModule.generateBaleWorkingHours();
  if (!workingHours.schedule) {
    throw new Error('generateBaleWorkingHours schedule missing');
  }
  console.log('  ✓ generateBaleWorkingHours schedule valid:', Object.keys(workingHours.schedule).length, 'days');

  const menu = syncModule.generateBaleMenuConfig();
  if (!menu.main_menu?.buttons) {
    throw new Error('generateBaleMenuConfig buttons missing');
  }
  console.log('  ✓ generateBaleMenuConfig buttons valid:', menu.main_menu.buttons.length, 'buttons');

  // Check 4: Diff file exists
  if (!fs.existsSync(diffFile) || fs.statSync(diffFile).size === 0) {
    throw new Error(`Missing diff documentation: ${diffFile}`);
  }
  console.log('  ✓ server_endpoints.diff documentation verified');

  console.log('======================================================');
  console.log('✅ N2 ACCEPTANCE TEST PASSED (Source Parsed, Outputs Verified, Docs Checked)');
  console.log('======================================================');
}

run().catch((err) => {
  console.error('❌ N2 Acceptance Test Failed:', err);
  process.exit(1);
});
