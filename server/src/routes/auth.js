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

export default router;
