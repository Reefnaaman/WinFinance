// Test script for email parsing functionality
const emailContent = `התקבל ליד חדש מקמפיין - קוואלטי -בדיקת ביטוח מעל 100 מגיל 30 עד 60
התקבל ליד בעזרת טלפנית בשם - נטשה פרומסון
פרטים
שם מלא: בקה לנקילובי
כתובת מלאה: בת ים 26
טלפון נייד: 0522021972
הערות: הראל, תעשיה , מבת ים רווק , 200 צהרים`;

const testEmailParsing = async () => {
  try {
    console.log('🧪 Testing email parsing...');
    console.log('📧 Email content:');
    console.log(emailContent);
    console.log('');

    const response = await fetch('http://localhost:3003/api/parse-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        emailContent: emailContent,
        sourceName: 'קוואלטי - בדיקת ביטוח'
      }),
    });

    const data = await response.json();

    console.log('✅ Parsing result:');
    console.log(JSON.stringify(data, null, 2));

    if (data.success && data.parsed) {
      console.log('');
      console.log('📋 Extracted fields:');
      console.log(`👤 Name: ${data.parsed.lead_name || 'NOT FOUND'}`);
      console.log(`📞 Phone: ${data.parsed.phone || 'NOT FOUND'}`);
      console.log(`🏠 Address: ${data.parsed.address || 'NOT FOUND'}`);
      console.log(`📝 Notes: ${data.parsed.notes || 'NOT FOUND'}`);
      console.log(`📧 Source: ${data.parsed.source || 'NOT FOUND'}`);

      // Validate required fields
      if (data.parsed.lead_name && data.parsed.phone) {
        console.log('');
        console.log('✅ All required fields extracted successfully!');
        console.log('🚀 Ready to create lead in database.');
      } else {
        console.log('');
        console.log('❌ Missing required fields!');
        if (!data.parsed.lead_name) console.log('   - Missing: lead_name');
        if (!data.parsed.phone) console.log('   - Missing: phone');
      }
    } else {
      console.log('❌ Parsing failed:', data.error);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

testEmailParsing();