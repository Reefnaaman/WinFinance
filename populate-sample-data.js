// Sample Data Population Script for Lead Management System
// Based on real data provided by user

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://evevxcynppowloshvtcy.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Sample agents based on the real data
const agents = [
  { name: 'פלג', email: 'peleg@example.com', role: 'admin' },
  { name: 'לאה', email: 'leah@example.com', role: 'coordinator' },
  { name: 'עדי בראל', email: 'adi@example.com', role: 'agent' },
  { name: 'יקיר', email: 'yakir@example.com', role: 'agent' },
  { name: 'דור', email: 'dor@example.com', role: 'agent' },
  { name: 'עידן', email: 'idan@example.com', role: 'agent' }
];

// Sample leads based on real Excel data
const sampleLeads = [
  {
    lead_name: 'שמריה אלחדד',
    phone: '052-7027111',
    email: 'shmaria@example.com',
    source: 'Manual',
    relevance_status: 'רלוונטי',
    status: 'תואם',
    agent_name: 'עדי בראל',
    meeting_date: '2024-12-15T17:00:00',
    agent_notes: 'תוזכר - עצמאי - ישלח לעדי הפוליסה'
  },
  {
    lead_name: 'אסי הר',
    phone: '054-6568279',
    email: 'asi@example.com',
    source: 'Email',
    relevance_status: 'רלוונטי',
    status: 'תואם',
    agent_name: 'יקיר',
    meeting_date: '2024-12-17T17:30:00',
    agent_notes: 'במעקב עם יקיר'
  },
  {
    lead_name: 'חן שחר',
    phone: '054-7626226',
    email: 'chen@example.com',
    source: 'Google Sheet',
    relevance_status: 'לא רלוונטי',
    status: 'לקוח לא רצה',
    agent_name: null,
    agent_notes: 'יש לו חברה שמטפלת - לא מעוניין לשמוע חוות דעת'
  },
  {
    lead_name: 'הדס שורר',
    phone: '054-5801155',
    email: 'hadas@example.com',
    source: 'Manual',
    relevance_status: 'רלוונטי',
    status: 'תואם',
    agent_name: 'עדי בראל',
    meeting_date: '2024-10-28T17:00:00',
    agent_notes: 'התקיים מעקב'
  },
  {
    lead_name: 'אלכסנדר דימיטרי',
    phone: '053-3636670',
    email: 'alex@example.com',
    source: 'Email',
    relevance_status: 'רלוונטי',
    status: 'עסקה נסגרה',
    agent_name: 'פלג',
    meeting_date: '2024-10-29T11:30:00',
    agent_notes: 'במעקב להוציא הצעה מחלות קשות - נמכר'
  },
  {
    lead_name: 'יאיר חזן',
    phone: '054-4674248',
    email: 'yair@example.com',
    source: 'Manual',
    relevance_status: 'רלוונטי',
    status: 'לקוח לא רצה',
    agent_name: 'פלג',
    meeting_date: '2024-11-26T16:00:00',
    agent_notes: 'קצת לא אפוי לא רצה לתת פרטים'
  },
  {
    lead_name: 'אביעד יוסף',
    phone: '050-0000000',
    email: 'aviad@example.com',
    source: 'Google Sheet',
    relevance_status: 'רלוונטי',
    status: 'לא תואם',
    agent_name: 'דור',
    agent_notes: 'אין מענה מספר פעמים'
  },
  {
    lead_name: 'אורית מכלוף',
    phone: '052-8655600',
    email: 'orit@example.com',
    source: 'Email',
    relevance_status: 'רלוונטי',
    status: 'לקוח לא רצה',
    agent_name: null,
    agent_notes: 'לא רצתה - נשלח ווצאפ'
  },
  {
    lead_name: 'חזי יהושוע',
    phone: '050-8333267',
    email: 'hazi@example.com',
    source: 'Manual',
    relevance_status: 'רלוונטי',
    status: 'תואם',
    agent_name: 'דור',
    meeting_date: '2024-11-24T16:00:00',
    agent_notes: 'עסק ירקות - אחרי 16:00'
  },
  {
    lead_name: 'אביגיל כהן אדרי',
    phone: '052-5596868',
    email: 'avigail@example.com',
    source: 'Email',
    relevance_status: 'לא רלוונטי',
    status: 'לקוח לא רצה',
    agent_name: null,
    agent_notes: 'שלחה ווצאפ שלא מעוניינת בשלב זה'
  },
  {
    lead_name: 'רותי צוקר',
    phone: '052-3781837',
    email: 'ruti@example.com',
    source: 'Manual',
    relevance_status: 'רלוונטי',
    status: 'תואם',
    agent_name: 'עדי בראל',
    meeting_date: '2024-11-26T16:30:00',
    agent_notes: 'תואמה לעדי'
  },
  {
    lead_name: 'נטלי פיצרסקי',
    phone: '052-7465959',
    email: 'natalie@example.com',
    source: 'Google Sheet',
    relevance_status: 'רלוונטי',
    status: 'תואם',
    agent_name: 'עדי בראל',
    meeting_date: '2024-10-28T16:15:00',
    agent_notes: 'רוצה לדבר עם הסוכן שלה עדי בראל'
  },
  {
    lead_name: 'עומר גולדשטיין',
    phone: '052-3133239',
    email: 'omer@example.com',
    source: 'Email',
    relevance_status: 'רלוונטי',
    status: 'תואם',
    agent_name: 'יקיר',
    meeting_date: '2024-11-25T15:00:00',
    agent_notes: 'לתאם מחדש'
  },
  {
    lead_name: 'מורן זוילי',
    phone: '050-2609006',
    email: 'moran@example.com',
    source: 'Manual',
    relevance_status: 'ממתין לבדיקה',
    status: null,
    agent_name: null,
    agent_notes: 'גננת נשלח ווצאפ'
  },
  {
    lead_name: 'מאיר והבה',
    phone: '052-4132225',
    email: 'meir@example.com',
    source: 'Google Sheet',
    relevance_status: 'רלוונטי',
    status: 'תואם',
    agent_name: 'עדי בראל',
    meeting_date: '2024-10-30T17:00:00',
    agent_notes: 'במעקב -קבעו פרונטלי'
  }
];

