const express = require('express');
const db = require('../db');

const router = express.Router();

function calculateNutrition(recipeId, servings) {
  const ingredients = db.prepare(`
    SELECT ri.amount, i.calories, i.protein, i.fat, i.carbs, i.fiber, i.sodium
    FROM recipe_ingredients ri
    JOIN ingredients i ON ri.ingredient_id = i.id
    JOIN recipe_steps rs ON ri.recipe_step_id = rs.id
    WHERE rs.recipe_id = ?
  `).all(recipeId);

  const total = {
    calories: 0,
    protein: 0,
    fat: 0,
    carbs: 0,
    fiber: 0,
    sodium: 0
  };

  ingredients.forEach(ing => {
    const factor = ing.amount / 100;
    total.calories += ing.calories * factor;
    total.protein += ing.protein * factor;
    total.fat += ing.fat * factor;
    total.carbs += ing.carbs * factor;
    total.fiber += ing.fiber * factor;
    total.sodium += ing.sodium * factor;
  });

  const perServing = {
    calories: total.calories / servings,
    protein: total.protein / servings,
    fat: total.fat / servings,
    carbs: total.carbs / servings,
    fiber: total.fiber / servings,
    sodium: total.sodium / servings
  };

  return { total, perServing };
}

function getRecipeWithDetails(recipeId, userId = 1) {
  const recipe = db.prepare(`
    SELECT r.*, u.username, u.nickname
    FROM recipes r
    JOIN users u ON r.author_id = u.id
    WHERE r.id = ?
  `).get(recipeId);
  if (!recipe) return null;

  const steps = db.prepare(`
    SELECT * FROM recipe_steps WHERE recipe_id = ? ORDER BY step_order
  `).all(recipeId);

  const stepsWithIngredients = steps.map(step => {
    const ingredients = db.prepare(`
      SELECT ri.id, ri.ingredient_id, ri.amount, i.name, i.category,
             i.calories, i.protein, i.fat, i.carbs, i.fiber, i.sodium
      FROM recipe_ingredients ri
      JOIN ingredients i ON ri.ingredient_id = i.id
      WHERE ri.recipe_step_id = ?
    `).all(step.id);

    return { ...step, ingredients };
  });

  const nutrition = calculateNutrition(recipeId, recipe.servings);

  const ratingStats = db.prepare(`
    SELECT AVG(rating) as avg_rating, COUNT(*) as total_ratings
    FROM recipe_ratings WHERE recipe_id = ?
  `).get(recipeId);

  const favoriteCount = db.prepare(`
    SELECT COUNT(*) as favorite_count
    FROM recipe_favorites WHERE recipe_id = ?
  `).get(recipeId);

  const userRating = db.prepare(`
    SELECT * FROM recipe_ratings WHERE recipe_id = ? AND user_id = ?
  `).get(recipeId, userId);

  const isFavorite = db.prepare(`
    SELECT id FROM recipe_favorites WHERE recipe_id = ? AND user_id = ?
  `).get(recipeId, userId);

  return {
    ...recipe,
    author_nickname: recipe.nickname || recipe.username,
    steps: stepsWithIngredients,
    totalNutrition: nutrition.total,
    perServingNutrition: nutrition.perServing,
    avg_rating: ratingStats.avg_rating ? Math.round(ratingStats.avg_rating * 10) / 10 : 0,
    total_ratings: ratingStats.total_ratings || 0,
    favorite_count: favoriteCount.favorite_count || 0,
    user_rating: userRating || null,
    is_favorite: !!isFavorite
  };
}

