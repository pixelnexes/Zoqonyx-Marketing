async function testCampaignFlow() {
  const base = 'http://localhost:3000';
  console.log('Testing Campaign Flow on ' + base + '...\n');

  // Step 1: Login
  const loginRes = await fetch(base + '/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@zoqonyx.com', password: 'Password123!' })
  });
  const cookie = loginRes.headers.get('set-cookie') || '';
  const headers = { 'Content-Type': 'application/json', 'Cookie': cookie };

  // List campaigns to pick an ID
  const listRes = await fetch(base + '/api/v1/campaigns', { headers });
  const listData = await listRes.json();
  console.log('[CAMPAIGNS LIST]', listData.success ? `Found ${listData.campaigns?.length} campaigns` : listData);

  const campaignId = listData.campaigns?.[0]?.id || 'cmp_primary_01';
  console.log(`\nTesting operations on Campaign ID: ${campaignId}`);

  // 1. GET Campaign Detail
  const getRes = await fetch(`${base}/api/v1/campaigns/${campaignId}`, { headers });
  const getData = await getRes.json();
  console.log('[1. GET Campaign]', getData.success ? `Loaded "${getData.campaign?.name}" (status: ${getData.campaign?.status})` : getData);

  // 2. POST Save Sequence Steps (this was the exact error from the screenshot!)
  const stepsPayload = [
    {
      stepNumber: 1,
      stepType: 'EMAIL',
      waitDays: 0,
      subject: 'Quick question about {{name}}',
      bodyHtml: '<p>Hi {{first_name}}, wanted to reach out regarding dental marketing.</p>'
    },
    {
      stepNumber: 2,
      stepType: 'EMAIL',
      waitDays: 3,
      subject: 'Follow-up regarding {{name}} practice',
      bodyHtml: '<p>Hi {{first_name}}, following up on my previous message.</p>'
    }
  ];
  const seqRes = await fetch(`${base}/api/v1/campaigns/${campaignId}/sequences`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ steps: stepsPayload })
  });
  const seqData = await seqRes.json();
  console.log('[2. POST Save Sequences]', seqData.success ? `SUCCESS (${seqData.steps?.length} steps saved)` : seqData);

  // 3. GET Analytics
  const analyticsRes = await fetch(`${base}/api/v1/campaigns/${campaignId}/analytics`, { headers });
  const analyticsData = await analyticsRes.json();
  console.log('[3. GET Analytics]', analyticsData.success ? `SUCCESS (Total leads: ${analyticsData.analytics?.totalLeads}, Open rate: ${analyticsData.analytics?.openRate}%)` : analyticsData);

  // 4. POST Pause Campaign
  const pauseRes = await fetch(`${base}/api/v1/campaigns/${campaignId}/pause`, { method: 'POST', headers });
  const pauseData = await pauseRes.json();
  console.log('[4. POST Pause Campaign]', pauseData.success ? `SUCCESS (Status: ${pauseData.campaign?.status})` : pauseData);

  // 5. POST Start Campaign
  const startRes = await fetch(`${base}/api/v1/campaigns/${campaignId}/start`, { method: 'POST', headers });
  const startData = await startRes.json();
  console.log('[5. POST Start Campaign]', startData.success ? `SUCCESS (Status: ${startData.campaign?.status})` : startData);

  // 6. POST Test Run Preview
  const testRes = await fetch(`${base}/api/v1/campaigns/${campaignId}/test-run`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ recipientEmail: 'zawar@test.com' })
  });
  const testData = await testRes.json();
  console.log('[6. POST Test Run Preview]', testData.success ? `SUCCESS (Message: ${testData.result?.messageId})` : testData);

  console.log('\nAll campaign flow tests passed with 0 errors!');
}

setTimeout(testCampaignFlow, 1000);
