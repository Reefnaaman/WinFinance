const { createClient } = require('@supabase/supabase-js')

// You'll need to replace these with your actual Supabase URL and service role key
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.log('❌ Please set the following environment variables:')
  console.log('NEXT_PUBLIC_SUPABASE_URL')
  console.log('SUPABASE_SERVICE_ROLE_KEY')
  console.log('')
  console.log('Run the script like this:')
  console.log('NEXT_PUBLIC_SUPABASE_URL="your_url" SUPABASE_SERVICE_ROLE_KEY="your_key" node setup-database.js')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function setupDatabase() {
  console.log('🚀 Setting up WinFinance database...')

  try {
    // 1. Create agents table (if not exists)
    console.log('📋 Creating agents table...')

    const { error: tableError } = await supabase.rpc('create_agents_table', {})

    if (tableError && !tableError.message.includes('already exists')) {
      // If the RPC doesn't exist, create the table directly
      console.log('Creating table with direct SQL...')

      const { error: createError } = await supabase
        .from('agents')
        .select('id')
        .limit(1)

      if (createError && createError.message.includes('does not exist')) {
        console.log('❌ Agents table does not exist. Please create it manually in Supabase:')
        console.log(`
CREATE TABLE public.agents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT CHECK (role IN ('admin', 'coordinator', 'agent')) DEFAULT 'agent',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users" ON public.agents
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for service role" ON public.agents
    FOR INSERT WITH CHECK (true);
        `)
        return
      }
    }

    // 2. Seed initial users
    console.log('👥 Seeding initial users...')

    const initialUsers = [
      {
        name: 'פלג',
        email: 'peleg@winfinance.com',
        role: 'admin'
      },
      {
        name: 'לאה',
        email: 'leah@winfinance.com',
        role: 'coordinator'
      },
      {
        name: 'יקיר',
        email: 'yakir@winfinance.com',
        role: 'agent'
      },
      {
        name: 'עידן',
        email: 'idan@winfinance.com',
        role: 'agent'
      },
      {
        name: 'דור',
        email: 'dor@winfinance.com',
        role: 'agent'
      },
      {
        name: 'עדי',
        email: 'adi@winfinance.com',
        role: 'agent'
      },
      {
        name: 'אוריאל',
        email: 'oriel@winfinance.com',
        role: 'agent'
      }
    ]

    for (const user of initialUsers) {
      console.log(`Adding user: ${user.name} (${user.role})`)

      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('agents')
        .select('id')
        .eq('email', user.email)
        .single()

      if (!existingUser) {
        const { error } = await supabase
          .from('agents')
          .insert([user])

        if (error) {
          console.log(`⚠️ Could not add ${user.name}: ${error.message}`)
        } else {
          console.log(`✅ Added ${user.name}`)
        }
      } else {
        console.log(`👤 ${user.name} already exists`)
      }
    }

    // 3. Create Supabase auth users (for login)
    console.log('🔐 Creating auth users...')

    for (const user of initialUsers) {
      const { data: authUser, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: 'WinFinance2025!', // Default password - users should change this
        email_confirm: true
      })

      if (error && !error.message.includes('already been registered')) {
        console.log(`⚠️ Could not create auth user for ${user.name}: ${error.message}`)
      } else if (!error) {
        console.log(`🔑 Created auth user for ${user.name}`)
      } else {
        console.log(`🔑 Auth user for ${user.name} already exists`)
      }
    }

    console.log('✨ Database setup completed!')
    console.log('')
    console.log('📧 Default login credentials:')
    console.log('Admin: peleg@winfinance.com / WinFinance2025!')
    console.log('Coordinator: leah@winfinance.com / WinFinance2025!')
    console.log('Agents: yakir@winfinance.com (+ others) / WinFinance2025!')
    console.log('')
    console.log('⚠️ Please change the default passwords after first login!')

  } catch (error) {
    console.error('❌ Error setting up database:', error.message)
  }
}

setupDatabase()