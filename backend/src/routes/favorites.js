const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const userId = 1;
    const favorites = db.prepare(`
      SELECT rf.*, r.name, r.category, r.servings, r.created_at
      FROM recipe_favorites rf
      JOIN recipes r ON rf.recipe_id = r.id
      WHERE rf.user_id = ?
      ORDER BY rf.created_at DESC
    `).all(userId);

    res.json({ success: true, data: favorites });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

router.get('/recipe/:recipeId', (req, res) => {
  try {
    const { recipeId } = req.params;
    const userId = 1;

    const favorite = db.prepare(`
      SELECT * FROM recipe_favorites 
      WHERE recipe_id = ? AND user_id = ?
    `).get(recipeId, userId);

    res.json({
      success: true,
      data: {
        recipe_id: recipeId,
        is_favorite: !!favorite
      }
    });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

router.post('/recipe/:recipeId', (req, res) => {
  try {
    const { recipeId } = req.params;
    const userId = 1;

    const recipe = db.prepare('SELECT id FROM recipes WHERE id = ?').get(recipeId);
    if (!recipe) {
      return res.json({ success: false, error: '食谱不存在' });
    }

    const existing = db.prepare(`
      SELECT id FROM recipe_favorites 
      WHERE recipe_id = ? AND user_id = ?
    `).get(recipeId, userId);

    if (existing) {
      return res.json({ success: false, error: '已收藏该食谱' });
    }

    db.prepare(`
      INSERT INTO recipe_favorites (recipe_id, user_id)
      VALUES (?, ?)
    `).run(recipeId, userId);

    const count = db.prepare(`
      SELECT COUNT(*) as total FROM recipe_favorites WHERE user_id = ?
    `).get(userId);

    res.json({
      success: true,
      data: {
        recipe_id: recipeId,
        is_favorite: true,
        total_favorites: count.total
      }
    });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

router.delete('/recipe/:recipeId', (req, res) => {
  try {
    const { recipeId } = req.params;
    const userId = 1;

    const existing = db.prepare(`
      SELECT id FROM recipe_favorites 
      WHERE recipe_id = ? AND user_id = ?
    `).get(recipeId, userId);

    if (!existing) {
      return res.json({ success: false, error: '未收藏该食谱' });
    }

    db.prepare('DELETE FROM recipe_favorites WHERE id = ?').run(existing.id);

    const count = db.prepare(`
      SELECT COUNT(*) as total FROM recipe_favorites WHERE user_id = ?
    `).get(userId);

    res.json({
      success: true,
      data: {
        recipe_id: recipeId,
        is_favorite: false,
        total_favorites: count.total
      }
    });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

router.post('/recipe/:recipeId/toggle', (req, res) => {
  try {
    const { recipeId } = req.params;
    const userId = 1;

    const recipe = db.prepare('SELECT id FROM recipes WHERE id = ?').get(recipeId);
    if (!recipe) {
      return res.json({ success: false, error: '食谱不存在' });
    }

    const existing = db.prepare(`
      SELECT id FROM recipe_favorites 
      WHERE recipe_id = ? AND user_id = ?
    `).get(recipeId, userId);

    let isFavorite;
    if (existing) {
      db.prepare('DELETE FROM recipe_favorites WHERE id = ?').run(existing.id);
      isFavorite = false;
    } else {
      db.prepare(`
        INSERT INTO recipe_favorites (recipe_id, user_id)
        VALUES (?, ?)
      `).run(recipeId, userId);
      isFavorite = true;
    }

    const count = db.prepare(`
      SELECT COUNT(*) as total FROM recipe_favorites WHERE user_id = ?
    `).get(userId);

    res.json({
      success: true,
      data: {
        recipe_id: recipeId,
        is_favorite: isFavorite,
        total_favorites: count.total
      }
    });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

module.exports = router;
