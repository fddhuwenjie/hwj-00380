const express = require('express');
const db = require('../db');

const router = express.Router();

function calculateItemNutrition(item) {
  if (item.item_type === 'recipe' && item.recipe_id) {
    const ingredients = db.prepare(`
      SELECT ri.amount, i.calories, i.protein, i.fat, i.carbs, i.fiber, i.sodium
      FROM recipe_ingredients ri
      JOIN ingredients i ON ri.ingredient_id = i.id
      JOIN recipe_steps rs ON ri.recipe_step_id = rs.id
      WHERE rs.recipe_id = ?
    `).all(item.recipe_id);

    const recipe = db.prepare('SELECT servings FROM recipes WHERE id = ?').get(item.recipe_id);
    const recipeServings = recipe ? recipe.servings : 1;

    let total = { calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0, sodium: 0 };
    ingredients.forEach(ing => {
      const factor = ing.amount / 100;
      total.calories += ing.calories * factor;
      total.protein += ing.protein * factor;
      total.fat += ing.fat * factor;
      total.carbs += ing.carbs * factor;
      total.fiber += ing.fiber * factor;
      total.sodium += ing.sodium * factor;
    });

    const servingFactor = (item.servings || 1) / recipeServings;
    return {
      calories: Math.round(total.calories * servingFactor * 10) / 10,
      protein: Math.round(total.protein * servingFactor * 10) / 10,
      fat: Math.round(total.fat * servingFactor * 10) / 10,
      carbs: Math.round(total.carbs * servingFactor * 10) / 10,
      fiber: Math.round(total.fiber * servingFactor * 10) / 10,
      sodium: Math.round(total.sodium * servingFactor * 10) / 10
    };
  } else if (item.ingredient_id) {
    const ingredient = db.prepare('SELECT * FROM ingredients WHERE id = ?').get(item.ingredient_id);
    if (!ingredient) {
      return { calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0, sodium: 0 };
    }
    const factor = (item.amount || 0) / 100;
    return {
      calories: Math.round(ingredient.calories * factor * 10) / 10,
      protein: Math.round(ingredient.protein * factor * 10) / 10,
      fat: Math.round(ingredient.fat * factor * 10) / 10,
      carbs: Math.round(ingredient.carbs * factor * 10) / 10,
      fiber: Math.round(ingredient.fiber * factor * 10) / 10,
      sodium: Math.round(ingredient.sodium * factor * 10) / 10
    };
  }
  return { calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0, sodium: 0 };
}

