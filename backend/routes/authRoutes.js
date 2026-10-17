const express = require("express");
const router = express.Router();
const passport = require("../config/passport");
const { protect } = require("../middleware/authMiddleware");
const { authLimiter } = require("../middleware/rateLimiter");
const {
  signup,
  login,
  logout,
  getMe,
  googleCallback,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");

// Sensitive endpoints protected by strict auth brute-force limiter
router.post("/signup", authLimiter, signup);
router.post("/login", authLimiter, login);
router.post("/logout", logout);
router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/reset-password", authLimiter, resetPassword);

// Informational and OAuth routes bypass authLimiter to avoid false 429 lockouts
router.get("/me", protect, getMe);

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/login" }),
  googleCallback
);

module.exports = router;