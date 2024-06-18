const jwt = require("jsonwebtoken");

// Middleware to authenticate and extract JWT
const authenticateToken = (req, res, next) => {
  // Retrieve the token from the Authorization header
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1]; // Typically "Bearer TOKEN"

  if (!token) {
    return res.sendStatus(401); // No token found, unauthorized
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.sendStatus(403); // Token is not valid
    }

    // Attach userId to request
    req.userId = decoded.userId; // Assuming the token was encoded with an 'id' field
    next();
  });
};

module.exports = authenticateToken;
