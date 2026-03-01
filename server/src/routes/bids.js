import { Router } from "express";
import pool from "../db/pool.js";
import { authenticate, requireAdmin } from "../middleware/auth.js";

const router = Router();

// GET /auctions/:id/bids — admin sees all, user sees own
router.get("/auction/:auctionId", authenticate, async (req, res) => {
  try {
    const { rows: roles } = await pool.query(
      "SELECT role FROM user_roles WHERE user_id = $1", [req.userId]
    );
    const isAdmin = roles.some((r) => r.role === "admin");

    let query, params;
    if (isAdmin) {
      query = "SELECT b.*, u.email as bidder_email FROM bids b JOIN users u ON b.bidder_id = u.id WHERE b.auction_item_id = $1 ORDER BY b.amount DESC";
      params = [req.params.auctionId];
    } else {
      query = "SELECT * FROM bids WHERE auction_item_id = $1 AND bidder_id = $2 ORDER BY amount DESC";
      params = [req.params.auctionId, req.userId];
    }

    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /bids — authenticated users
router.post("/", authenticate, async (req, res) => {
  const { auction_item_id, amount } = req.body;
  try {
    // Validate auction is active and bid is high enough
    const { rows: auctions } = await pool.query(
      "SELECT * FROM auction_items WHERE id = $1 AND is_active = true AND end_time > NOW()",
      [auction_item_id]
    );
    if (auctions.length === 0) return res.status(400).json({ error: "Auction not available" });

    const auction = auctions[0];
    const minBid = auction.current_highest_bid
      ? Number(auction.current_highest_bid) + 0.01
      : Number(auction.starting_price);

    if (Number(amount) < minBid) {
      return res.status(400).json({ error: `Bid must be at least ${minBid}` });
    }

    const { rows } = await pool.query(
      "INSERT INTO bids (auction_item_id, bidder_id, amount) VALUES ($1, $2, $3) RETURNING *",
      [auction_item_id, req.userId, amount]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /bids/admin — admin: all bids
router.get("/admin", authenticate, requireAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT b.*, u.email as bidder_email, a.title as auction_title FROM bids b JOIN users u ON b.bidder_id = u.id JOIN auction_items a ON b.auction_item_id = a.id ORDER BY b.created_at DESC"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
