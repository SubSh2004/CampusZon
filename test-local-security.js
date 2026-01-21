/**
 * LOCAL Security Test - Tests localhost server
 */

const API_URL = 'http://localhost:5000'; // Change port if different

async function makeRequest(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, options);
    const headers = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });
    
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }
    
    return {
      status: response.status,
      headers,
      data
    };
  } catch (error) {
    return {
      error: error.message,
      note: 'Is your server running? Start with: cd campuszon-server && npm start'
    };
  }
}

async function runLocalTests() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('      LOCAL SECURITY TESTS (localhost:5000)');
  console.log('═══════════════════════════════════════════════════════\n');

  // Test 1: Check if server is running
  console.log('🔍 Checking if server is running...');
  const health = await makeRequest('/api/health');
  
  if (health.error) {
    console.log('❌ Server not running!');
    console.log(`   ${health.note}`);
    return;
  }
  
  console.log('✅ Server is running!\n');

  // Test 2: Authentication
  console.log('🔐 Testing Authentication...');
  const authTest = await makeRequest('/api/items/add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Test' })
  });
  
  console.log(`Status: ${authTest.status}`);
  console.log(authTest.status === 401 ? '✅ PASS' : '❌ FAIL');
  console.log(`Response: ${JSON.stringify(authTest.data)}\n`);

  // Test 3: Rate Limiting
  console.log('⏱️  Testing Rate Limiting (6 login attempts)...');
  for (let i = 1; i <= 6; i++) {
    const result = await makeRequest('/api/user/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@test.com', password: 'wrong' })
    });
    
    const remaining = result.headers['ratelimit-remaining'];
    console.log(`Attempt ${i}: Status ${result.status}, Remaining: ${remaining || 'N/A'}`);
    
    if (result.status === 429) {
      console.log('✅ Rate limiting works!\n');
      break;
    }
    await new Promise(r => setTimeout(r, 200));
  }

  // Test 4: Security Headers
  console.log('🛡️  Testing Security Headers...');
  const headers = health.headers;
  const checks = {
    'strict-transport-security': headers['strict-transport-security'],
    'x-content-type-options': headers['x-content-type-options'],
    'x-frame-options': headers['x-frame-options'],
    'content-security-policy': headers['content-security-policy']
  };
  
  for (const [name, value] of Object.entries(checks)) {
    console.log(`${value ? '✅' : '❌'} ${name}: ${value || 'MISSING'}`);
  }

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('🎉 Local tests complete!');
  console.log('═══════════════════════════════════════════════════════');
}

runLocalTests().catch(console.error);
