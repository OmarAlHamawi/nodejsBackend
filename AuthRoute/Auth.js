import express from "express";
import db from "../../db.js";

const router = express.Router();

// SIGNUP
router.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;

  const exists = await db.query('SELECT * FROM "users" WHERE email = $1', [email]);
  if (exists.rows.length > 0)
    return res.status(400).json({ message: "User already exists" });

  const result = await db.query(
    'INSERT INTO "users" (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING *',
    [name, email, password, "user"] // default role = user
  );

  res.status(201).json({ user: result.rows[0] });
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Missing email or password" });
    }

    const result = await db.query(
      'SELECT * FROM "users" WHERE email = $1 AND password = $2',
      [email, password]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = result.rows[0];

    // ✅ Return user info including role
    res.json({ user });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
