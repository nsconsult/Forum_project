const express = require('express');
const router = express.Router();
const Reply = require('../models/reply');
const Thread = require('../models/thread');
const { authenticate } = require('../middlewares/auth');
const { isModerator } = require('../middlewares/role');

// Créer une réponse
router.post('/threads/:threadId/replies', authenticate, async (req, res) => {
  try {
    const reply = new Reply({
      content: req.body.content,
      author: req.user.userId,
      thread: req.params.threadId
    });
    await reply.save();
    await Thread.findByIdAndUpdate(
        req.params.threadId,
        { $push: { replies: reply._id } }
    );
    res.status(201).json(reply);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Supprimer une réponse (auteur ou mod/admin)
router.delete('/replies/:id', authenticate, async (req, res) => {
  try {
    const reply = await Reply.findById(req.params.id);
    
    // Vérifier si l'utilisateur est l'auteur ou un modérateur/admin
    if (reply.author.toString() !== req.user.userId && req.user.role === 'user') {
      return res.status(403).json({ error: 'Action non autorisée' });
    }

    await Reply.findByIdAndDelete(req.params.id);
    res.json({ message: 'Réponse supprimée' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;