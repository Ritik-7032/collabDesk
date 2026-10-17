const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Micro-cache (15s TTL) to reduce redundant sequential MongoDB Atlas RTT network roundtrips
const sessionCache = new Map();
const SESSION_CACHE_TTL_MS = 15000;

const protect = async (req, res, next) => {
  try {
    let token;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer")) {
      token = authHeader.split(" ")[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ message: "Not authorized, no token" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const now = Date.now();
    const cached = sessionCache.get(decoded.id);
    if (cached && cached.exp > now) {
      req.user = cached.user;
      return next();
    }

    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ message: "Not authorized, user not found" });
    }

    sessionCache.set(decoded.id, { user, exp: now + SESSION_CACHE_TTL_MS });
    req.user = user;

    next();
  } catch (error) {
    res.status(401).json({ message: "Not authorized, token invalid" });
  }
};

module.exports = { protect, sessionCache };