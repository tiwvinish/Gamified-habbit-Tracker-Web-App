# 👥 User Registration Guide

## 🎯 Overview
This guide explains how to register the 12 test users in the MeroHabbit database for testing the accountability partner system.

## 📋 Users to Register

### 👤 Test Users List:
1. **Sandesh Gautam** - sandesh@mail.com (sandesh@123)
2. **Pratik Shrestha** - pratik@mail.com (pratik@123)
3. **Sujan Karki** - sujan@mail.com (sujan@123)
4. **Anisha Thapa** - anisha@mail.com (anisha@123)
5. **Sagar Bhandari** - sagar@mail.com (sagar@123)
6. **Nirajan Acharya** - nirajan@mail.com (nirajan@123)
7. **Sita Tamang** - sita@mail.com (sita@123)
8. **Ramesh Neupane** - ramesh@mail.com (ramesh@123)
9. **Kabita Maharjan** - kabita@mail.com (kabita@123)
10. **Dipesh Basnet** - dipesh@mail.com (dipesh@123)
11. **Sarita Rai** - sarita@mail.com (sarita@123)
12. **Bikash Poudel** - bikash@mail.com (bikash@123)

## 🚀 Registration Methods

### Method 1: Automated Script (Recommended)
```bash
# Navigate to the scripts directory
cd "C:\Users\91983\Desktop\Habit Tracker\api\scripts"

# Run the registration script
node simpleUserRegistration.js
```

### Method 2: Batch File
```bash
# Double-click on register-users.bat in the scripts folder
# Or run from command line:
cd "C:\Users\91983\Desktop\Habit Tracker\api\scripts"
register-users.bat
```

### Method 3: API Endpoint (if server is running)
```bash
# POST request to bulk registration endpoint
curl -X POST http://localhost:3000/api/bulk-users/register
```

### Method 4: Manual Registration via Frontend
1. Go to http://localhost:8080/login
2. Click "Create Account"
3. Register each user manually with the provided credentials

## 🔧 Prerequisites

### Required:
- ✅ Node.js installed
- ✅ MongoDB running
- ✅ Environment variables configured (.env file)
- ✅ Dependencies installed (npm install)

### Environment Variables:
```env
MONGO_URI=mongodb://localhost:27017/habit-tracker
JWT_SECRET=your_jwt_secret_here
```

## 📊 What Gets Created

### For Each User:
```javascript
// User Profile:
- Username: firstname_lastname format
- Email: provided email address
- Password: hashed version of provided password
- Role: 'user'
- Level: 1
- Random stats (XP, streaks, completed habits)
- Default preferences and settings

// Sample Habits (3-5 per user):
- Morning Exercise
- Read for 20 minutes
- Drink 8 glasses of water
- Meditation
- Plan tomorrow
- Healthy Breakfast
- Learn Something New
- Evening Walk
```

## 🎮 Testing the Accountability Partner System

### After Registration:
1. **Login as any user** using their email and password
2. **Navigate to Partners** section (/partners)
3. **Find Partners** - Click to discover compatible users
4. **Send Requests** - Send partnership requests to other users
5. **Accept Partnerships** - Login as different users to accept requests
6. **Create Challenges** - Test the challenge system
7. **View Leaderboard** - Check ranking system

### Test Scenarios:
```javascript
// Partnership Testing:
1. Login as Sandesh (sandesh@mail.com / sandesh@123)
2. Find partners and send request to Pratik
3. Login as Pratik (pratik@mail.com / pratik@123)
4. Accept partnership request
5. Create challenges together
6. Test duo streak functionality

// Leaderboard Testing:
1. Create multiple partnerships
2. Complete challenges
3. Build streaks
4. Check leaderboard rankings
```

## 🔍 Verification

### Check Registration Success:
```bash
# Method 1: Database query
# Connect to MongoDB and run:
db.users.find({}, {username: 1, email: 1, level: 1})

# Method 2: API endpoint
curl http://localhost:3000/api/bulk-users/list

# Method 3: Frontend login
# Try logging in with any of the test user credentials
```

### Expected Output:
```
✅ Successfully registered: 12 users
⚠️  Skipped (already exist): 0 users
❌ Failed: 0 users
📝 Total processed: 12 users
```

## 🧹 Cleanup (if needed)

### Remove Test Users:
```bash
# API endpoint for cleanup
curl -X DELETE http://localhost:3000/api/bulk-users/cleanup

# Or manual database cleanup
db.users.deleteMany({email: {$regex: "@mail.com"}})
db.habits.deleteMany({userId: {$in: [/* user IDs */]}})
```

## 🐛 Troubleshooting

### Common Issues:

#### "Connection Error"
```bash
# Check if MongoDB is running
mongod --version

# Check connection string in .env file
MONGO_URI=mongodb://localhost:27017/habit-tracker
```

#### "User Already Exists"
```bash
# This is normal - script will skip existing users
# Check output for "Skipped (already exist)" count
```

#### "Permission Denied"
```bash
# Run command prompt as Administrator
# Or check if antivirus is blocking Node.js
```

#### "Module Not Found"
```bash
# Install dependencies first
cd "C:\Users\91983\Desktop\Habit Tracker\api"
npm install
```

## 📈 Success Metrics

### After Registration:
- ✅ 12 users in database
- ✅ 36-60 sample habits created
- ✅ Users can login successfully
- ✅ Partner matching system works
- ✅ Leaderboard displays users

### Testing Checklist:
- [ ] All 12 users registered successfully
- [ ] Can login with provided credentials
- [ ] Partner discovery finds compatible users
- [ ] Partnership requests can be sent/accepted
- [ ] Challenges can be created and completed
- [ ] Duo streaks update correctly
- [ ] Leaderboard shows partnerships
- [ ] Badges are awarded appropriately

## 🎉 Next Steps

After successful registration:
1. **Test Partner Matching** - Verify KNN algorithm works
2. **Create Partnerships** - Form accountability partnerships
3. **Test Gamification** - Challenges, streaks, badges
4. **Verify Leaderboards** - Check ranking systems
5. **Test Mobile Experience** - Responsive design
6. **Performance Testing** - System under load

The test users provide a realistic dataset for comprehensive testing of the accountability partner system! 🚀
