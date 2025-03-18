const express = require('express');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const passport = require('passport');
const authRoutes = require('./routes/auth');
const threadRoutes = require('./routes/thread');
const replyRoutes = require('./routes/reply');
require('dotenv/config');
require('./config/passport');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(express.json());
app.use(helmet());
app.use(passport.initialize());
app.use(cookieParser());
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
}));

// Connexion DB
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/threads', threadRoutes);
app.use('/api', replyRoutes);

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Erreur serveur' });
});

app.listen(PORT, () => 
  console.log(`Serveur en écoute sur http://localhost:${PORT}`)
);