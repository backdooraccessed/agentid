import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load env from .env.local
const envPath = join(__dirname, '..', 'apps', 'dashboard', '.env.local');
const envContent = readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...vals] = line.split('=');
  if (key && vals.length) env[key.trim()] = vals.join('=').trim();
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 1. Get issuer
console.log('Checking for existing issuer...');
const { data: issuer, error: issuerError } = await supabase
  .from('issuers')
  .select('*')
  .limit(1)
  .single();

if (issuerError || !issuer) {
  console.log('No issuer found. Error:', issuerError?.message);
  console.log('Please register via the dashboard first.');
  process.exit(1);
}

console.log('Found issuer:', issuer.name, '(id:', issuer.id, ')');
console.log('Verified:', issuer.is_verified);

// 2. Check for existing credentials
const { data: existingCreds } = await supabase
  .from('credentials')
  .select('id, agent_name, agent_id, status')
  .eq('issuer_id', issuer.id)
  .limit(5);

console.log('\nExisting credentials:');
if (existingCreds && existingCreds.length > 0) {
  existingCreds.forEach(c => {
    console.log(`  - ${c.agent_name} (${c.agent_id}) - ${c.status}`);
    console.log(`    ID: ${c.id}`);
  });

  const activeCred = existingCreds.find(c => c.status === 'active');
  if (activeCred) {
    console.log('\n✓ Use this credential ID for testing:', activeCred.id);
  }
} else {
  console.log('  No credentials found. Create one via the dashboard at /credentials/new');
}
