// routes/candidateRoutes.js
const express = require('express');
const router = express.Router();
const Candidate = require('../models/Candidate');
const User = require('../models/User');
const { ensureAuth, ensureAdmin, ensureVoter } = require('../middleware/auth');

// GET /candidate/candidates - list candidates
router.get('/candidates', async (req, res) => {
  try {
    const list = await Candidate.find().select('-votes').lean();
    res.json({ candidates: list });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /candidate/vote/counts - sorted by voteCount desc
router.get('/vote/counts', async (req, res) => {
  try {
    const list = await Candidate.find().sort({ voteCount: -1 }).lean();
    res.json({ candidates: list });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /candidate/vote/:candidateId - vote (only for authenticated voters)
router.post('/vote/:candidateId', ensureAuth, ensureVoter, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user.role === 'admin') return res.status(403).json({ error: 'Admin cannot vote' });
    if (user.isVoted) return res.status(400).json({ error: 'User already voted' });

    const candidate = await Candidate.findById(req.params.candidateId);
    if (!candidate) return res.status(404).json({ error: 'Candidate not found' });

    // push vote
    candidate.votes.push({ user: user._id });
    candidate.voteCount = (candidate.voteCount || 0) + 1;
    await candidate.save();

    user.isVoted = true;
    await user.save();

    res.json({ message: 'Vote cast successfully', candidateId: candidate._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

/* Admin candidate management */

// POST /candidate/candidates - create candidate
router.post('/candidates', ensureAuth, ensureAdmin, async (req, res) => {
  try {
    const { name, party, age } = req.body;
    if (!name || !party || !age) return res.status(400).json({ error: 'Missing fields' });
    const c = new Candidate({ name, party, age });
    await c.save();
    res.status(201).json({ message: 'Candidate created', candidate: c });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /candidate/candidates/:candidateId - update candidate
router.put('/candidates/:candidateId', ensureAuth, ensureAdmin, async (req, res) => {
  try {
    const { name, party, age } = req.body;
    const c = await Candidate.findById(req.params.candidateId);
    if (!c) return res.status(404).json({ error: 'Candidate not found' });
    if (name) c.name = name;
    if (party) c.party = party;
    if (age) c.age = age;
    await c.save();
    res.json({ message: 'Candidate updated', candidate: c });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /candidate/candidates/:candidateId - delete
router.delete('/candidates/:candidateId', ensureAuth, ensureAdmin, async (req, res) => {
  try {
    const c = await Candidate.findByIdAndDelete(req.params.candidateId);
    if (!c) return res.status(404).json({ error: 'Candidate not found' });
    res.json({ message: 'Candidate deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
