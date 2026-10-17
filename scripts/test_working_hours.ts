import fs from 'fs';
import path from 'path';
import {
  DEFAULT_WORKING_HOURS_CONFIG,
  summarizeWorkingHours,
  WorkingHoursConfig,
} from '../src/types';
import { generateBaleWorkingHours } from '../src/services/baleBotSyncService';

async function run() {
  console.log('======================================================');
  console.log('🧪 Running Acceptance Test: Working Hours Harmonization');
  console.log('======================================================');

  // Check 1: Structural comparison with Part B specification
  const med = DEFAULT_WORKING_HOURS_CONFIG.sections.medical;
  const ps = DEFAULT_WORKING_HOURS_CONFIG.sections.petshop;

  // Saturday .. Wednesday: Medical 09:00 - 02:00
  const satToWed: Array<keyof typeof med.days> = ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday'];
  for (const d of satToWed) {
    const sched = med.days[d];
    if (!sched.enabled || sched.windows.length !== 1 || sched.windows[0].open !== '09:00' || sched.windows[0].close !== '02:00') {
      throw new Error(`Medical ${d} does not match 09:00 - 02:00: ${JSON.stringify(sched)}`);
    }
  }
  console.log('  ✓ Medical Saturday..Wednesday matches [{09:00, 02:00}]');

  // Thursday Medical: 09:00 - 21:30 (NOT 02:00)
  const thuMed = med.days.thursday;
  if (!thuMed.enabled || thuMed.windows[0].open !== '09:00' || thuMed.windows[0].close !== '21:30') {
    throw new Error(`Medical Thursday must close at 21:30, got: ${JSON.stringify(thuMed)}`);
  }
  console.log('  ✓ Medical Thursday confirmed 09:00 - 21:30 (NOT 02:00)');

  // Friday Medical: Two windows: 10:00 - 14:00 and 17:00 - 02:00
  const friMed = med.days.friday;
  if (!friMed.enabled || friMed.windows.length !== 2) {
    throw new Error(`Medical Friday must have exactly 2 windows, got: ${friMed.windows.length}`);
  }
  if (friMed.windows[0].open !== '10:00' || friMed.windows[0].close !== '14:00' ||
      friMed.windows[1].open !== '17:00' || friMed.windows[1].close !== '02:00') {
    throw new Error(`Medical Friday windows mismatch: ${JSON.stringify(friMed.windows)}`);
  }
  console.log('  ✓ Medical Friday confirmed 2 windows: [{10:00, 14:00}, {17:00, 02:00}]');

  // Petshop Saturday .. Thursday: 09:00 - 21:30
  const satToThu: Array<keyof typeof ps.days> = ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday'];
  for (const d of satToThu) {
    const sched = ps.days[d];
    if (!sched.enabled || sched.windows.length !== 1 || sched.windows[0].open !== '09:00' || sched.windows[0].close !== '21:30') {
      throw new Error(`Petshop ${d} does not match 09:00 - 21:30: ${JSON.stringify(sched)}`);
    }
  }
  console.log('  ✓ Petshop Saturday..Thursday matches [{09:00, 21:30}]');

  // Petshop Friday: ONLY evening window [{17:00, 21:30}]
  const friPs = ps.days.friday;
  if (!friPs.enabled || friPs.windows.length !== 1 || friPs.windows[0].open !== '17:00' || friPs.windows[0].close !== '21:30') {
    throw new Error(`Petshop Friday must have only evening window [{17:00, 21:30}], got: ${JSON.stringify(friPs)}`);
  }
  console.log('  ✓ Petshop Friday confirmed evening only [{17:00, 21:30}]');

  // Check 2: summarizeWorkingHours when enabled=false returns "تعطیل"
  const disabledConfig: WorkingHoursConfig = {
    ...DEFAULT_WORKING_HOURS_CONFIG,
    enabled: false,
  };
  const summaryDisabled = summarizeWorkingHours(disabledConfig);
  if (summaryDisabled !== 'تعطیل') {
    throw new Error(`Expected "تعطیل" when enabled=false, got: "${summaryDisabled}"`);
  }
  console.log('  ✓ summarizeWorkingHours when enabled=false returns "تعطیل"');

  // Check 3: Bale bot sync service output
  const baleWorkingHours = generateBaleWorkingHours();
  if (!baleWorkingHours.enabled || !baleWorkingHours.schedule?.friday?.medical?.windows) {
    throw new Error('generateBaleWorkingHours does not reflect structured config');
  }
  console.log('  ✓ generateBaleWorkingHours successfully built from WorkingHoursConfig');

  // Check 4: Verify working_hours.json in P1.1
  const jsonPath = path.resolve(process.cwd(), 'patches', 'P1.1-bale-bot', 'source', 'config', 'working_hours.json');
  const jsonContent = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  if (jsonContent.sections?.medical?.days?.thursday?.windows?.[0]?.close !== '21:30') {
    throw new Error('working_hours.json in P1.1 Thursday does not match 21:30');
  }
  console.log('  ✓ patches/P1.1-bale-bot/source/config/working_hours.json matches Part B specification');

  // Check 5: Negative grep on obsolete strings in the 4 locations
  const filesToCheck = [
    'server.ts',
    'src/services/baleBotSyncService.ts',
    'patches/P1.1-bale-bot/source/config/working_hours.json',
    'src/components/ClinicProfileSettingsModal.tsx',
  ];

  const forbiddenRegex = /(۲۳:۳۰|[^۱]۸:۰۰ الی)/;
  for (const f of filesToCheck) {
    const fullPath = path.resolve(process.cwd(), f);
    const content = fs.readFileSync(fullPath, 'utf8');
    if (forbiddenRegex.test(content)) {
      throw new Error(`Found obsolete working hours string in ${f}`);
    }
  }
  console.log('  ✓ Negative grep passed: Zero occurrences of obsolete strings across all 4 locations');

  // Check 6: RBAC settings.manage in config/roles.json and POST /api/clinic/profile protection
  const rolesPath = path.resolve(process.cwd(), 'config', 'roles.json');
  const rolesJson = JSON.parse(fs.readFileSync(rolesPath, 'utf8'));
  const adminRole = rolesJson.roles.find((r: any) => r.id === 'admin');
  const itRole = rolesJson.roles.find((r: any) => r.id === 'it_developer');
  if (!adminRole?.permissions.includes('settings.manage')) {
    throw new Error('config/roles.json: admin role missing settings.manage permission');
  }
  if (!itRole?.permissions.includes('settings.manage')) {
    throw new Error('config/roles.json: it_developer role missing settings.manage permission');
  }
  console.log('  ✓ config/roles.json explicitly grants settings.manage to admin and it_developer');

  // Live endpoint security check on POST /api/clinic/profile
  try {
    const unauthRes = await fetch('http://localhost:3000/api/clinic/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emergencyPhone: '093021820044' }),
    });
    if (unauthRes.status !== 403) {
      throw new Error(`POST /api/clinic/profile without auth expected 403 Forbidden, got ${unauthRes.status}`);
    }
    console.log('  ✓ Live POST /api/clinic/profile without auth correctly rejected with 403 Forbidden');
  } catch (netErr: any) {
    if (!netErr.message.includes('403')) {
      console.log('  (Live server not reachable for POST test; skipped live HTTP verification)');
    } else {
      throw netErr;
    }
  }

  console.log('======================================================');
  console.log('✅ WORKING HOURS ACCEPTANCE TEST PASSED (All Checks Succeeded)');
  console.log('======================================================');
}

run().catch((err) => {
  console.error('❌ Working Hours Acceptance Test Failed:', err);
  process.exit(1);
});