router.get('/recipes', (req, res) => {
  try {
    const { sort_by = 'hot', category, search, page = 1, page_size = 12, user_id = 1 } = req.query;
    const offset = (page - 1) * page_size;

    let sql = `
      SELECT r.*, 
             COALESCE(u.nickname, u.username) as author_nickname,
             COALESCE(AVG(rr.rating), 0) as avg_rating,
             COUNT(DISTINCT rr.id) as rating_count,
             COUNT(DISTINCT rf.id) as favorite_count,
             (COALESCE(AVG(rr.rating), 0) * 2 + COUNT(DISTINCT rf.id)) as hot_score
      FROM recipes r
      JOIN users u ON r.author_id = u.id
      LEFT JOIN recipe_ratings rr ON r.id = rr.recipe_id
      LEFT JOIN recipe_favorites rf ON r.id = rf.recipe_id
      WHERE r.is_public = 1
    `;
    const params = [];

    if (category) {
      sql += ' AND r.category = ?';
      params.push(category);
    }

    if (search) {
      sql += ' AND (r.name LIKE ? OR r.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ' GROUP BY r.id';

    if (sort_by === 'hot') {
      sql += ' ORDER BY hot_score DESC, r.updated_at DESC';
    } else if (sort_by === 'latest') {
      sql += ' ORDER BY r.updated_at DESC';
    } else if (sort_by === 'rating') {
      sql += ' ORDER BY avg_rating DESC, rating_count DESC';
    } else {
      sql += ' ORDER BY r.updated_at DESC';
    }

    sql += ' LIMIT ? OFFSET ?';
    params.push(parseInt(page_size), parseInt(offset));

    const recipes = db.prepare(sql).all(...params);

    const countSql = `
      SELECT COUNT(DISTINCT r.id) as total
      FROM recipes r
      WHERE r.is_public = 1
    `;
    const countParams = [];
    if (category) {
      countSql += ' AND r.category = ?';
      countParams.push(category);
    }
    if (search) {
      countSql += ' AND (r.name LIKE ? OR r.description LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`);
    }
    const { total } = db.prepare(countSql).get(...countParams);

    const result = recipes.map(r => ({
      ...r,
      avg_rating: r.avg_rating ? Math.round(r.avg_rating * 10) / 10 : 0,
      hot_score: r.hot_score ? Math.round(r.hot_score * 10) / 10 : 0
    }));

    res.json({
      success: true,
      data: {
        list: result,
        total,
        page: parseInt(page),
        page_size: parseInt(page_size),
        total_pages: Math.ceil(total / page_size)
      }
    });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

router.get('/recipes/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { user_id = 1 } = req.query;

    const recipe = db.prepare('SELECT id, is_public FROM recipes WHERE id = ?').get(id);
    if (!recipe) {
      return res.json({ success: false, error: '食谱不存在' });
    }

    if (!recipe.is_public) {
      return res.json({ success: false, error: '该食谱未公开' });
    }

    const details = getRecipeWithDetails(id, user_id);
    res.json({ success: true, data: details });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

router.post('/recipes/:id/import', (req, res) => {
  try {
    const { id } = req.params;
    const { user_id = 1, new_name } = req.body;

    const sourceRecipe = db.prepare('SELECT * FROM recipes WHERE id = ? AND is_public = 1').get(id);
    if (!sourceRecipe) {
      return res.json({ success: false, error: '食谱不存在或未公开' });
    }

    const steps = db.prepare(`
      SELECT * FROM recipe_steps WHERE recipe_id = ? ORDER BY step_order
    `).all(id);

    const stepsWithIngredients = steps.map(step => ({
      ...step,
      ingredients: db.prepare(`
        SELECT ri.ingredient_id, ri.amount
        FROM recipe_ingredients ri
        WHERE ri.recipe_step_id = ?
      `).all(step.id)
    }));

    const importedName = new_name || `${sourceRecipe.name} (导入)`;

    const existing = db.prepare('SELECT id FROM recipes WHERE name = ? AND author_id = ?').get(importedName, user_id);
    if (existing) {
      return res.json({ success: false, error: '食谱名称已存在，请使用新名称' });
    }

    let newRecipeId;
    db.exec('BEGIN TRANSACTION');
    try {
      const recipeResult = db.prepare(`
        INSERT INTO recipes (name, category, servings, cover_image, description, author_id, is_public)
        VALUES (?, ?, ?, ?, ?, ?, 0)
      `).run(
        importedName,
        sourceRecipe.category,
        sourceRecipe.servings,
        sourceRecipe.cover_image,
        sourceRecipe.description,
        user_id
      );

      newRecipeId = recipeResult.lastInsertRowid;

      const insertStep = db.prepare(`
        INSERT INTO recipe_steps (recipe_id, step_order, description)
        VALUES (?, ?, ?)
      `);

      const insertIngredient = db.prepare(`
        INSERT INTO recipe_ingredients (recipe_step_id, ingredient_id, amount)
        VALUES (?, ?, ?)
      `);

      stepsWithIngredients.forEach(step => {
        const stepResult = insertStep.run(newRecipeId, step.step_order, step.description);
        const stepId = stepResult.lastInsertRowid;

        if (step.ingredients && step.ingredients.length > 0) {
          step.ingredients.forEach(ing => {
            insertIngredient.run(stepId, ing.ingredient_id, ing.amount);
          });
        }
      });

      const insertVersion = db.prepare(`
        INSERT INTO recipe_versions (recipe_id, version_number, name, category, servings, snapshot_data)
        VALUES (?, 1, ?, ?, ?, ?)
      `);
      const snapshot = JSON.stringify({
        name: importedName,
        category: sourceRecipe.category,
        servings: sourceRecipe.servings,
        steps: stepsWithIngredients
      });
      insertVersion.run(newRecipeId, importedName, sourceRecipe.category, sourceRecipe.servings, snapshot);

      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }

    const importedRecipe = getRecipeWithDetails(newRecipeId, user_id);
    res.json({ success: true, data: { recipe: importedRecipe, message: '导入成功' } });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

module.exports = router;
