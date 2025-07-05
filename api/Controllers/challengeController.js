const Challenge = require('../models/Challenge');

// Get all challenges
const getAllChallenges = async (req, res) => {
  try {
    const challenges = await Challenge.find().populate('participants', 'name email');
    res.json(challenges);
  } catch (error) {
    console.error('Error fetching challenges:', error);
    res.status(500).json({ message: 'Server error fetching challenges' });
  }
};

// Get challenges that the user has joined
const getUserJoinedChallenges = async (req, res) => {
  try {
    const userId = req.user.id;
    const challenges = await Challenge.find({ participants: userId }).populate('participants', 'name email');
    res.json(challenges);
  } catch (error) {
    console.error('Error fetching user joined challenges:', error);
    res.status(500).json({ message: 'Server error fetching user joined challenges' });
  }
};

// Get challenge by ID
const getChallengeById = async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id).populate('participants', 'name email');
    if (!challenge) return res.status(404).json({ message: 'Challenge not found' });
    res.json(challenge);
  } catch (error) {
    console.error('Error fetching challenge:', error);
    res.status(500).json({ message: 'Server error fetching challenge' });
  }
};

// Create a new challenge
const createChallenge = async (req, res) => {
  try {
    const {
      title,
      description,
      startDate,
      endDate,
      rewardPoints,
      participants,
      status,
    } = req.body;

    // Validate start date is not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day

    const challengeStartDate = new Date(startDate);
    challengeStartDate.setHours(0, 0, 0, 0);

    if (challengeStartDate < today) {
      return res.status(400).json({
        message: 'Challenge start date cannot be in the past',
        field: 'startDate'
      });
    }

    // Validate end date is after start date
    const challengeEndDate = new Date(endDate);
    if (challengeEndDate <= challengeStartDate) {
      return res.status(400).json({
        message: 'Challenge end date must be after start date',
        field: 'endDate'
      });
    }

    // Validate required fields
    if (!title || !title.trim()) {
      return res.status(400).json({
        message: 'Challenge title is required',
        field: 'title'
      });
    }

    if (!startDate) {
      return res.status(400).json({
        message: 'Start date is required',
        field: 'startDate'
      });
    }

    if (!endDate) {
      return res.status(400).json({
        message: 'End date is required',
        field: 'endDate'
      });
    }

    console.log('✅ Creating challenge with valid dates:', {
      title,
      startDate: challengeStartDate.toISOString().split('T')[0],
      endDate: challengeEndDate.toISOString().split('T')[0]
    });

    const challenge = new Challenge({
      title: title.trim(),
      description: description?.trim() || '',
      startDate: challengeStartDate,
      endDate: challengeEndDate,
      rewardPoints: rewardPoints || 0,
      participants: participants || [],
      status: status || 'pending',
    });

    await challenge.save();
    console.log('✅ Challenge created successfully:', challenge._id);
    res.status(201).json(challenge);
  } catch (error) {
    console.error('❌ Error creating challenge:', error);
    res.status(500).json({ message: 'Server error creating challenge' });
  }
};

// Update a challenge
const updateChallenge = async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) return res.status(404).json({ message: 'Challenge not found' });

    const { startDate, endDate, title, description } = req.body;

    // If updating dates, validate them
    if (startDate || endDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const newStartDate = startDate ? new Date(startDate) : challenge.startDate;
      const newEndDate = endDate ? new Date(endDate) : challenge.endDate;

      newStartDate.setHours(0, 0, 0, 0);
      newEndDate.setHours(0, 0, 0, 0);

      // Only validate start date if it's being changed and the challenge hasn't started yet
      if (startDate && newStartDate.getTime() !== challenge.startDate.getTime()) {
        const originalStartDate = new Date(challenge.startDate);
        originalStartDate.setHours(0, 0, 0, 0);

        // If the original start date is in the future, enforce the no-backdate rule
        if (originalStartDate >= today && newStartDate < today) {
          return res.status(400).json({
            message: 'Cannot change start date to a past date',
            field: 'startDate'
          });
        }
      }

      // Validate end date is after start date
      if (newEndDate <= newStartDate) {
        return res.status(400).json({
          message: 'End date must be after start date',
          field: 'endDate'
        });
      }
    }

    // Validate title if provided
    if (title !== undefined && (!title || !title.trim())) {
      return res.status(400).json({
        message: 'Challenge title cannot be empty',
        field: 'title'
      });
    }

    console.log('✅ Updating challenge:', req.params.id);

    // Update challenge with validated data
    const updateData = { ...req.body };
    if (title) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description.trim();

    Object.assign(challenge, updateData);
    await challenge.save();

    console.log('✅ Challenge updated successfully');
    res.json(challenge);
  } catch (error) {
    console.error('❌ Error updating challenge:', error);
    res.status(500).json({ message: 'Server error updating challenge' });
  }
};

// Delete a challenge
const deleteChallenge = async (req, res) => {
  try {
    const challenge = await Challenge.findByIdAndDelete(req.params.id);
    if (!challenge) return res.status(404).json({ message: 'Challenge not found' });

    res.json({ message: 'Challenge deleted successfully' });
  } catch (error) {
    console.error('Error deleting challenge:', error);
    res.status(500).json({ message: 'Server error deleting challenge' });
  }
};

