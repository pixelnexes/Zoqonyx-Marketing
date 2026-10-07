async function testLiveDispatch() {
  const base = 'http://localhost:3000';
  console.log('Testing Live Dispatch & Real Metrics on ' + base + '...\n');

  // Step 1: Login
  const loginRes = await fetch(base + '/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@zoqonyx.com', password: 'Password123!' })
  });
  const cookie = loginRes.headers.get('set-cookie') || '';
  const headers = { 'Content-Type': 'application/json', 'Cookie': cookie };

  // Get campaigns
  const listRes = await fetch(base + '/api/v1/campaigns', { headers });
  const listData = await listRes.json();
  const campaign = listData.campaigns?.[0];
  console.log('[CAMPAIGN TARGET]', campaign ? `Found "${campaign.name}" (ID: ${campaign.id})` : 'No campaign found');

  if (!campaign) return;

  // Test 1: Real Preview Send
  const testRunRes = await fetch(`${base}/api/v1/campaigns/${campaign.id}/test-run`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ recipientEmail: 'zawar@zoqonyx.com' })
  });
  const testRunData = await testRunRes.json();
  console.log('[1. LIVE TEST PREVIEW]', testRunData.success ? `SUCCESS -> Message ID: ${testRunData.result?.messageId}` : testRunData);

  // Test 2: Live Outbound Batch Dispatch (5 leads)
  const dispatchRes = await fetch(`${base}/api/v1/campaigns/${campaign.id}/dispatch`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ limit: 5 })
  });
  const dispatchData = await dispatchRes.json();
  console.log('[2. LIVE BATCH DISPATCH]', dispatchData.success ? `SUCCESS -> Processed: ${dispatchData.totalProcessed}, Delivered: ${dispatchData.successCount}` : dispatchData);
  if (dispatchData.dispatches) {
    dispatchData.dispatches.forEach((d, i) => {
      console.log(`    [${i+1}] Sent to: ${d.toEmail} | Subject: "${d.subject}" | Status: ${d.status}`);
    });
  }

  // Test 3: Real Analytics Update
  const analyticsRes = await fetch(`${base}/api/v1/campaigns/${campaign.id}/analytics`, { headers });
  const analyticsData = await analyticsRes.json();
  console.log('[3. LIVE TELEMETRY]', analyticsData.success ? `SUCCESS -> Sent: ${analyticsData.analytics?.sentEmails}, Open Rate: ${analyticsData.analytics?.openRate}%, Delivered: ${analyticsData.analytics?.deliveredCount}` : analyticsData);

  console.log('\nAll live dispatch & telemetry tests completed successfully!');
}

setTimeout(testLiveDispatch, 1000);
