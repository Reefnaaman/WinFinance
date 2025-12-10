const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://evevxcynppowloshvtcy.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.log('❌ Please set SUPABASE_SERVICE_ROLE_KEY environment variable');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addLeadSupplierRole() {
  console.log('🔧 Adding lead_supplier role to database enum...\n');

  try {
    // Note: We can't directly alter enum types through the JS client
    // This needs to be done via SQL in Supabase dashboard
    console.log('📋 SQL commands to run in Supabase SQL Editor:');
    console.log('=====================================\n');

    const sqlCommands = `
-- Step 1: Add the new enum value to role_enum
ALTER TYPE role_enum ADD VALUE IF NOT EXISTS 'lead_supplier';

-- Step 2: Verify the enum values
SELECT unnest(enum_range(NULL::role_enum)) AS role_values;

-- Step 3: Optional - Add a sample lead supplier user
INSERT INTO public.agents (name, email, role)
VALUES ('ספק לידים דוגמה', 'supplier@winfinance.com', 'lead_supplier')
ON CONFLICT (email) DO NOTHING;
`;

    console.log(sqlCommands);
    console.log('=====================================\n');

    console.log('📝 Instructions:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to the SQL Editor');
    console.log('3. Copy and paste the SQL commands above');
    console.log('4. Run the commands');
    console.log('5. Come back and run this script again to verify\n');

    // Check current enum values by trying to query the table
    console.log('🔍 Checking current database state...');

    const { data: currentAgents, error } = await supabase
      .from('agents')
      .select('role')
      .limit(1);

    if (error) {
      console.log('❌ Error checking database:', error.message);
    } else {
      console.log('✅ Database connection successful');

      // Try to check if lead_supplier role exists
      const { data: leadSuppliers } = await supabase
        .from('agents')
        .select('*')
        .eq('role', 'lead_supplier');

      if (leadSuppliers && leadSuppliers.length > 0) {
        console.log('✅ lead_supplier role already exists in database!');
        console.log(`   Found ${leadSuppliers.length} lead supplier(s):`);
        leadSuppliers.forEach(supplier => {
          console.log(`   - ${supplier.name} (${supplier.email})`);
        });
      } else {
        console.log('❌ lead_supplier role not yet available in database');
        console.log('   Please run the SQL commands above first');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

addLeadSupplierRole();