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

function getRecipeWithDetails(recipeId) {
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

  return {
    ...recipe,
    steps: stepsWithIngredients,
    totalNutrition: nutrition.total,
    perServingNutrition: nutrition.perServing
  };
}

router.get('/', (req, res) => {
  try {
    const { category, search } = req.query;
    let sql = 'SELECT * FROM recipes WHERE 1=1';
    const params = [];

    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }

    if (search) {
      sql += ' AND name LIKE ?';
      params.push(`%${search}%`);
    }

    sql += ' ORDER BY updated_at DESC';

    const recipes = db.prepare(sql).all(...params);
    res.json({ success: true, data: recipes });
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
