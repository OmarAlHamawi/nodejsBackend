import express from "express";
import db from "../../db.js";

const router = express.Router();


//POST /api/requests
router.post("/", async (req, res) => {
  try {
    const { description, user_id, wanted_skill_id, skill_ids } = req.body;

    if (!description || !user_id || !wanted_skill_id || !Array.isArray(skill_ids)) {
      return res.status(400).json({ message: "Missing or invalid fields" });
    }

    // 1. Insert into request table
    const requestResult = await db.query(
      `INSERT INTO request (description, user_id, wanted_skill_id)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [description, user_id, wanted_skill_id]
    );

    const request = requestResult.rows[0];

    // 2. Insert user skills into request_user_skill
    const insertSkills = skill_ids.map(skill_id =>
      db.query(
        `INSERT INTO request_user_skill (request_id, user_id, skill_id)
         VALUES ($1, $2, $3)`,
        [request.id, user_id, skill_id]
      )
    );
    await Promise.all(insertSkills);

    res.status(201).json({ request, offered_skills: skill_ids.length });
  } catch (err) {
    console.error("Error creating request:", err);
    res.status(500).json({ message: "Server error" });
  }
});


//GET /api/requests
router.get("/", async (req, res) => {
  try {
    const excludeUser = req.query.excludeUser;

    const requestQuery = `
      SELECT 
        r.id AS request_id,
        r.description,
        r.user_id,
        u.name AS user_name,
        s.name AS wanted_skill
      FROM request r
      JOIN users u ON r.user_id = u.id
      JOIN skill s ON r.wanted_skill_id = s.id
      ${excludeUser ? "WHERE r.user_id != $1" : ""}
      ORDER BY r.id
    `;
    const values = excludeUser ? [excludeUser] : [];
    const requestRes = await db.query(requestQuery, values);

    const skillsRes = await db.query(`
      SELECT 
        rus.request_id, 
        s.name AS skill_name
      FROM request_user_skill rus
      JOIN skill s ON rus.skill_id = s.id
    `);

    const skillMap = {};
    for (const row of skillsRes.rows) {
      if (!skillMap[row.request_id]) skillMap[row.request_id] = [];
      skillMap[row.request_id].push({ name: row.skill_name });
    }

    const result = requestRes.rows.map(r => {
      const skillsList = skillMap[r.request_id] || [];
      return {
        id: r.request_id,
        wanted: { skill: r.wanted_skill },
        has: {
          skill: skillsList[0]?.name || "Skill(s)",
          skillsList,
        },
        hasAllSkills: skillsList.length > 1,
        message: r.description,
        user: { name: r.user_name, id: r.user_id },
      };
    });

    res.json(result);
  } catch (err) {
    console.error("Error in /api/requests:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/user/:user_id", async (req, res) => {
  try {
    const { user_id } = req.params;

    const requestRes = await db.query(
      `SELECT r.id, r.description, r.user_id, s.name AS wanted_skill
       FROM request r
       JOIN skill s ON r.wanted_skill_id = s.id
       WHERE r.user_id = $1
       ORDER BY r.id`,
      [user_id]
    );

    const skillRes = await db.query(`
      SELECT rus.request_id, s.name AS skill
      FROM request_user_skill rus
      JOIN skill s ON rus.skill_id = s.id
      WHERE rus.user_id = $1
    `, [user_id]);

    const skillMap = {};
    for (const { request_id, skill } of skillRes.rows) {
      if (!skillMap[request_id]) skillMap[request_id] = [];
      skillMap[request_id].push(skill);
    }

    const enriched = requestRes.rows.map(r => ({
      ...r,
      skills: skillMap[r.id] || [],
    }));

    res.json(enriched);
  } catch (err) {
    console.error("GET /user/:id error", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const requestId = req.params.id;
    const { user_id } = req.body;

    // 1. Check request exists and ownership
    const requestRes = await db.query(
      "SELECT user_id FROM request WHERE id = $1",
      [requestId]
    );

    if (requestRes.rows.length === 0) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (requestRes.rows[0].user_id !== user_id) {
      return res.status(403).json({ message: "Not authorized to delete this request" });
    }

    // 2. Delete related entries from request_user_skill
    await db.query("DELETE FROM request_user_skill WHERE request_id = $1", [requestId]);

    // 3. Delete the request itself
    const deleteRes = await db.query(
      "DELETE FROM request WHERE id = $1 RETURNING *",
      [requestId]
    );

    res.status(200).json({
      message: "Request and related skills deleted",
      deleted: deleteRes.rows[0],
    });
  } catch (err) {
    console.error("Delete request failed:", err);
    res.status(500).json({ message: "Server error" });
  }
});

//PUT /api/requests/:id
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id, description, wanted_skill_id, skill_ids } = req.body;

    if (!user_id || !description || !wanted_skill_id || !Array.isArray(skill_ids)) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Check ownership
    const result = await db.query(`SELECT * FROM request WHERE id = $1`, [id]);
    const request = result.rows[0];
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }
    if (request.user_id !== user_id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Update the request
    const updateResult = await db.query(
      `UPDATE request
       SET description = $1, wanted_skill_id = $2
       WHERE id = $3
       RETURNING *`,
      [description, wanted_skill_id, id]
    );

    // Remove old offered skills
    await db.query(`DELETE FROM request_user_skill WHERE request_id = $1`, [id]);

    // Insert new skills
    const insertPromises = skill_ids.map(skill_id =>
      db.query(
        `INSERT INTO request_user_skill (request_id, user_id, skill_id)
         VALUES ($1, $2, $3)`,
        [id, user_id, skill_id]
      )
    );
    await Promise.all(insertPromises);

    res.status(200).json({
      updated: updateResult.rows[0],
      skills_updated: skill_ids.length,
    });

  } catch (err) {
    console.error("Update failed:", err);
    res.status(500).json({ message: "Server error" });
  }
});
export default router;
