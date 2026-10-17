const BASE = process.env.SMOKE_BASE_URL || 'https://mehreganpetclinic.ir';

async function check(name, path, expectedStatus) {
  try {
    const res = await fetch(`${BASE}${path}`);
    const isExpected = Array.isArray(expectedStatus)
      ? expectedStatus.includes(res.status)
      : res.status === expectedStatus;
    return {
      name,
      status: res.status,
      expectedStatus,
      ok: isExpected,
    };
  } catch (err) {
    return {
      name,
      status: 0,
      expectedStatus,
      ok: false,
      error: err.message,
    };
  }
}

async function run() {
  const checks = await Promise.all([
    check('health', '/api/health', 200),
    check('data-version', '/api/data-version', 200),
    check('patients', '/api/patients', 401),
    check('owners', '/api/owners', 401),
    check('vaccinations', '/api/vaccinations', 401),
    check('staff', '/api/staff', [401, 403]),
  ]);

  const allOk = checks.every((c) => c.ok);
  console.log(JSON.stringify({ success: allOk, base: BASE, checks }, null, 2));
  if (!allOk) {
    process.exit(1);
  }
}

run();
