const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const goals = db.prepare('SELECT * FROM health_goals ORDER BY id DESC LIMIT 1').get();

    if (!goals) {
      const result = db.prepare(`
        INSERT INTO health_goals (calories, protein, fat, carbs, fiber, sodium)
        VALUES (2000, 60, 65, 300, 25, 2000)
      `).run();
      const newGoals = db.prepare('SELECT * FROM health_goals WHERE id = ?').get(result.lastInsertRowid);
      return res.json({ success: true, data: newGoals });
    }

    res.json({ success: true, data: goals });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

router.put('/', (req, res) => {
  try {
    const { calories, protein, fat, carbs, fiber, sodium } = req.body;

    const existing = db.prepare('SELECT * FROM health_goals ORDER BY id DESC LIMIT 1').get();

    if (!existing) {
      const result = db.prepare(`
        INSERT INTO health_goals (calories, protein, fat, carbs, fiber, sodium)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        calories || 2000,
        protein || 60,
        fat || 65,
        carbs || 300,
        fiber || 25,
        sodium || 2000
      );
      const newGoals = db.prepare('SELECT * FROM health_goals WHERE id = ?').get(result.lastInsertRowid);
      return res.json({ success: true, data: newGoals });
    }

    db.prepare(`
      UPDATE health_goals
      SET calories = COALESCE(?, calories),
          protein = COALESCE(?, protein),
          fat = COALESCE(?, fat),
          carbs = COALESCE(?, carbs),
          fiber = COALESCE(?, fiber),
          sodium = COALESCE(?, sodium),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      calories,
      protein,
      fat,
      carbs,
      fiber,
      sodium,
      existing.id
    );

    const updated = db.prepare('SELECT * FROM health_goals WHERE id = ?').get(existing.id);
    res.json({ success: true, data: updated });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

module.exports = router;
