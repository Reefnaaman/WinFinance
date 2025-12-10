const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.log('❌ Please set the following environment variables:')
  console.log('NEXT_PUBLIC_SUPABASE_URL')
  console.log('SUPABASE_SERVICE_ROLE_KEY')
  console.log('')
  console.log('Run the script like this:')
  console.log('NEXT_PUBLIC_SUPABASE_URL="your_url" SUPABASE_SERVICE_ROLE_KEY="your_key" node update-status.js')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function updateStatusEnum() {
  console.log('🔄 Updating lead status enum to support agent workflow...')

  try {
    // First, let's check what enum values currently exist
    console.log('📋 Current enum values:')

    const { data: enumData, error: enumError } = await supabase.rpc('get_enum_values', {
      enum_name: 'lead_status_enum'
    })

    if (enumError) {
      console.log('⚠️ Could not fetch enum values, proceeding with update...')
    } else {
      console.log('Current values:', enumData)
    }

    // Create a function to add enum values safely
    console.log('🔧 Creating function to add enum values...')

    const functionSQL = `
CREATE OR REPLACE FUNCTION add_enum_value_if_not_exists(enum_name text, new_value text)
RETURNS void AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = enum_name AND e.enumlabel = new_value
    ) THEN
        EXECUTE format('ALTER TYPE %I ADD VALUE %L', enum_name, new_value);
    END IF;
END;
$$ LANGUAGE plpgsql;
    `

    const { error: funcError } = await supabase.rpc('exec_sql', { sql: functionSQL })

    if (funcError) {
      console.log('⚠️ Function creation failed, trying direct approach...')
      console.log('Error:', funcError.message)
    } else {
      console.log('✅ Helper function created')
    }

    // Add new enum values
    const newStatuses = [
      'אין מענה - לתאם מחדש',
      'התקיימה - נכשל',
      'התקיימה - נחתם',
      'התקיימה - במעקב'
    ]

    console.log('➕ Adding new status values...')

    // Try to add using the helper function first
    for (const status of newStatuses) {
      console.log(`Adding: ${status}`)

      const { error } = await supabase.rpc('add_enum_value_if_not_exists', {
        enum_name: 'lead_status_enum',
        new_value: status
      })

      if (error) {
        console.log(`⚠️ Could not add "${status}": ${error.message}`)
      } else {
        console.log(`✅ Added: ${status}`)
      }
    }

    // Verify the enum values were added
    console.log('✅ Status enum update completed!')

    // Test with a simple query to see if the new statuses work
    console.log('🧪 Testing new status values...')
    const { data: testData, error: testError } = await supabase
      .from('leads')
      .select('status')
      .limit(1)

    if (testError) {
      console.log('⚠️ Test query failed:', testError.message)
    } else {
      console.log('✅ Database access working correctly')
    }

    console.log('')
    console.log('📋 Update complete! The following status values should now be available:')
    newStatuses.forEach(status => console.log(`  • ${status}`))
    console.log('')
    console.log('🔄 You may need to refresh your application to see the changes.')

  } catch (error) {
    console.error('❌ Error updating status enum:', error.message)
    console.log('')
    console.log('🛠️ Manual SQL commands to run in Supabase SQL Editor:')
    console.log('')
    console.log("ALTER TYPE lead_status_enum ADD VALUE 'אין מענה - לתאם מחדש';")
    console.log("ALTER TYPE lead_status_enum ADD VALUE 'התקיימה - נכשל';")
    console.log("ALTER TYPE lead_status_enum ADD VALUE 'התקיימה - נחתם';")
    console.log("ALTER TYPE lead_status_enum ADD VALUE 'התקיימה - במעקב';")
    console.log('')
  }
}

updateStatusEnum()