router.get('/', (req, res) => {
  try {
    const userId = 1;
    const { date } = req.query;

    let logDate = date;
    if (!logDate) {
      const today = new Date();
      logDate = today.toISOString().split('T')[0];
    }

    let diary = db.prepare(`
      SELECT * FROM food_diary 
      WHERE user_id = ? AND log_date = ?
    `).get(userId, logDate);

    if (!diary) {
      db.prepare(`
        INSERT INTO food_diary (user_id, log_date)
        VALUES (?, ?)
      `).run(userId, logDate);
      diary = db.prepare(`
        SELECT * FROM food_diary 
        WHERE user_id = ? AND log_date = ?
      `).get(userId, logDate);
    }

    const items = db.prepare(`
      SELECT fdi.*, r.name as recipe_name, i.name as ingredient_name
      FROM food_diary_items fdi
      LEFT JOIN recipes r ON fdi.recipe_id = r.id
      LEFT JOIN ingredients i ON fdi.ingredient_id = i.id
      WHERE fdi.diary_id = ?
      ORDER BY fdi.created_at ASC
    `).all(diary.id);

    const total = items.reduce((sum, item) => ({
      calories: sum.calories + item.calories,
      protein: sum.protein + item.protein,
      fat: sum.fat + item.fat,
      carbs: sum.carbs + item.carbs,
      fiber: sum.fiber + item.fiber,
      sodium: sum.sodium + item.sodium
    }), { calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0, sodium: 0 });

    const user = db.prepare('SELECT tdee FROM users ORDER BY id LIMIT 1').get();
    const tdee = user ? user.tdee : 2000;
    const targets = {
      calories: tdee,
      protein: Math.round((tdee * 0.3) / 4),
      fat: Math.round((tdee * 0.3) / 9),
      carbs: Math.round((tdee * 0.4) / 4),
      fiber: 25,
      sodium: 2000
    };

    const getStatus = (actual, target) => {
      const ratio = actual / target;
      if (ratio < 0.9) return 'deficit';
      if (ratio > 1.1) return 'excess';
      return 'normal';
    };

    const summary = {
      calories: { actual: Math.round(total.calories), target: targets.calories, status: getStatus(total.calories, targets.calories) },
      protein: { actual: Math.round(total.protein), target: targets.protein, status: getStatus(total.protein, targets.protein) },
      fat: { actual: Math.round(total.fat), target: targets.fat, status: getStatus(total.fat, targets.fat) },
      carbs: { actual: Math.round(total.carbs), target: targets.carbs, status: getStatus(total.carbs, targets.carbs) },
      fiber: { actual: Math.round(total.fiber), target: targets.fiber, status: getStatus(total.fiber, targets.fiber) },
      sodium: { actual: Math.round(total.sodium), target: targets.sodium, status: getStatus(total.sodium, targets.sodium) }
    };

    res.json({
      success: true,
      data: {
        diary_id: diary.id,
        log_date: logDate,
        items,
        total,
        summary,
        targets
      }
    });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

router.get('/history', (req, res) => {
  try {
    const userId = 1;
    const { start_date, end_date } = req.query;

    let sql = `
      SELECT fd.*, 
             COALESCE(SUM(fdi.calories), 0) as total_calories,
             COALESCE(SUM(fdi.protein), 0) as total_protein,
             COALESCE(SUM(fdi.fat), 0) as total_fat,
             COALESCE(SUM(fdi.carbs), 0) as total_carbs,
             COALESCE(SUM(fdi.fiber), 0) as total_fiber,
             COALESCE(SUM(fdi.sodium), 0) as total_sodium,
             COUNT(fdi.id) as item_count
      FROM food_diary fd
      LEFT JOIN food_diary_items fdi ON fd.id = fdi.diary_id
      WHERE fd.user_id = ?
    `;
    const params = [userId];

    if (start_date) {
      sql += ' AND fd.log_date >= ?';
      params.push(start_date);
    }
    if (end_date) {
      sql += ' AND fd.log_date <= ?';
      params.push(end_date);
    }

    sql += ' GROUP BY fd.id ORDER BY fd.log_date DESC';

    const history = db.prepare(sql).all(...params);

    res.json({ success: true, data: history });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

router.post('/item', (req, res) => {
  try {
    const userId = 1;
    const { date, meal_type, item_type, recipe_id, ingredient_id, ingredient_name, amount, servings } = req.body;

    if (!meal_type) {
      return res.json({ success: false, error: '餐次为必填项' });
    }
    if (!item_type) {
      return res.json({ success: false, error: '项目类型为必填项' });
    }
    if (item_type === 'recipe' && !recipe_id) {
      return res.json({ success: false, error: '食谱ID为必填项' });
    }
    if (item_type === 'ingredient' && !ingredient_id && !ingredient_name) {
      return res.json({ success: false, error: '食材ID或名称为必填项' });
    }

    let logDate = date;
    if (!logDate) {
      const today = new Date();
      logDate = today.toISOString().split('T')[0];
    }

    let diary = db.prepare(`
      SELECT * FROM food_diary 
      WHERE user_id = ? AND log_date = ?
    `).get(userId, logDate);

    if (!diary) {
      const result = db.prepare(`
        INSERT INTO food_diary (user_id, log_date)
        VALUES (?, ?)
      `).run(userId, logDate);
      diary = { id: result.lastInsertRowid };
    }

    const nutrition = calculateItemNutrition({
      item_type,
      recipe_id,
      ingredient_id,
      amount: amount || 100,
      servings: servings || 1
    });

    const result = db.prepare(`
      INSERT INTO food_diary_items 
      (diary_id, meal_type, item_type, recipe_id, ingredient_id, ingredient_name, amount, servings, 
       calories, protein, fat, carbs, fiber, sodium)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      diary.id, meal_type, item_type, recipe_id || null, ingredient_id || null, 
      ingredient_name || null, amount || 0, servings || 1,
      nutrition.calories, nutrition.protein, nutrition.fat, nutrition.carbs, nutrition.fiber, nutrition.sodium
    );

    const item = db.prepare('SELECT * FROM food_diary_items WHERE id = ?').get(result.lastInsertRowid);

    res.json({ success: true, data: item });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

router.delete('/item/:itemId', (req, res) => {
  try {
    const { itemId } = req.params;
    const userId = 1;

    const item = db.prepare(`
      SELECT fdi.* FROM food_diary_items fdi
      JOIN food_diary fd ON fdi.diary_id = fd.id
      WHERE fdi.id = ? AND fd.user_id = ?
    `).get(itemId, userId);

    if (!item) {
      return res.json({ success: false, error: '记录不存在' });
    }

    db.prepare('DELETE FROM food_diary_items WHERE id = ?').run(itemId);

    res.json({ success: true, data: { message: '删除成功' } });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

module.exports = router;
