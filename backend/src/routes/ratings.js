const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/recipe/:recipeId', (req, res) => {
  try {
    const { recipeId } = req.params;
    const userId = 1;

    const recipe = db.prepare('SELECT id FROM recipes WHERE id = ?').get(recipeId);
    if (!recipe) {
      return res.json({ success: false, error: '食谱不存在' });
    }

    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total_ratings,
        AVG(rating) as avg_rating
      FROM recipe_ratings 
      WHERE recipe_id = ?
    `).get(recipeId);

    const userRating = db.prepare(`
      SELECT * FROM recipe_ratings 
      WHERE recipe_id = ? AND user_id = ?
    `).get(recipeId, userId);

    const comments = db.prepare(`
      SELECT r.*, u.username
      FROM recipe_ratings r
      JOIN users u ON r.user_id = u.id
      WHERE r.recipe_id = ? AND r.comment IS NOT NULL AND r.comment != ''
      ORDER BY r.created_at DESC
    `).all(recipeId);

    res.json({
      success: true,
      data: {
        recipe_id: recipeId,
        avg_rating: stats.avg_rating ? Math.round(stats.avg_rating * 10) / 10 : 0,
        total_ratings: stats.total_ratings || 0,
        user_rating: userRating || null,
        comments
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
    const { rating, comment } = req.body;

    if (rating === undefined || rating === null) {
      return res.json({ success: false, error: '评分为必填项' });
    }

    const ratingNum = parseInt(rating);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.json({ success: false, error: '评分必须在1-5之间' });
    }

    const recipe = db.prepare('SELECT id FROM recipes WHERE id = ?').get(recipeId);
    if (!recipe) {
      return res.json({ success: false, error: '食谱不存在' });
    }

    const existing = db.prepare(`
      SELECT id FROM recipe_ratings 
      WHERE recipe_id = ? AND user_id = ?
    `).get(recipeId, userId);

    if (existing) {
      db.prepare(`
        UPDATE recipe_ratings
        SET rating = ?, comment = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(ratingNum, comment || null, existing.id);
    } else {
      db.prepare(`
        INSERT INTO recipe_ratings (recipe_id, user_id, rating, comment)
        VALUES (?, ?, ?, ?)
      `).run(recipeId, userId, ratingNum, comment || null);
    }

    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total_ratings,
        AVG(rating) as avg_rating
      FROM recipe_ratings 
      WHERE recipe_id = ?
    `).get(recipeId);

    res.json({
      success: true,
      data: {
        recipe_id: recipeId,
        avg_rating: stats.avg_rating ? Math.round(stats.avg_rating * 10) / 10 : 0,
        total_ratings: stats.total_ratings || 0,
        user_rating: {
          rating: ratingNum,
          comment: comment || null
        }
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
      SELECT id FROM recipe_ratings 
      WHERE recipe_id = ? AND user_id = ?
    `).get(recipeId, userId);

    if (!existing) {
      return res.json({ success: false, error: '评分不存在' });
    }

    db.prepare('DELETE FROM recipe_ratings WHERE id = ?').run(existing.id);

    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total_ratings,
        AVG(rating) as avg_rating
      FROM recipe_ratings 
      WHERE recipe_id = ?
    `).get(recipeId);

    res.json({
      success: true,
      data: {
        recipe_id: recipeId,
        avg_rating: stats.avg_rating ? Math.round(stats.avg_rating * 10) / 10 : 0,
        total_ratings: stats.total_ratings || 0
      }
    });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

module.exports = router;
