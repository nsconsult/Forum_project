exports.isModerator = (req, res, next) => {
    if (req.user.role !== 'mod' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès réservé aux modérateurs' });
    }
    next();
  };
  
  exports.isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
    }
    next();
  };