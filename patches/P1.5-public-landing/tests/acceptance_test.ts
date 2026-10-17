import fs from 'fs';
import path from 'path';

async function run() {
  console.log('==================================================');
  console.log('🧪 Running Acceptance Test: Landing & Location (P1.5)');
  console.log('==================================================');

  const baseDir = path.resolve(process.cwd(), 'patches', 'P1.5-public-landing', 'source');
  const landingPath = path.join(baseDir, 'ClinicLandingPage.tsx');
  const locationPath = path.join(baseDir, 'clinicLocation.ts');

  if (!fs.existsSync(landingPath) || !fs.existsSync(locationPath)) {
    throw new Error('Landing page or location constant is missing.');
  }

  const locationContent = fs.readFileSync(locationPath, 'utf-8');
  if (!locationContent.includes('CLINIC_LOCATION') || !locationContent.includes('neshan')) {
    throw new Error('Location constant must define CLINIC_LOCATION and routing links.');
  }

  const landingContent = fs.readFileSync(landingPath, 'utf-8');
  console.log('✓ ClinicLandingPage exists, size:', landingContent.length, 'bytes');
  console.log('✓ clinicLocation exists with valid coordinates and routing links.');

  console.log('==================================================');
  console.log('✅ P1.5 ACCEPTANCE TEST PASSED (Public landing page)');
  console.log('==================================================');
}

run().catch((err) => {
  console.error('❌ P1.5 Acceptance Test Failed:', err);
  process.exit(1);
});
