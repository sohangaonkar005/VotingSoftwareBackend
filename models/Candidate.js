// models/Candidate.js
const mongoose = require('mongoose');

const voteSubSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  votedAt: { type: Date, default: Date.now }
}, { _id: false });

const candidateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  party: { type: String, required: true },
  age: { type: Number, required: true },
  votes: [voteSubSchema],
  voteCount: { type: Number, default: 0 }
});

const Candidate = mongoose.model('Candidate', candidateSchema);
module.exports = Candidate;