// Join a challenge
const joinChallenge = async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) return res.status(404).json({ message: 'Challenge not found' });

    const userId = req.user.id;

    if (!challenge.participants.includes(userId)) {
      challenge.participants.push(userId);
      challenge.progress.push({
        userId,
        progress: 0
      });
      await challenge.save();
    }

    res.json(challenge);
  } catch (error) {
    console.error('Error joining challenge:', error);
    res.status(500).json({ message: 'Error joining challenge' });
  }
};

// Update challenge progress
const updateProgress = async (req, res) => {
  try {
    const { progress } = req.body; // expected value: number (percentage)
    const userId = req.user.id;
    const challengeId = req.params.id;

    console.log('🔄 Updating challenge progress:', {
      challengeId,
      userId,
      newProgress: progress,
      timestamp: new Date().toISOString()
    });

    // Validate progress value
    if (typeof progress !== 'number' || progress < 0 || progress > 100) {
      console.log('❌ Invalid progress value:', progress);
      return res.status(400).json({ message: 'Progress must be a number between 0 and 100' });
    }

    const challenge = await Challenge.findById(challengeId);
    if (!challenge) {
      console.log('❌ Challenge not found:', challengeId);
      return res.status(404).json({ message: 'Challenge not found' });
    }

    const userProgress = challenge.progress.find((p) => p.userId.toString() === userId);
    if (!userProgress) {
      console.log('❌ User not a participant:', { userId, challengeId });
      return res.status(403).json({ message: 'You are not a participant of this challenge' });
    }

    // Store previous progress for logging and validation
    const previousProgress = userProgress.progress;

    // Calculate challenge duration to validate 1-day increment
    const startDate = new Date(challenge.startDate);
    const endDate = new Date(challenge.endDate);
    const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

    // Convert percentages to days for validation
    const previousDays = Math.round((previousProgress / 100) * totalDays);
    const newDays = Math.round((progress / 100) * totalDays);
    const daysDiff = newDays - previousDays;

    // Validate that user can only add 1 day at a time (allow same day updates)
    if (daysDiff !== 1 && daysDiff !== 0) {
      console.log('❌ Invalid progress increment:', {
        previousDays,
        newDays,
        daysDiff,
        message: 'Users can only add 1 day of progress at a time'
      });
      return res.status(400).json({
        message: 'You can only add 1 day of progress at a time. Complete today\'s challenge to move forward!',
        currentDays: previousDays,
        maxAllowedDays: previousDays + 1
      });
    }

    // Update progress
    userProgress.progress = progress;
    userProgress.lastUpdated = new Date();

    // Save to database
    const savedChallenge = await challenge.save();

    console.log('✅ Challenge progress updated successfully:', {
      challengeId,
      challengeTitle: challenge.title,
      userId,
      previousProgress,
      newProgress: progress,
      progressDiff: progress - previousProgress,
      previousDays,
      newDays,
      daysDiff,
      lastUpdated: userProgress.lastUpdated
    });

    res.json({
      message: 'Progress updated successfully',
      progress: userProgress,
      challenge: {
        id: challenge._id,
        title: challenge.title
      }
    });
  } catch (error) {
    console.error('❌ Error updating challenge progress:', {
      error: error.message,
      stack: error.stack,
      challengeId: req.params.id,
      userId: req.user?.id
    });
    res.status(500).json({ message: 'Error updating progress' });
  }
};

// Leave a challenge
const leaveChallenge = async (req, res) => {
  try {
    const { challengeId } = req.body;
    console.log('🚪 Leave challenge request:', { challengeId, userId: req.user.id });

    if (!challengeId) {
      return res.status(400).json({ message: 'Challenge ID is required' });
    }

    const challenge = await Challenge.findById(challengeId);
    if (!challenge) {
      console.log('❌ Challenge not found:', challengeId);
      return res.status(404).json({ message: 'Challenge not found' });
    }

    const userId = req.user.id;

    // Check if user is a participant
    if (!challenge.participants.includes(userId)) {
      console.log('❌ User not a participant:', { userId, participants: challenge.participants });
      return res.status(400).json({ message: 'You are not a participant of this challenge' });
    }

    // Remove user from participants
    challenge.participants = challenge.participants.filter(
      participant => participant.toString() !== userId
    );

    // Remove user's progress
    challenge.progress = challenge.progress.filter(
      progress => progress.userId.toString() !== userId
    );

    await challenge.save();
    console.log('✅ Successfully left challenge:', challenge.title);

    res.json({
      message: 'Successfully left the challenge',
      challenge: challenge
    });
  } catch (error) {
    console.error('❌ Error leaving challenge:', error);
    res.status(500).json({ message: 'Error leaving challenge' });
  }
};

module.exports = {
  getAllChallenges,
  getUserJoinedChallenges,
  getChallengeById,
  createChallenge,
  updateChallenge,
  deleteChallenge,
  joinChallenge,
  leaveChallenge,
  updateProgress
};
