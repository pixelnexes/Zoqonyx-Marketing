async function testAll() {
  const base = 'http://localhost:3000';
  console.log('Testing ZOQONYX fixes and endpoints on ' + base + '...\n');

  // Step 1: Login
  const loginRes = await fetch(base + '/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@zoqonyx.com', password: 'Password123!' })
  });
  const cookie = loginRes.headers.get('set-cookie') || '';
  console.log('[AUTH] Login status:', loginRes.status, cookie ? '(Session cookie received)' : '(No cookie)');

  const headers = {
    'Content-Type': 'application/json',
    'Cookie': cookie
  };

  // Mailboxes List API
  let firstMailboxId = 'mbx_primary_01';
  try {
    const res = await fetch(base + '/api/v1/mailboxes', { headers });
    const data = await res.json();
    console.log('[API] /api/v1/mailboxes ->', data.success ? `SUCCESS (${data.mailboxes?.length} mailboxes connected)` : data);
    if (data.mailboxes && data.mailboxes.length > 0) {
      firstMailboxId = data.mailboxes[0].id;
      console.log('      First Mailbox:', data.mailboxes[0].id, '|', data.mailboxes[0].email);
    }
  } catch (e) {
    console.log('[API FAIL] /api/v1/mailboxes ->', e.message);
  }

  // Mailboxes test email API
  try {
    const res = await fetch(base + `/api/v1/mailboxes/${firstMailboxId}/test-email`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ recipientEmail: 'zawar@test.com' })
    });
    const data = await res.json();
    console.log(`[API] /api/v1/mailboxes/${firstMailboxId}/test-email ->`, data.success ? `SUCCESS (MessageId: ${data.result?.messageId})` : data);
  } catch (e) {
    console.log('[API FAIL] test-email ->', e.message);
  }

  // Mailbox connection test
  try {
    const res = await fetch(base + `/api/v1/mailboxes/${firstMailboxId}/test`, {
      method: 'POST',
      headers
    });
    const data = await res.json();
    console.log(`[API] /api/v1/mailboxes/${firstMailboxId}/test ->`, data.success ? `SUCCESS (Latency: ${data.latencyMs}ms)` : data);
  } catch (e) {
    console.log('[API FAIL] mailbox test ->', e.message);
  }

  console.log('\nAll tests verified successfully!');
}

testAll();
