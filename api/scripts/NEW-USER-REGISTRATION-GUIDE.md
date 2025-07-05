# 👥 New User Registration Guide

## 🎯 Overview
Register 9 new users in the MeroHabbit database with realistic profiles, habits, and levels for comprehensive partner matching testing.

## 📋 Users to Register

### 👤 New User List:
1. **Siddhartha Dhakal** - siddhartha@mail.com (siddhartha@123)
2. **Sandesh Gautam** - sandesh@mail.com (sandesh@123) 
3. **Sujan Pandey** - sujan@mail.com (sujan@123)
4. **Vinish Tiwari** - vinish@mail.com (vinish@123)
5. **Kiran Oli** - kiran@mail.com (kiran@123)
6. **Bipin Chettri** - bipin@mail.com (bipin@123)
7. **Anupam Shah** - anupam@mail.com (anupam@123)
8. **Shudamshu Bharati** - shudamshu@mail.com (shudamshu@123)
9. **Sonam Tamang** - sonam@mail.com (sonam@123)

## 🚀 Registration Methods

### Method 1: Script Registration (Recommended)
```bash
# Navigate to scripts directory
cd "E:\habit\api\scripts"

# Run new user registration
node registerNewUsers.js
```

### Method 2: Batch File
```bash
# Double-click register-new-users.bat
# Or run from command line:
cd "E:\habit\api\scripts"
register-new-users.bat
```

### Method 3: API Endpoint
```bash
# If server is running
curl -X POST http://localhost:3000/api/bulk-users/register-new
```

## 📊 What Gets Created

### 👤 User Profiles:
```javascript
// Each user gets:
- Unique username (firstname_lastname format)
- Secure hashed password
- Random level (2-6) for variety
- Realistic XP based on level
- Random current streak (1-15 days)
- Completion history and stats
- Nepal timezone (UTC+5:45)
- Default goals: health, productivity, learning
- Public profile with partner requests enabled
```

### 🎯 Sample Habits (4-8 per user):
```javascript
// Diverse habit categories:
- Health: Morning Exercise, Evening Walk, Drink Water, Yoga, Healthy Breakfast
- Learning: Read Daily, Learn Language, Online Course, Practice Coding
- Productivity: Plan Tomorrow, Review Goals, Clean Workspace, Time Blocking
- Wellness: Meditation, Gratitude Journal, Deep Breathing, Digital Detox
- Creative: Creative Writing
- Social: Call Family, Practice Kindness
- Finance: Track Expenses, Skill Development
```

### 📈 Realistic Statistics:
```javascript
// Varied user stats for authentic matching:
- Levels: 2-6 (different experience levels)
- XP: Level * 200 + random bonus (400-1400 XP)
- Streaks: 1-15 days current + longer historical
- Completed Habits: Level * 15 + random (30-120 total)
- Coins: 150-800 based on level and activity
- Completion History: 30 days of realistic data
```

## 🎮 Expected Results

### After Registration:
```javascript
// Console Output:
📊 Registration Summary:
✅ Successfully registered: 9 users
⚠️  Skipped (already exist): 0 users
🎯 Habits created: 54 habits
📈 Average habits per user: 6.0

👥 Newly Registered Users:
1. Siddhartha Dhakal (Siddhartha Dhakal) - Level 4 - siddhartha@mail.com
2. Sandesh Gautam (Sandesh Gautam) - Level 3 - sandesh@mail.com
3. Sujan Pandey (Sujan Pandey) - Level 2 - sujan@mail.com
4. Vinish Tiwari (Vinish Tiwari) - Level 5 - vinish@mail.com
5. Kiran Oli (Kiran Oli) - Level 3 - kiran@mail.com
6. Bipin Chettri (Bipin Chettri) - Level 4 - bipin@mail.com
7. Anupam Shah (Anupam Shah) - Level 6 - anupam@mail.com
8. Shudamshu Bharati (Shudamshu Bharati) - Level 2 - shudamshu@mail.com
9. Sonam Tamang (Sonam Tamang) - Level 3 - sonam@mail.com
```

