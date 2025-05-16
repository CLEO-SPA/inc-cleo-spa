import jwt from 'jsonwebtoken';
import 'dotenv/config';

// Check if the user has a valid JWT token else check the session
const isAuthenticated = (req, res, next) => {
  const token = req.cookies[process.env.REMEMBER_TOKEN];
  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        console.error('JWT verification error:', err);
        return res.status(401).json({ message: 'Unauthorized' });
      }
      next();
    });
  } else if (req.session && req.session.user_id) {
    next();
  } else {
    res.status(401).json({ message: 'Unauthorized' });
  }
};

export default isAuthenticated;
