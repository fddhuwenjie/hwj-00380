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
  const recipe = db.prepare('SELECT * FROM recipes WHERE id = ?').get(recipeId);
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

  const userRating = db.prepare(`
    SELECT * FROM recipe_ratings WHERE recipe_id = ? AND user_id = ?
  `).get(recipeId, userId);

  const isFavorite = db.prepare(`
    SELECT id FROM recipe_favorites WHERE recipe_id = ? AND user_id = ?
  `).get(recipeId, userId);

  return {
    ...recipe,
    steps: stepsWithIngredients,
    totalNutrition: nutrition.total,
    perServingNutrition: nutrition.perServing,
    avg_rating: ratingStats.avg_rating ? Math.round(ratingStats.avg_rating * 10) / 10 : 0,
    total_ratings: ratingStats.total_ratings || 0,
    user_rating: userRating || null,
    is_favorite: !!isFavorite
  };
}

router.get('/', (req, res) => {
  try {
    const { category, search, sort_by, user_id = 1 } = req.query;
    let sql = `
      SELECT r.*, 
             COALESCE(AVG(rr.rating), 0) as avg_rating,
             COUNT(DISTINCT rr.id) as rating_count,
             CASE WHEN rf.id IS NOT NULL THEN 1 ELSE 0 END as is_favorite
      FROM recipes r
      LEFT JOIN recipe_ratings rr ON r.id = rr.recipe_id
      LEFT JOIN recipe_favorites rf ON r.id = rf.recipe_id AND rf.user_id = ?
      WHERE 1=1
    `;
    const params = [user_id];

    if (category) {
      sql += ' AND r.category = ?';
      params.push(category);
    }

    if (search) {
      sql += ' AND r.name LIKE ?';
      params.push(`%${search}%`);
    }

    sql += ' GROUP BY r.id';

    if (sort_by === 'rating') {
      sql += ' ORDER BY avg_rating DESC, rating_count DESC';
    } else if (sort_by === 'name') {
      sql += ' ORDER BY r.name ASC';
    } else {
      sql += ' ORDER BY r.updated_at DESC';
    }

    const recipes = db.prepare(sql).all(...params);
    
    const result = recipes.map(r => ({
      ...r,
      avg_rating: r.avg_rating ? Math.round(r.avg_rating * 10) / 10 : 0,
      is_favorite: r.is_favorite === 1
    }));

    res.json({ success: true, data: result });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const recipe = getRecipeWithDetails(id);

    if (!recipe) {
      return res.json({ success: false, error: '食谱不存在' });
    }

    res.json({ success: true, data: recipe });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { name, category, servings, steps } = req.body;

    if (!name || !category || !servings || !steps) {
      return res.json({ success: false, error: '名称、分类、份数和步骤为必填项' });
    }

    const existing = db.prepare('SELECT id FROM recipes WHERE name = ?').get(name);
    if (existing) {
      return res.json({ success: false, error: '食谱名称已存在' });
    }

    let recipeId;
    db.exec('BEGIN TRANSACTION');
    try {
      const recipeResult = db.prepare(`
        INSERT INTO recipes (name, category, servings)
        VALUES (?, ?, ?)
      `).run(name, category, servings);

      recipeId = recipeResult.lastInsertRowid;

      const insertStep = db.prepare(`
        INSERT INTO recipe_steps (recipe_id, step_order, description)
        VALUES (?, ?, ?)
      `);

      const insertIngredient = db.prepare(`
        INSERT INTO recipe_ingredients (recipe_step_id, ingredient_id, amount)
        VALUES (?, ?, ?)
      `);

      steps.forEach(step => {
        const stepResult = insertStep.run(recipeId, step.step_order, step.description);
        const stepId = stepResult.lastInsertRowid;

        if (step.ingredients && step.ingredients.length > 0) {
          step.ingredients.forEach(ing => {
            let ingredientId;
            if (ing.ingredient_id) {
              ingredientId = ing.ingredient_id;
            } else if (ing.ingredient_name) {
              const ingredient = db.prepare('SELECT id FROM ingredients WHERE name = ?').get(ing.ingredient_name);
              if (!ingredient) {
                throw new Error(`食材不存在: ${ing.ingredient_name}`);
              }
              ingredientId = ingredient.id;
            }

            if (ingredientId) {
              insertIngredient.run(stepId, ingredientId, ing.amount);
            }
          });
        }
      });

      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
    const recipe = getRecipeWithDetails(recipeId);
    res.json({ success: true, data: recipe });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, servings, steps } = req.body;

    const recipe = db.prepare('SELECT * FROM recipes WHERE id = ?').get(id);
    if (!recipe) {
      return res.json({ success: false, error: '食谱不存在' });
    }

    if (name && name !== recipe.name) {
      const existing = db.prepare('SELECT id FROM recipes WHERE name = ? AND id != ?').get(name, id);
      if (existing) {
        return res.json({ success: false, error: '食谱名称已存在' });
      }
    }

    db.exec('BEGIN TRANSACTION');
    try {
      db.prepare(`
        UPDATE recipes
        SET name = COALESCE(?, name),
            category = COALESCE(?, category),
            servings = COALESCE(?, servings),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(name, category, servings, id);

      if (steps) {
        db.prepare('DELETE FROM recipe_ingredients WHERE recipe_step_id IN (SELECT id FROM recipe_steps WHERE recipe_id = ?)').run(id);
        db.prepare('DELETE FROM recipe_steps WHERE recipe_id = ?').run(id);

        const insertStep = db.prepare(`
          INSERT INTO recipe_steps (recipe_id, step_order, description)
          VALUES (?, ?, ?)
        `);

        const insertIngredient = db.prepare(`
          INSERT INTO recipe_ingredients (recipe_step_id, ingredient_id, amount)
          VALUES (?, ?, ?)
        `);

        steps.forEach(step => {
          const stepResult = insertStep.run(id, step.step_order, step.description);
          const stepId = stepResult.lastInsertRowid;

          if (step.ingredients && step.ingredients.length > 0) {
            step.ingredients.forEach(ing => {
              let ingredientId;
              if (ing.ingredient_id) {
                ingredientId = ing.ingredient_id;
              } else if (ing.ingredient_name) {
                const ingredient = db.prepare('SELECT id FROM ingredients WHERE name = ?').get(ing.ingredient_name);
                if (!ingredient) {
                  throw new Error(`食材不存在: ${ing.ingredient_name}`);
                }
                ingredientId = ingredient.id;
              }

              if (ingredientId) {
                insertIngredient.run(stepId, ingredientId, ing.amount);
              }
            });
          }
        });
      }

      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
    const updated = getRecipeWithDetails(id);
    res.json({ success: true, data: updated });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;

    const recipe = db.prepare('SELECT * FROM recipes WHERE id = ?').get(id);
    if (!recipe) {
      return res.json({ success: false, error: '食谱不存在' });
    }

    db.prepare('DELETE FROM recipes WHERE id = ?').run(id);
    res.json({ success: true, data: { message: '删除成功' } });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

router.get('/:id/nutrition', (req, res) => {
  try {
    const { id } = req.params;

    const recipe = db.prepare('SELECT * FROM recipes WHERE id = ?').get(id);
    if (!recipe) {
      return res.json({ success: false, error: '食谱不存在' });
    }

    const nutrition = calculateNutrition(id, recipe.servings);

    const totalCaloriesFromMacros = nutrition.total.protein * 4 + nutrition.total.fat * 9 + nutrition.total.carbs * 4;
    const macroRatio = {
      protein: totalCaloriesFromMacros > 0 ? (nutrition.total.protein * 4 / totalCaloriesFromMacros * 100) : 0,
      fat: totalCaloriesFromMacros > 0 ? (nutrition.total.fat * 9 / totalCaloriesFromMacros * 100) : 0,
      carbs: totalCaloriesFromMacros > 0 ? (nutrition.total.carbs * 4 / totalCaloriesFromMacros * 100) : 0
    };

    const perServingCaloriesFromMacros = nutrition.perServing.protein * 4 + nutrition.perServing.fat * 9 + nutrition.perServing.carbs * 4;
    const perServingMacroRatio = {
      protein: perServingCaloriesFromMacros > 0 ? (nutrition.perServing.protein * 4 / perServingCaloriesFromMacros * 100) : 0,
      fat: perServingCaloriesFromMacros > 0 ? (nutrition.perServing.fat * 9 / perServingCaloriesFromMacros * 100) : 0,
      carbs: perServingCaloriesFromMacros > 0 ? (nutrition.perServing.carbs * 4 / perServingCaloriesFromMacros * 100) : 0
    };

    const warnings = [];
    if (nutrition.perServing.sodium > 600) warnings.push('高钠');
    if (nutrition.perServing.fat > 20) warnings.push('高脂');
    if (nutrition.perServing.carbs > 25) warnings.push('高糖');

    res.json({
      success: true,
      data: {
        recipeId: id,
        servings: recipe.servings,
        totalNutrition: nutrition.total,
        perServingNutrition: nutrition.perServing,
        macroRatio,
        perServingMacroRatio,
        warnings
      }
    });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

module.exports = router;
