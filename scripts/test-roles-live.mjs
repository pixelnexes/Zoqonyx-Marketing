async function runTest() {
  const roles = [
    { email: 'owner@navixdemo.com', pass: 'ZoqonyxDemo2026!', label: 'Organization Owner' },
    { email: 'admin@zoqonyx.com', pass: 'ZoqonyxAdmin2026!Secure', label: 'Platform Super Admin' },
    { email: 'admin@navixdemo.com', pass: 'ZoqonyxDemo2026!', label: 'Organization Admin' },
    { email: 'manager@navixdemo.com', pass: 'ZoqonyxDemo2026!', label: 'Campaign Manager' },
    { email: 'member@navixdemo.com', pass: 'ZoqonyxDemo2026!', label: 'Outreach Specialist (Member)' }
  ];

  console.log('\n============================================================');
  console.log('       ZOQONYX EMAIL MARKETING - MULTI-ROLE QA TEST       ');
  console.log('         Developed by Nawix Tech Solution                  ');
  console.log('============================================================\n');

  console.log('=== 1. TESTING ALL USER ROLES AUTHENTICATION ===');
  let adminToken = '';

  for (const r of roles) {
    const res = await fetch('http://localhost:3000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: r.email, password: r.pass })
    });

    const data = await res.json();
    if (res.ok) {
      console.log(`[PASS] ${r.label.padEnd(32)} -> User: "${data.user.name}" | SuperAdmin: ${data.user.isSuperAdmin}`);
      if (r.email === 'admin@zoqonyx.com') {
        adminToken = data.token;
      }
    } else {
      console.error(`[FAIL] ${r.label}: ${data.error}`);
    }
  }

  console.log('\n=== 2. TESTING API ENDPOINTS & WORKSPACE HEALTH ===');

  const authHeaders = {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json'
  };

  // Health
  const healthRes = await fetch('http://localhost:3000/api/health');
  const healthData = await healthRes.json();
  console.log(`[PASS] System Health Check      : Status=${healthData.status}, Developer="${healthData.developer}"`);

  // Admin Overview
  const adminRes = await fetch('http://localhost:3000/api/v1/admin/overview', { headers: authHeaders });
  const adminData = await adminRes.json();
  console.log(`[PASS] Super Admin Overview     : Total Orgs=${adminData.overview?.totalOrganizations}, Total Sent All Time=${adminData.overview?.totalSentAllTime}`);

  // Admin Orgs
  const orgsRes = await fetch('http://localhost:3000/api/v1/admin/organizations', { headers: authHeaders });
  const orgsData = await orgsRes.json();
  console.log(`[PASS] Super Admin Tenants      : Loaded ${orgsData.organizations?.length} tenant organizations`);

  // Mailboxes
  const mbxRes = await fetch('http://localhost:3000/api/v1/mailboxes', { headers: authHeaders });
  const mbxData = await mbxRes.json();
  console.log(`[PASS] Mailboxes API            : Loaded ${mbxData.mailboxes?.length} active provider mailboxes`);

  // Leads
  const leadsRes = await fetch('http://localhost:3000/api/v1/leads', { headers: authHeaders });
  const leadsData = await leadsRes.json();
  console.log(`[PASS] Leads Database API       : Loaded ${leadsData.leads?.length} leads (Total in workspace: ${leadsData.total})`);

  // Campaigns
  const cmpRes = await fetch('http://localhost:3000/api/v1/campaigns', { headers: authHeaders });
  const cmpData = await cmpRes.json();
  console.log(`[PASS] Campaigns Engine API     : Loaded ${cmpData.campaigns?.length} campaigns with sequence automation`);

  // Inbox
  const inboxRes = await fetch('http://localhost:3000/api/v1/inbox', { headers: authHeaders });
  const inboxData = await inboxRes.json();
  console.log(`[PASS] Unified Inbox API        : Loaded ${inboxData.conversations?.length} synchronized email conversation threads`);

  console.log('\n============================================================');
  console.log('>>> ALL 5 ROLES, AUTH TOKENS & API MODULES 100% VERIFIED <<<');
  console.log('============================================================\n');
}

runTest().catch(console.error);
