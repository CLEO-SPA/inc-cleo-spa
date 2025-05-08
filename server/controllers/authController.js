const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.userId) {
    return res.status(200).json({
      isAuthenticated: true,
      user: { id: req.session.userId },
    });
  }

  res.status(401).json({ message: 'Unauthorized: Please log in.' });
};

export default {
  isAuthenticated,
};
