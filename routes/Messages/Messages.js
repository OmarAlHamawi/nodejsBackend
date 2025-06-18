import express from "express";
import db from "../../db.js";

const router = express.Router();

//POST /api/chat/start
router.post("/start", async (req, res) => {
  const { sender_id, receiver_id } = req.body;

  if (!sender_id || !receiver_id) {
    return res.status(400).json({ message: "Both sender_id and receiver_id are required." });
  }

  try {
    // Check if chat already exists
    const existing = await db.query(
      `SELECT * FROM chat WHERE (user1_id = $1 AND user2_id = $2) OR (user1_id = $2 AND user2_id = $1)`,
      [sender_id, receiver_id]
    );

    let chat_id;
    if (existing.rows.length > 0) {
      chat_id = existing.rows[0].id;
    } else {
      // Create new chat
      const result = await db.query(
        `INSERT INTO chat (user1_id, user2_id) VALUES ($1, $2) RETURNING id`,
        [sender_id, receiver_id]
      );
      chat_id = result.rows[0].id;

      // Fetch sender's phone number
      const phoneRes = await db.query(
        `SELECT phone FROM users WHERE id = $1`,
        [sender_id]
      );
      const phone = phoneRes.rows[0]?.phone;

      if (phone) {
        await db.query(
          `INSERT INTO chat_message (messege, sender_id, chat_id)
           VALUES ($1, $2, $3)`,
          [`My phone number is: ${phone}`, sender_id, chat_id]
        );
      }
    }

    res.json({ chat_id });
  } catch (err) {
    console.error("Start chat failed:", err);
    res.status(500).json({ message: "Server error" });
  }
});

//GET /api/chat/user/:user_id
router.get("/user/:user_id", async (req, res) => {
  const { user_id } = req.params;

  try {
    const result = await db.query(
      `
      SELECT 
        c.id AS chat_id,
        u.name,
        u.phone
      FROM chat c
      JOIN users u ON u.id = CASE
        WHEN c.user1_id = $1 THEN c.user2_id
        WHEN c.user2_id = $1 THEN c.user1_id
        ELSE NULL
      END
      WHERE c.user1_id = $1 OR c.user2_id = $1
      `,
      [user_id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching user chats:", err);
    res.status(500).json({ message: "Server error" });
  }
});
export default router;
