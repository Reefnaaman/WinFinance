const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://evevxcynppowloshvtcy.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.log('❌ Please set SUPABASE_SERVICE_ROLE_KEY environment variable');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAgentsData() {
  console.log('🔍 Checking current agents data...\n');

  try {
    // Get all agents
    const { data: agents, error } = await supabase
      .from('agents')
      .select('*')
      .order('role', { ascending: false });

    if (error) {
      console.error('❌ Error fetching agents:', error);
      return;
    }

    console.log('📊 Current Agents in Database:');
    console.log('=====================================');

    const roleGroups = {
      admin: [],
      coordinator: [],
      agent: []
    };

    agents.forEach(agent => {
      roleGroups[agent.role].push(agent);
    });

    Object.keys(roleGroups).forEach(role => {
      console.log(`\n${role.toUpperCase()}:`);
      if (roleGroups[role].length === 0) {
        console.log('  (none)');
      } else {
        roleGroups[role].forEach(agent => {
          console.log(`  - ${agent.name} (${agent.email})`);
        });
      }
    });

    console.log('\n📋 Summary:');
    console.log(`  Admin: ${roleGroups.admin.length}`);
    console.log(`  Coordinator: ${roleGroups.coordinator.length}`);
    console.log(`  Agents: ${roleGroups.agent.length}`);
    console.log(`  Total: ${agents.length}`);

    // Check role hierarchy compliance
    console.log('\n✅ Role Hierarchy Validation:');
    if (roleGroups.admin.length === 1 && roleGroups.admin[0].name === 'פלג') {
      console.log('  ✓ Admin: פלג is correctly set as admin');
    } else {
      console.log('  ❌ Admin: Should be exactly one admin (פלג)');
    }

    if (roleGroups.coordinator.length === 1 && roleGroups.coordinator[0].name === 'לאה') {
      console.log('  ✓ Coordinator: לאה is correctly set as coordinator');
    } else {
      console.log('  ❌ Coordinator: Should be exactly one coordinator (לאה)');
    }

    if (roleGroups.agent.length > 0) {
      console.log(`  ✓ Agents: ${roleGroups.agent.length} agents found`);
      roleGroups.agent.forEach(agent => {
        console.log(`    - ${agent.name}`);
      });
    } else {
      console.log('  ❌ Agents: No agents found');
    }

  } catch (error) {
    console.error('❌ Error checking agents data:', error);
  }
}

checkAgentsData();