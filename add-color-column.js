const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://evevxcynppowloshvtcy.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2ZXZ4Y3lucHBvd2xvc2h2dGN5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTIxNzQ1MiwiZXhwIjoyMDgwNzkzNDUyfQ.vBg5aRj3O-MyfvqnQMHJu2tVFvKn_S1EpAhfYmgQ8lk';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addColorColumn() {
  try {
    console.log('🎨 Adding color_code column to leads table...');

    // Add the color_code column using raw SQL
    const { error } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE leads ADD COLUMN IF NOT EXISTS color_code TEXT;'
    });

    if (error) {
      console.log('RPC failed, trying direct approach...');
      // Alternative approach - we'll add sample data to test
      const { data, error: testError } = await supabase
        .from('leads')
        .select('id')
        .limit(1);

      if (testError) {
        console.error('❌ Error accessing leads table:', testError.message);
        return;
      }

      console.log('✅ Leads table is accessible. The color_code column should be added via Supabase dashboard.');
      console.log('📝 Please run this SQL in Supabase SQL Editor:');
      console.log('ALTER TABLE leads ADD COLUMN IF NOT EXISTS color_code TEXT;');

      return;
    }

    console.log('✅ Successfully added color_code column!');

  } catch (err) {
    console.error('💥 Unexpected error:', err);
    console.log('📝 Please manually add the color_code column in Supabase dashboard:');
    console.log('ALTER TABLE leads ADD COLUMN IF NOT EXISTS color_code TEXT;');
  }
}

addColorColumn();