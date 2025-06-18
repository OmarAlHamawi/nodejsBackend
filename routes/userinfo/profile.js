import express from "express";
import db from "../../db.js";
const router = express.Router();


//GET /api/profile/:id
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT u.id,
              u.name,
              u.email,
              u.phone,
              u.role,
              u.profile_img,
              COALESCE(
                JSON_AGG(
                  DISTINCT JSONB_BUILD_OBJECT('skill', s.name, 'level', us.level)
                ) FILTER (WHERE s.id IS NOT NULL), '[]'
              ) AS skills
         FROM users u
    LEFT JOIN user_skill us ON us.user_id = u.id
    LEFT JOIN skill      s  ON s.id = us.skill_id
        WHERE u.id = $1
     GROUP BY u.id`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


//PUT /api/profile/:id
router.put("/:id", async (req, res) => {
  const client = await db.connect();
  try {
    const { id } = req.params;
    const { name, email, password, phone, role, profile_img, user_id, skills } = req.body;

    if (parseInt(id) !== parseInt(user_id)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await client.query("BEGIN");

    const fields = [];
    const values = [];
    let idx = 1;

    if (name) {
      fields.push(`name = $${idx++}`);
      values.push(name);
    }
    if (email) {
      fields.push(`email = $${idx++}`);
      values.push(email);
    }
    if (password) {
      fields.push(`password = $${idx++}`);
      values.push(password);
    }
    if (phone) {
      fields.push(`phone = $${idx++}`);
      values.push(phone);
    }
    if (role) {
      fields.push(`role = $${idx++}`);
      values.push(role);
    }
    if (profile_img) {
      fields.push(`profile_img = $${idx++}`);
      values.push(profile_img);
    }

    if (fields.length > 0) {
      values.push(id);
      await client.query(
        `UPDATE users SET ${fields.join(", ")} WHERE id = $${idx}`,
        values
      );
    }

    await client.query(`DELETE FROM user_skill WHERE user_id = $1`, [id]);

    const insertSkillPromises = (skills || []).filter(s => s.level !== "select level").map(async (s) => {
      const skillRes = await db.query(`SELECT id FROM skill WHERE name = $1 LIMIT 1`, [s.skill]);
      const skill_id = skillRes.rows[0]?.id;
      if (skill_id) {
        await client.query(
          `INSERT INTO user_skill (user_id, skill_id, level) VALUES ($1, $2, $3)`,
          [id, skill_id, s.level]
        );
      }
    });

    await Promise.all(insertSkillPromises);

    await client.query("COMMIT");
    res.json({ message: "Profile updated" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Update failed:", err);
    res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
});

export default router;
