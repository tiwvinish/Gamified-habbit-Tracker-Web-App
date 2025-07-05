const mongoose = require('mongoose');

const BadgeSchema = new mongoose.Schema(
  {
    badgeId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    icon: { type: String },
    requirement: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Badge', BadgeSchema);
