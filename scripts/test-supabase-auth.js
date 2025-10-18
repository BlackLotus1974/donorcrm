/**
 * Test Supabase Authentication Configuration
 *
 * This script tests:
 * 1. Sign-up functionality
 * 2. Email confirmation settings
 * 3. Auth response structure
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://flqgkpytrqpkqmedmtuf.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZscWdrcHl0cnFwa3FtZWRtdHVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2OTU0NDgsImV4cCI6MjA3NjI3MTQ0OH0.tK3fERyqheOxtFSICkHuU0aVLzg9AwXgnECAPElgBXg';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAuth() {
  console.log('🔍 Testing Supabase Authentication Configuration\n');
  console.log('📍 Supabase URL:', supabaseUrl);
  console.log('🔑 Using Anon Key:', supabaseAnonKey.substring(0, 20) + '...\n');

  // Test email for sign-up
  const testEmail = `test-diagnostic-${Date.now()}@gmail.com`;
  const testPassword = 'TestPassword123!';

  console.log('📧 Test Email:', testEmail);
  console.log('🔐 Test Password:', testPassword);
  console.log('\n' + '='.repeat(60) + '\n');

  try {
    console.log('1️⃣ Attempting to sign up...\n');

    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    });

    if (error) {
      console.error('❌ Sign-up Error:', error.message);
      console.error('   Status:', error.status);
      console.error('   Full error:', JSON.stringify(error, null, 2));
      return;
    }

    console.log('✅ Sign-up API call succeeded!\n');

    // Analyze the response
    console.log('📊 Response Analysis:');
    console.log('   User exists:', !!data.user);
    console.log('   Session exists:', !!data.session);
    console.log('   User ID:', data.user?.id);
    console.log('   User email:', data.user?.email);
    console.log('   Email confirmed:', data.user?.email_confirmed_at ? 'YES' : 'NO');
    console.log('   Created at:', data.user?.created_at);

    console.log('\n📝 Full Response:');
    console.log(JSON.stringify({
      user: data.user ? {
        id: data.user.id,
        email: data.user.email,
        email_confirmed_at: data.user.email_confirmed_at,
        created_at: data.user.created_at,
        confirmed_at: data.user.confirmed_at,
      } : null,
      session: data.session ? {
        access_token: data.session.access_token?.substring(0, 20) + '...',
        refresh_token: data.session.refresh_token?.substring(0, 20) + '...',
        expires_at: data.session.expires_at,
      } : null,
    }, null, 2));

    console.log('\n' + '='.repeat(60));
    console.log('\n🎯 DIAGNOSIS:\n');

    if (data.user && data.session) {
      console.log('✅ Email confirmation is DISABLED');
      console.log('   → User is immediately logged in');
      console.log('   → Tests should work!');
    } else if (data.user && !data.session) {
      console.log('⚠️  Email confirmation is ENABLED');
      console.log('   → User created but no session');
      console.log('   → Email confirmation required');
      console.log('   → Tests will fail until this is disabled');
    } else {
      console.log('❓ Unexpected state');
      console.log('   → Need to investigate further');
    }

  } catch (error) {
    console.error('\n💥 Unexpected error:', error);
  }
}

testAuth();
