const axios = require('axios');

// Test registration with spaces in username
const testRegistrationWithSpaces = async () => {
  try {
    console.log('🧪 Testing user registration with spaces in username...');
    
    const testUsers = [
      {
        username: 'John Doe',
        email: 'john.doe@test.com',
        password: 'password123'
      },
      {
        username: 'Jane Smith',
        email: 'jane.smith@test.com',
        password: 'password123'
      },
      {
        username: 'Siddhartha Dhakal',
        email: 'siddhartha.test@mail.com',
        password: 'password123'
      }
    ];

    const baseURL = 'http://localhost:3000'; // Adjust port if needed
    
    for (const user of testUsers) {
      try {
        console.log(`📝 Testing registration for: "${user.username}"`);
        
        const response = await axios.post(`${baseURL}/api/users/register`, user);
        
        if (response.status === 201) {
          console.log(`✅ Successfully registered: "${user.username}"`);
        } else {
          console.log(`⚠️  Unexpected response for ${user.username}:`, response.status);
        }
        
      } catch (error) {
        if (error.response) {
          console.log(`❌ Registration failed for "${user.username}":`, error.response.data.message);
        } else {
          console.log(`❌ Network error for "${user.username}":`, error.message);
        }
      }
    }

    console.log('\n🧪 Testing username validation endpoint...');
    
    // Test validation endpoint if it exists
    try {
      const validationResponse = await axios.post(`${baseURL}/api/users/validate-username`, {
        username: 'Test User With Spaces'
      });
      console.log('✅ Username validation endpoint accepts spaces:', validationResponse.data);
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log('ℹ️  Username validation endpoint not found (this is okay)');
      } else {
        console.log('❌ Username validation test failed:', error.response?.data || error.message);
      }
    }

    console.log('\n🎉 Registration test completed!');
    console.log('💡 If registrations succeeded, usernames with spaces are working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

// Run the test
testRegistrationWithSpaces();
