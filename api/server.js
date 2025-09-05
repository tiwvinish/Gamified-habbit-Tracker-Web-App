
const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const userRoutes = require('./Routes/userRoutes');
const habitRoutes = require('./Routes/habitRoutes');
const adminRoutes = require('./Routes/adminRoutes');
const suggestionRoutes = require('./Routes/suggestionRoutes');
const challengeRoutes = require('./Routes/challengeRoutes');
const badgeRoutes = require('./Routes/badgeRoutes');
const partnerRoutes = require('./Routes/partners');
const leaderboardRoutes = require('./Routes/leaderboard');



const app = express();


app.use(cors({
  origin: ['http://localhost:8080', 'http://localhost:8081'],
  credentials: true,
}));


app.use(express.json());

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(` ${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

app.use('/api/users', userRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/suggestions', suggestionRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/badges', badgeRoutes);

app.use('/api/partners', partnerRoutes);
app.use('/api/leaderboard', leaderboardRoutes);



app.get('/api/test-console', (req, res) => {
  console.log(' CONSOLE TEST WORKS SUCCESSFULLY!');
  res.json({ message: 'Console test done' });
});













// Health check route
app.get('/api/health/', (req, res) => {
  res.status(200).json({ message: 'Backend is healthy ' });
});


app.get('/', (req, res) => {
  res.send('MeroHabbit API is running');
});

// Start server
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });
