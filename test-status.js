const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.log('❌ Missing environment variables')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function testStatusUpdate() {
  console.log('🧪 Testing status update with new values...')

  try {
    // First get a lead to test with
    const { data: leads, error: fetchError } = await supabase
      .from('leads')
      .select('id, lead_name, status')
      .limit(1)

    if (fetchError) {
      console.error('❌ Could not fetch leads:', fetchError.message)
      return
    }

    if (!leads || leads.length === 0) {
      console.log('⚠️ No leads found in database')
      return
    }

    const testLead = leads[0]
    console.log(`📋 Testing with lead: ${testLead.lead_name} (current status: ${testLead.status})`)

    // Try to update with one of the new status values
    const newStatus = 'אין מענה - לתאם מחדש'
    console.log(`🔄 Trying to set status to: ${newStatus}`)

    const { data, error } = await supabase
      .from('leads')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', testLead.id)
      .select()

    if (error) {
      console.error('❌ Status update failed:', error.message)
      console.log('')
      console.log('🛠️ This confirms the enum needs to be updated in the database.')
      console.log('Please run these SQL commands in Supabase SQL Editor:')
      console.log('')
      console.log("ALTER TYPE lead_status_enum ADD VALUE 'אין מענה - לתאם מחדש';")
      console.log("ALTER TYPE lead_status_enum ADD VALUE 'התקיימה - נכשל';")
      console.log("ALTER TYPE lead_status_enum ADD VALUE 'התקיימה - נחתם';")
      console.log("ALTER TYPE lead_status_enum ADD VALUE 'התקיימה - במעקב';")
      console.log('')
      console.log('After running these commands, the status dropdowns should work correctly.')
    } else {
      console.log('✅ Status update successful!')
      console.log('Updated lead:', data)

      // Revert back to original status
      await supabase
        .from('leads')
        .update({
          status: testLead.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', testLead.id)
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testStatusUpdate()