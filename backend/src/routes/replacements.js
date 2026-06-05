const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/ingredient/:ingredientId', (req, res) => {
  try {
    const { ingredientId } = req.params;

    const ingredient = db.prepare('SELECT * FROM ingredients WHERE id = ?').get(ingredientId);
    if (!ingredient) {
      return res.json({ success: false, error: '食材不存在' });
    }

    const minCalories = ingredient.calories * 0.8;
    const maxCalories = ingredient.calories * 1.2;

    const replacements = db.prepare(`
      SELECT * FROM ingredients
      WHERE category = ? 
        AND id != ?
        AND calories BETWEEN ? AND ?
      ORDER BY ABS(calories - ?) ASC
      LIMIT 3
    `).all(ingredient.category, ingredientId, minCalories, maxCalories, ingredient.calories);

    if (replacements.length < 3) {
      const additional = db.prepare(`
        SELECT * FROM ingredients
        WHERE category = ? 
          AND id != ?
          AND id NOT IN (${replacements.map(() => '?').join(',') || '-1'})
        ORDER BY ABS(calories - ?) ASC
        LIMIT ?
      `).all(
        ingredient.category, 
        ingredientId, 
        ...replacements.map(r => r.id),
        ingredient.calories,
        3 - replacements.length
      );
      replacements.push(...additional);
    }

    const replacementsWithDiff = replacements.map(r => {
      const calDiff = ((r.calories - ingredient.calories) / ingredient.calories * 100).toFixed(1);
      return {
        ...r,
        calories_diff_percent: parseFloat(calDiff)
      };
    });

    res.json({
      success: true,
      data: {
        original: ingredient,
        replacements: replacementsWithDiff
      }
    });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

router.post('/recipe/:recipeId/calculate', (req, res) => {
  try {
    const { recipeId } = req.params;
    const { replacements } = req.body;

    const recipe = db.prepare('SELECT * FROM recipes WHERE id = ?').get(recipeId);
    if (!recipe) {
      return res.json({ success: false, error: '食谱不存在' });
    }

    const replacementMap = {};
    if (replacements && Array.isArray(replacements)) {
      replacements.forEach(r => {
        if (r.original_id && r.replacement_id) {
          replacementMap[r.original_id] = r.replacement_id;
        }
      });
    }

    const steps = db.prepare(`
      SELECT * FROM recipe_steps WHERE recipe_id = ? ORDER BY step_order
    `).all(recipeId);

    const total = {
      calories: 0,
      protein: 0,
      fat: 0,
      carbs: 0,
      fiber: 0,
      sodium: 0
    };

    const replacedIngredients = [];

    for (const step of steps) {
      const ingredients = db.prepare(`
        SELECT ri.id, ri.ingredient_id, ri.amount, i.name, i.category,
               i.calories, i.protein, i.fat, i.carbs, i.fiber, i.sodium
        FROM recipe_ingredients ri
        JOIN ingredients i ON ri.ingredient_id = i.id
        WHERE ri.recipe_step_id = ?
      `).all(step.id);

      for (const ing of ingredients) {
        const factor = ing.amount / 100;
        const replacementId = replacementMap[ing.ingredient_id];

        if (replacementId) {
          const replacement = db.prepare('SELECT * FROM ingredients WHERE id = ?').get(replacementId);
          if (replacement) {
            total.calories += replacement.calories * factor;
            total.protein += replacement.protein * factor;
            total.fat += replacement.fat * factor;
            total.carbs += replacement.carbs * factor;
            total.fiber += replacement.fiber * factor;
            total.sodium += replacement.sodium * factor;

            replacedIngredients.push({
              step_id: step.id,
              step_order: step.step_order,
              original_ingredient_id: ing.ingredient_id,
              original_name: ing.name,
              replacement_ingredient_id: replacement.id,
              replacement_name: replacement.name,
              amount: ing.amount
            });
          } else {
            total.calories += ing.calories * factor;
            total.protein += ing.protein * factor;
            total.fat += ing.fat * factor;
            total.carbs += ing.carbs * factor;
            total.fiber += ing.fiber * factor;
            total.sodium += ing.sodium * factor;
          }
        } else {
          total.calories += ing.calories * factor;
          total.protein += ing.protein * factor;
          total.fat += ing.fat * factor;
          total.carbs += ing.carbs * factor;
          total.fiber += ing.fiber * factor;
          total.sodium += ing.sodium * factor;
        }
      }
    }

    const perServing = {
      calories: total.calories / recipe.servings,
      protein: total.protein / recipe.servings,
      fat: total.fat / recipe.servings,
      carbs: total.carbs / recipe.servings,
      fiber: total.fiber / recipe.servings,
      sodium: total.sodium / recipe.servings
    };

    const totalCaloriesFromMacros = total.protein * 4 + total.fat * 9 + total.carbs * 4;
    const macroRatio = {
      protein: totalCaloriesFromMacros > 0 ? Math.round((total.protein * 4 / totalCaloriesFromMacros * 100)) : 0,
      fat: totalCaloriesFromMacros > 0 ? Math.round((total.fat * 9 / totalCaloriesFromMacros * 100)) : 0,
      carbs: totalCaloriesFromMacros > 0 ? Math.round((total.carbs * 4 / totalCaloriesFromMacros * 100)) : 0
    };

    res.json({
      success: true,
      data: {
        recipe_id: recipeId,
        servings: recipe.servings,
        totalNutrition: total,
        perServingNutrition: perServing,
        macroRatio,
        replaced_ingredients: replacedIngredients
      }
    });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

module.exports = router;
