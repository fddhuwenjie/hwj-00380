const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const { category, search } = req.query;
    let sql = 'SELECT * FROM ingredients WHERE 1=1';
    const params = [];

    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }

    if (search) {
      sql += ' AND name LIKE ?';
      params.push(`%${search}%`);
    }

    sql += ' ORDER BY created_at DESC';

    const ingredients = db.prepare(sql).all(...params);
    res.json({ success: true, data: ingredients });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const ingredient = db.prepare('SELECT * FROM ingredients WHERE id = ?').get(id);

    if (!ingredient) {
      return res.json({ success: false, error: '食材不存在' });
    }

    res.json({ success: true, data: ingredient });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { name, category, calories, protein, fat, carbs, fiber, sodium } = req.body;

    if (!name || !category) {
      return res.json({ success: false, error: '名称和分类为必填项' });
    }

    const existing = db.prepare('SELECT id FROM ingredients WHERE name = ?').get(name);
    if (existing) {
      return res.json({ success: false, error: '食材名称已存在' });
    }

    const result = db.prepare(`
      INSERT INTO ingredients (name, category, calories, protein, fat, carbs, fiber, sodium, is_custom)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
    `).run(
      name,
      category,
      calories || 0,
      protein || 0,
      fat || 0,
      carbs || 0,
      fiber || 0,
      sodium || 0
    );

    const ingredient = db.prepare('SELECT * FROM ingredients WHERE id = ?').get(result.lastInsertRowid);
    res.json({ success: true, data: ingredient });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, calories, protein, fat, carbs, fiber, sodium } = req.body;

    const ingredient = db.prepare('SELECT * FROM ingredients WHERE id = ?').get(id);
    if (!ingredient) {
      return res.json({ success: false, error: '食材不存在' });
    }

    if (name && name !== ingredient.name) {
      const existing = db.prepare('SELECT id FROM ingredients WHERE name = ? AND id != ?').get(name, id);
      if (existing) {
        return res.json({ success: false, error: '食材名称已存在' });
      }
    }

    db.prepare(`
      UPDATE ingredients
      SET name = COALESCE(?, name),
          category = COALESCE(?, category),
          calories = COALESCE(?, calories),
          protein = COALESCE(?, protein),
          fat = COALESCE(?, fat),
          carbs = COALESCE(?, carbs),
          fiber = COALESCE(?, fiber),
          sodium = COALESCE(?, sodium)
      WHERE id = ?
    `).run(
      name,
      category,
      calories,
      protein,
      fat,
      carbs,
      fiber,
      sodium,
      id
    );

    const updated = db.prepare('SELECT * FROM ingredients WHERE id = ?').get(id);
    res.json({ success: true, data: updated });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;

    const ingredient = db.prepare('SELECT * FROM ingredients WHERE id = ?').get(id);
    if (!ingredient) {
      return res.json({ success: false, error: '食材不存在' });
    }

    if (ingredient.is_custom !== 1) {
      return res.json({ success: false, error: '只能删除自定义食材' });
    }

    db.prepare('DELETE FROM ingredients WHERE id = ?').run(id);
    res.json({ success: true, data: { message: '删除成功' } });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

module.exports = router;
