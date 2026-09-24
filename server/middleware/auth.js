import jwt from 'jsonwebtoken';

/**
 * Middleware: verifies JWT and attaches decoded user to req.user
 */
export const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token, authorization denied.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token is not valid.' });
  }
};

/**
 * Middleware: restricts access to specified roles
 * @param  {...string} roles - e.g. 'admin', 'employee', 'client'
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access forbidden: insufficient role.' });
    }
    next();
  };
};
