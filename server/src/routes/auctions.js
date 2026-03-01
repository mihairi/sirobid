import { Router } from "express";
import pool from "../db/pool.js";
import { authenticate, requireAdmin } from "../middleware/auth.js";

const router = Router();

// GET /auctions — public
router.get("/", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM auction_items ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /auctions/:id — public
router.get("/:id", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM auction_items WHERE id = $1", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /auctions — admin only
router.post("/", authenticate, requireAdmin, async (req, res) => {
  const { title, description, starting_price, start_time, end_time, image_url, extra_images } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO auction_items (title, description, starting_price, start_time, end_time, original_end_time, image_url, extra_images, created_by)
       VALUES ($1, $2, $3, $4, $5, $5, $6, $7, $8) RETURNING *`,
      [title, description, starting_price, start_time, end_time, image_url, extra_images || [], req.userId]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /auctions/:id — admin only
router.put("/:id", authenticate, requireAdmin, async (req, res) => {
  const { title, description, starting_price, end_time, is_active, image_url, extra_images } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE auction_items SET title=$1, description=$2, starting_price=$3, end_time=$4, is_active=$5, image_url=$6, extra_images=$7
       WHERE id=$8 RETURNING *`,
      [title, description, starting_price, end_time, is_active, image_url, extra_images, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /auctions/:id — admin only
router.delete("/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    await pool.query("DELETE FROM auction_items WHERE id = $1", [req.params.id]);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
