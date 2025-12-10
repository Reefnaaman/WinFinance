// Test script for full email to lead creation
const emailContent = `התקבל ליד חדש מקמפיין - קוואלטי -בדיקת ביטוח מעל 100 מגיל 30 עד 60
התקבל ליד בעזרת טלפנית בשם - נטשה פרומסון
פרטים
שם מלא: בקה לנקילובי
כתובת מלאה: בת ים 26
טלפון נייד: 0522021972
הערות: הראל, תעשיה , מבת ים רווק , 200 צהרים`;

const testFullEmailCreation = async () => {
  try {
    console.log('🧪 Testing full email-to-lead creation...');
    console.log('');

    const response = await fetch('http://localhost:3003/api/create-lead-from-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        emailContent: emailContent,
        sourceName: 'קוואלטי - בדיקת ביטוח',
        autoCreate: true
      }),
    });

    const data = await response.json();

    console.log('✅ Creation result:');
    console.log(JSON.stringify(data, null, 2));

    if (data.success && data.created) {
      console.log('');
      console.log('🎉 Lead created successfully!');
      console.log(`📋 Lead ID: ${data.lead.id}`);
      console.log(`👤 Name: ${data.lead.lead_name}`);
      console.log(`📞 Phone: ${data.lead.phone}`);
      console.log(`📧 Source: ${data.lead.source}`);
      console.log(`📝 Status: ${data.lead.relevance_status}`);
      console.log(`📅 Created: ${new Date(data.lead.created_at).toLocaleString('he-IL')}`);
    } else {
      console.log('❌ Creation failed:', data.error);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

testFullEmailCreation();