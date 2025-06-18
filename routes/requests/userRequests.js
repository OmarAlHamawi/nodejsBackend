import express from "express";
import db from "../db.js";
const router = express.Router();



//POST /api/requests
router.post("/", async (req, res) => {
  try {
    const { description, user_id, wanted_skill_id } = req.body;

    if (!description || !user_id || !wanted_skill_id) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const result = await db.query(
      `INSERT INTO request (description, user_id, wanted_skill_id)
       VALUES ($1, $2, $3) RETURNING *`,
      [description, user_id, wanted_skill_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


//PUT /api/requests/:id
router.put("/:id", async (req, res) => {
  try {
    const { description, wanted_skill_id, user_id } = req.body;
    const { id } = req.params;

    // Check ownership
    const owner = await db.query(
      "SELECT user_id FROM request WHERE id = $1",
      [id]
    );
    if (owner.rows.length === 0) {
      return res.status(404).json({ message: "Request not found" });
    }
    if (owner.rows[0].user_id !== user_id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const fields = [];
    const values = [];
    let idx = 1;

    if (description) {
      fields.push(`description = $${idx++}`);
      values.push(description);
    }
    if (wanted_skill_id) {
      fields.push(`wanted_skill_id = $${idx++}`);
      values.push(wanted_skill_id);
    }

    if (fields.length === 0) {
      return res.status(400).json({ message: "Nothing to update" });
    }

    values.push(id); // last value for WHERE
    const result = await db.query(
      `UPDATE request SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *`,
      values
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


//GET /api/requests/user/:user_id
router.get("/user/:user_id", async (req, res) => {
  try {
    const { user_id } = req.params;
    const result = await db.query(
      `SELECT r.*, s.name AS wanted_skill
         FROM request r
         JOIN skill s ON r.wanted_skill_id = s.id
        WHERE r.user_id = $1
        ORDER BY r.id`,
      [user_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


//GET /api/requests
router.get("/", async (req, res) => {
  try {
    const excludeUser = req.query.excludeUser;

    const query = `
      SELECT r.*, u.name AS requester, s.name AS wanted_skill
        FROM request r
        JOIN users u   ON r.user_id = u.id
        JOIN skill s   ON r.wanted_skill_id = s.id
        ${excludeUser ? "WHERE r.user_id != $1" : ""}
        ORDER BY r.id
    `;

    const values = excludeUser ? [excludeUser] : [];
    const result = await db.query(query, values);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


//DELETE /api/requests/:id7
router.delete("/:id", async (req, res) => {
  try {
    const { user_id } = req.body;
    const { id } = req.params;

    // Check ownership
    const owner = await db.query("SELECT user_id FROM request WHERE id = $1", [id]);
    if (owner.rows.length === 0) {
      return res.status(404).json({ message: "Request not found" });
    }
    if (owner.rows[0].user_id !== user_id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const result = await db.query("DELETE FROM request WHERE id = $1 RETURNING *", [id]);
    res.json({ deleted: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