### Partner Matching Ready:
```javascript
// Users will now appear in partner discovery with:
- Varied compatibility scores (60-95%)
- Different habit categories for matching
- Realistic activity levels and streaks
- Diverse user levels for authentic matching
```

## 🧪 Testing Partner Discovery

### Step-by-Step Test:
1. **Register Users** (using any method above)
2. **Login as Siddhartha:**
   - Email: `siddhartha@mail.com`
   - Password: `siddhartha@123`
3. **Go to Partners:**
   - Navigate to `/partners`
   - Click "Discover Compatible Partners"
4. **Expected Results:**
   - See 8+ potential partners
   - Match scores ranging 60-95%
   - Interactive challenge and motivation buttons
   - Realistic compatibility breakdowns

### Cross-User Testing:
```javascript
// Test different user perspectives:
- Login as Vinish (Level 5) - should see high matches with other high-level users
- Login as Sujan (Level 2) - should see good matches with similar level users
- Login as Anupam (Level 6) - should see varied matches across all levels
```

## 🔍 Verification

### Check Registration Success:
```bash
# Method 1: Database query
# Connect to MongoDB and run:
db.users.find({email: {$regex: "@mail.com"}}, {username: 1, email: 1, level: 1})

# Method 2: API check
curl http://localhost:3000/api/bulk-users/list

# Method 3: Frontend login
# Try logging in with any of the new user credentials
```

### Expected Database State:
```javascript
// Total users in system:
- Original 12 test users (if previously registered)
- New 9 users = 21 total users
- 120+ total habits across all users
- Varied levels, streaks, and activity for realistic matching
```

## 🎯 Partner System Features to Test

### After Registration:
1. **Partner Discovery:**
   - Find compatible partners with varied match scores
   - View detailed compatibility breakdowns
   - See common habit categories highlighted

2. **Interactive Engagement:**
   - Send instant challenges to potential partners
   - Send motivational messages
   - Use quick challenge buttons

3. **Partnership Formation:**
   - Send partnership requests
   - Accept incoming requests
   - Create challenges together

4. **Leaderboard System:**
   - View partner rankings
   - Check streak leaderboards
   - See challenge completion stats

## 🐛 Troubleshooting

### Common Issues:

#### "User Already Exists"
```bash
# This is normal if users were previously registered
# Script will skip existing users and show summary
```

#### "No Partners Found"
```bash
# Make sure users have habits:
db.habits.find({userId: ObjectId("...")}).count()

# Verify user goals are set:
db.users.find({}, {goals: 1, level: 1})
```

#### "Connection Error"
```bash
# Check MongoDB is running:
mongod --version

# Verify .env file:
MONGO_URI=mongodb://localhost:27017/habit-tracker
```

## 🎉 Success Metrics

### After Registration:
- ✅ 9 new users with varied levels (2-6)
- ✅ 50+ new habits across different categories
- ✅ Partner discovery shows 8+ matches per user
- ✅ Match scores are realistic (60-95% range)
- ✅ Challenge and motivation features work
- ✅ Users can form partnerships and compete

### Testing Checklist:
- [ ] All 9 users registered successfully
- [ ] Users have different levels and stats
- [ ] Partner discovery finds varied matches
- [ ] Match scores are realistic (not all 100%)
- [ ] Challenge system works with new users
- [ ] Motivation messages send successfully
- [ ] Leaderboard shows new user data

## 🚀 Next Steps

After successful registration:
1. **Test Partner Matching** - Verify KNN algorithm with new users
2. **Create Partnerships** - Form accountability partnerships
3. **Test Challenges** - Create and complete challenges
4. **Verify Leaderboards** - Check ranking with more users
5. **Mobile Testing** - Test responsive design with more data

The new users provide additional diversity for comprehensive testing of the accountability partner system! 🎯✨
