const express = require('express');
const router = express.Router();
const Thread = require('../models/thread');
const { authenticate } = require('../middlewares/auth');
const { isModerator } = require('../middlewares/role');

router.post('/', authenticate, async (req, res) => {
  try {
    const thread = new Thread({
      ...req.body,
      author: req.user.userId
    });
    await thread.save();
    res.status(201).json(thread);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const threads = await Thread.find()
      .populate('author', 'email')
      .sort({ createdAt: -1 });
    
    res.json(threads);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const thread = await Thread.findById(req.params.id)
      .populate('author', 'email')
      .populate({
        path: 'replies',
        populate: { path: 'author', select: 'email' }
      });

    if (!thread) return res.status(404).json({ error: 'Thread non trouvé' });
    res.json(thread);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.delete('/:id', authenticate, isModerator, async (req, res) => {
  try {
    await Thread.findByIdAndDelete(req.params.id);
    res.json({ message: 'Fil supprimé' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;