async function populateData() {
  console.log('🚀 Starting data population...');

  try {
    // Get existing agents
    console.log('📝 Fetching existing agents...');
    const { data: agentsData, error: agentsError } = await supabase
      .from('agents')
      .select('*');

    if (agentsError) {
      console.error('Error fetching agents:', agentsError);
      return;
    }

    console.log('✅ Found existing agents:', agentsData.length);

    // Create agent name to ID mapping
    const agentMap = {};
    agentsData.forEach(agent => {
      agentMap[agent.name] = agent.id;
    });

    // Prepare leads data with agent IDs
    const leadsWithAgentIds = sampleLeads.map(lead => {
      const leadData = {
        lead_name: lead.lead_name,
        phone: lead.phone,
        email: lead.email,
        source: lead.source,
        relevance_status: lead.relevance_status,
        status: lead.status,
        agent_notes: lead.agent_notes,
        meeting_date: lead.meeting_date,
        assigned_agent_id: lead.agent_name ? agentMap[lead.agent_name] : null
      };

      return leadData;
    });

    // Insert leads
    console.log('📝 Inserting leads...');
    const { data: leadsData, error: leadsError } = await supabase
      .from('leads')
      .insert(leadsWithAgentIds)
      .select();

    if (leadsError) {
      console.error('Error inserting leads:', leadsError);
      return;
    }

    console.log('✅ Leads inserted successfully');
    console.log(`📊 Summary:`);
    console.log(`   - ${agentsData.length} agents created`);
    console.log(`   - ${leadsData.length} leads created`);
    console.log('🎉 Data population completed!');

  } catch (error) {
    console.error('❌ Error during data population:', error);
  }
}

// Run the population script
populateData();