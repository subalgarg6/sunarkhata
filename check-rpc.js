import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://qooxqvlfddpfgeapqcvo.supabase.co',
  'sb_publishable_Y0-2LBnvk_VokfVOR0bGqg_nIqXywl3'
);

async function main() {
  console.log('Executing join_mutual_account...');
  const { data, error } = await supabase.rpc('join_mutual_account', { 
    p_code: 'DUMMYCODE', 
    p_partner_name: 'Test Partner' 
  });
  
  if (error) {
    console.error('RPC Error:', JSON.stringify(error, null, 2));
  } else {
    console.log('RPC Success:', data);
  }
}

main();
