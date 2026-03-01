import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../db/pool.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

function createToken(userId) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

// POST /auth/signup
router.post("/signup", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email and password required" });

  try {
    const hash = await bcrypt.hash(password, 12);
    const { rows } = await pool.query(
      "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email",
      [email.toLowerCase(), hash]
    );
    const user = rows[0];

    // Create profile and role
    await pool.query("INSERT INTO profiles (user_id, email) VALUES ($1, $2)", [user.id, user.email]);
    await pool.query("INSERT INTO user_roles (user_id, role) VALUES ($1, 'user')", [user.id]);

    const token = createToken(user.id);
    res.status(201).json({ user: { id: user.id, email: user.email }, token });
  } catch (err) {
    if (err.code === "23505") return res.status(409).json({ error: "Email already exists" });
    res.status(500).json({ error: err.message });
  }
});

// POST /auth/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email and password required" });

  try {
    const { rows } = await pool.query("SELECT * FROM users WHERE email = $1", [email.toLowerCase()]);
    if (rows.length === 0) return res.status(401).json({ error: "Invalid credentials" });

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });

    const { rows: roles } = await pool.query("SELECT role FROM user_roles WHERE user_id = $1", [user.id]);

    const token = createToken(user.id);
    res.json({
      user: { id: user.id, email: user.email },
      roles: roles.map((r) => r.role),
      token,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /auth/me
router.get("/me", authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT id, email FROM users WHERE id = $1", [req.userId]);
    if (rows.length === 0) return res.status(404).json({ error: "User not found" });

    const { rows: roles } = await pool.query("SELECT role FROM user_roles WHERE user_id = $1", [req.userId]);
    res.json({ user: rows[0], roles: roles.map((r) => r.role) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /auth/forgot-password
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });

  try {
    // Check if user exists (don't reveal whether they do for security)
    const { rows } = await pool.query("SELECT id FROM users WHERE email = $1", [email.toLowerCase()]);

    if (rows.length > 0) {
      // In a full implementation you'd generate a reset token and send an email.
      // For self-hosted without SMTP, log the token to the server console.
      const crypto = await import("crypto");
      const resetToken = crypto.randomBytes(32).toString("hex");
      const expiry = new Date(Date.now() + 3600000); // 1 hour

      await pool.query(
        `UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3`,
        [resetToken, expiry, rows[0].id]
      );

      // Log to server console so the admin can share the link with the user
      console.log(`\n🔑 Password reset link for ${email}:`);
      console.log(`   ${process.env.FRONTEND_URL || "http://localhost:8080"}/reset-password?token=${resetToken}\n`);
    }

    // Always return success to prevent email enumeration
    res.json({ message: "If that email exists, a reset link has been sent." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /auth/reset-password
router.post("/reset-password", async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ error: "Token and new password are required" });

  try {
    const { rows } = await pool.query(
      "SELECT id FROM users WHERE reset_token = $1 AND reset_token_expires > NOW()",
      [token]
    );

    if (rows.length === 0) return res.status(400).json({ error: "Invalid or expired reset token" });

    const hash = await bcrypt.hash(password, 12);
    await pool.query(
      "UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2",
      [hash, rows[0].id]
    );

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
