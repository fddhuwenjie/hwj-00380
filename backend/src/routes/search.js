const express = require('express');
const db = require('../db');

const router = express.Router();

function calculateRecipeNutrition(recipeId) {
  const ingredients = db.prepare(`
    SELECT ri.amount, i.calories, i.protein, i.fat, i.carbs, i.fiber, i.sodium
    FROM recipe_ingredients ri
    JOIN ingredients i ON ri.ingredient_id = i.id
    JOIN recipe_steps rs ON ri.recipe_step_id = rs.id
    WHERE rs.recipe_id = ?
  `).all(recipeId);

  const recipe = db.prepare('SELECT servings FROM recipes WHERE id = ?').get(recipeId);
  const servings = recipe ? recipe.servings : 1;

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

router.get('/recipes', (req, res) => {
  try {
    const {
      caloriesMin, caloriesMax,
      proteinMin, proteinMax,
      fatMin, fatMax,
      carbsMin, carbsMax
    } = req.query;

    const recipes = db.prepare('SELECT * FROM recipes').all();

    const recipesWithNutrition = recipes.map(recipe => {
      const nutrition = calculateRecipeNutrition(recipe.id);
      return { ...recipe, nutrition: nutrition.perServing };
    });

    const filtered = recipesWithNutrition.filter(recipe => {
      const n = recipe.nutrition;
      if (caloriesMin !== undefined && n.calories < parseFloat(caloriesMin)) return false;
      if (caloriesMax !== undefined && n.calories > parseFloat(caloriesMax)) return false;
      if (proteinMin !== undefined && n.protein < parseFloat(proteinMin)) return false;
      if (proteinMax !== undefined && n.protein > parseFloat(proteinMax)) return false;
      if (fatMin !== undefined && n.fat < parseFloat(fatMin)) return false;
      if (fatMax !== undefined && n.fat > parseFloat(fatMax)) return false;
      if (carbsMin !== undefined && n.carbs < parseFloat(carbsMin)) return false;
      if (carbsMax !== undefined && n.carbs > parseFloat(carbsMax)) return false;
      return true;
    });

    res.json({ success: true, data: filtered });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

router.get('/recipes/by-ingredient', (req, res) => {
  try {
    const { name } = req.query;

    if (!name) {
      return res.json({ success: false, error: '食材名称为必填项' });
    }

    const recipes = db.prepare(`
      SELECT DISTINCT r.*
      FROM recipes r
      JOIN recipe_steps rs ON r.id = rs.recipe_id
      JOIN recipe_ingredients ri ON rs.id = ri.recipe_step_id
      JOIN ingredients i ON ri.ingredient_id = i.id
      WHERE i.name LIKE ?
      ORDER BY r.updated_at DESC
    `).all(`%${name}%`);

    const recipesWithNutrition = recipes.map(recipe => {
      const nutrition = calculateRecipeNutrition(recipe.id);
      return { ...recipe, nutrition: nutrition.perServing };
    });

    res.json({ success: true, data: recipesWithNutrition });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

router.get('/recommendations', (req, res) => {
  try {
    const { ingredients } = req.query;

    if (!ingredients) {
      return res.json({ success: false, error: '食材列表为必填项' });
    }

    const ingredientNames = ingredients.split(',').map(name => name.trim()).filter(name => name);

    if (ingredientNames.length === 0) {
      return res.json({ success: false, error: '请输入至少一个食材名称' });
    }

    const placeholders = ingredientNames.map(() => '?').join(',');

    const ingredientIds = db.prepare(`
      SELECT id FROM ingredients WHERE name IN (${placeholders})
    `).all(...ingredientNames).map(row => row.id);

    if (ingredientIds.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const recipeMatchCounts = db.prepare(`
      SELECT r.id, r.name, r.category, r.servings,
             COUNT(DISTINCT ri.ingredient_id) as match_count
      FROM recipes r
      JOIN recipe_steps rs ON r.id = rs.recipe_id
      JOIN recipe_ingredients ri ON rs.id = ri.recipe_step_id
      WHERE ri.ingredient_id IN (${ingredientIds.map(() => '?').join(',')})
      GROUP BY r.id, r.name, r.category, r.servings
      ORDER BY match_count DESC, r.updated_at DESC
    `).all(...ingredientIds);

    const totalIngredientsStmt = db.prepare(`
      SELECT COUNT(DISTINCT ingredient_id) as total
      FROM recipe_ingredients ri
      JOIN recipe_steps rs ON ri.recipe_step_id = rs.id
      WHERE rs.recipe_id = ?
    `);

    const recipesWithDetails = recipeMatchCounts.map(recipe => {
      const totalIng = totalIngredientsStmt.get(recipe.id).total;
      const matchRatio = recipe.match_count / totalIng;
      const nutrition = calculateRecipeNutrition(recipe.id);

      return {
        ...recipe,
        total_ingredients: totalIng,
        match_ratio: matchRatio,
        nutrition: nutrition.perServing
      };
    });

    res.json({ success: true, data: recipesWithDetails });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

module.exports = router;
