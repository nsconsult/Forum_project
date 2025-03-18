const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Joi = require('joi');
const passport = require('passport');
const User = require('../models/user');
const { sendVerificationEmail,  sendPasswordResetEmail } = require('../services/emailService');

// Schéma Joi sans le champ 'role'
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required()
});

// Inscription
router.post('/register', async (req, res) => {
  const { error } = registerSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  try {
    const user = new User({
      ...req.body,
      role: 'user'
    });
    
    await user.save();

    // Appel simplifié avec juste l'email et l'ID
    await sendVerificationEmail(user.email, user._id);

    res.status(201).json({ message: 'Email de vérification envoyé' });
  } catch (err) {
    // Gestion améliorée des erreurs
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Cet email est déjà utilisé' });
    }
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Connexion (ajout de la vérification email)
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Identifiants invalides' });

    // Vérification du mot de passe
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ error: 'Identifiants invalides' });

    // Vérification de l'email
    if (!user.isVerified) {
      return res.status(403).json({ 
        error: 'Veuillez vérifier votre email avant de vous connecter'
      });
    }

    // Génération du JWT
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict'
    }).json({ role: user.role });
    
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Vérification d'email (inchangé mais fonctionnel)
router.get('/verify-email/:token', async (req, res) => {
  try {
    const decoded = jwt.verify(req.params.token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) return res.status(400).json({ error: 'Lien invalide' });
    if (user.isVerified) return res.status(400).json({ error: 'Email déjà vérifié' });

    user.isVerified = true;
    await user.save();

    res.json({ message: 'Compte vérifié avec succès !' });
  } catch (err) {
    res.status(400).json({ error: 'Lien expiré ou invalide' });
  }
});

// Mot de passe oublié
router.post('/forgot-password', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(404).json({ error: 'Email non trouvé' });

    // Générer un token et une expiration (1h)
    const token = crypto.randomBytes(20).toString('hex');
    user.resetToken = token;
    user.resetExpires = Date.now() + 3600000; // 1h en millisecondes
    await user.save();

    // Envoyer l'email
    await sendPasswordResetEmail(user.email, token);

    res.json({ message: 'Un email de réinitialisation a été envoyé' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Réinitialisation du mot de passe
router.post('/reset-password/:token', async (req, res) => {
  try {
    const user = await User.findOne({
      resetToken: req.params.token,
      resetExpires: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ error: 'Token invalide ou expiré' });

    // Mettre à jour le mot de passe
    user.password = req.body.password;
    user.resetToken = undefined;
    user.resetExpires = undefined;
    await user.save();

    res.json({ message: 'Mot de passe réinitialisé avec succès' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});
// Initier l'authentification Google
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Callback Google
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login', session: false }),
  (req, res) => {
    const token = jwt.sign(
      { userId: req.user._id, role: req.user.role },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );
    res.redirect(`http://localhost:3000?token=${token}`); // frontend a venir 
  }
);

module.exports = router;