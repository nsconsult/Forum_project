const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const transporter = require('../config/mailer');

// Génère le token de vérification email
const generateEmailVerificationToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

// Envoie l'email de vérification
const sendVerificationEmail = async (email, userId) => {
  try {
    const token = generateEmailVerificationToken(userId);
    const verificationUrl = `http://localhost:5000/api/auth/verify-email/${token}`;

    await transporter.sendMail({
      from: `Forum App <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Vérification de votre email',
      html: `<a href="${verificationUrl}">Vérifier mon email</a>`
    });

    console.log('Email de vérification envoyé à', email);
  } catch (err) {
    console.error("Erreur lors de l'envoi de l'email :", err);
    throw err;
  }
};
exports.sendPasswordResetEmail = async (email, token) => {
    try {
      const resetUrl = `http://localhost:5000/api/auth/reset-password/${token}`;
  
      await transporter.sendMail({
        from: `Forum App <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Réinitialisation de votre mot de passe',
        html: `
          <h1>Demande de réinitialisation</h1>
          <p>Cliquez sur ce lien pour choisir un nouveau mot de passe :</p>
          <a href="${resetUrl}">${resetUrl}</a>
          <p>Ce lien expirera dans 1 heure.</p>
        `
      });
    } catch (err) {
      console.error("Erreur lors de l'envoi de l'email :", err);
      throw err;
    }
  };

module.exports = {
    sendVerificationEmail,
    generateEmailVerificationToken
};