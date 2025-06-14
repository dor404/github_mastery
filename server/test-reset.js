const axios = require('axios');

async function testPasswordReset() {
  try {
    const response = await axios.post('http://localhost:5001/api/auth/forgot-password', {
      email: 'shoam333@icloud.com'
    });

    console.log('Response:', response.data);
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
}

testPasswordReset(); 