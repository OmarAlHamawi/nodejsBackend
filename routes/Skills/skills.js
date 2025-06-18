import express from "express";
import db from "../../db.js";

const router = express.Router();


//GET /api/skills
router.get("/", async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM "skill" ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching skills:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// GET /api/skills/user/:user_id
router.get("/user/:user_id", async (req, res) => {
  const { user_id } = req.params;

  try {
    const result = await db.query(
      `
      SELECT s.id, s.name, us.level
      FROM user_skill us
      INNER JOIN skill s ON us.skill_id = s.id
      WHERE us.user_id = $1
      ORDER BY s.name
      `,
      [user_id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching user skills:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
