const express = require('express');
const db = require('../db');

const router = express.Router();

function calculateRecipeNutrition(recipeId, servings) {
  const ingredients = db.prepare(`
    SELECT ri.amount, i.calories, i.protein, i.fat, i.carbs, i.fiber, i.sodium
    FROM recipe_ingredients ri
    JOIN ingredients i ON ri.ingredient_id = i.id
    JOIN recipe_steps rs ON ri.recipe_step_id = rs.id
    WHERE rs.recipe_id = ?
  `).all(recipeId);

  const recipe = db.prepare('SELECT servings FROM recipes WHERE id = ?').get(recipeId);
  const recipeServings = recipe ? recipe.servings : 1;

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
    calories: total.calories / recipeServings * servings,
    protein: total.protein / recipeServings * servings,
    fat: total.fat / recipeServings * servings,
    carbs: total.carbs / recipeServings * servings,
    fiber: total.fiber / recipeServings * servings,
    sodium: total.sodium / recipeServings * servings
  };

  return perServing;
}

function sumNutrition(nutritionList) {
  const sum = {
    calories: 0,
    protein: 0,
    fat: 0,
    carbs: 0,
    fiber: 0,
    sodium: 0
  };

  nutritionList.forEach(n => {
    sum.calories += n.calories;
    sum.protein += n.protein;
    sum.fat += n.fat;
    sum.carbs += n.carbs;
    sum.fiber += n.fiber;
    sum.sodium += n.sodium;
  });

  return sum;
}

function getMealPlanWithDetails(planId) {
  const plan = db.prepare('SELECT * FROM meal_plans WHERE id = ?').get(planId);
  if (!plan) return null;

  const items = db.prepare(`
    SELECT mpi.*, r.name as recipe_name, r.category as recipe_category
    FROM meal_plan_items mpi
    JOIN recipes r ON mpi.recipe_id = r.id
    WHERE mpi.meal_plan_id = ?
    ORDER BY mpi.day_index, mpi.meal_type
  `).all(planId);

  const itemsWithNutrition = items.map(item => ({
    ...item,
    nutrition: calculateRecipeNutrition(item.recipe_id, item.servings)
  }));

  const dailyNutrition = {};
  for (let i = 0; i < 7; i++) {
    const dayItems = itemsWithNutrition.filter(item => item.day_index === i);
    dailyNutrition[i] = sumNutrition(dayItems.map(item => item.nutrition));
  }

  const weeklyNutrition = sumNutrition(itemsWithNutrition.map(item => item.nutrition));

  return {
    ...plan,
    items: itemsWithNutrition,
    dailyNutrition,
    weeklyNutrition
  };
}

router.get('/', (req, res) => {
  try {
    const plans = db.prepare('SELECT * FROM meal_plans ORDER BY week_start_date DESC').all();
    res.json({ success: true, data: plans });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

router.get('/current', (req, res) => {
  try {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    const weekStart = monday.toISOString().split('T')[0];

    let plan = db.prepare('SELECT * FROM meal_plans WHERE week_start_date = ?').get(weekStart);

    if (!plan) {
      const result = db.prepare(`
        INSERT INTO meal_plans (week_start_date)
        VALUES (?)
      `).run(weekStart);
      plan = db.prepare('SELECT * FROM meal_plans WHERE id = ?').get(result.lastInsertRowid);
    }

    const planDetails = getMealPlanWithDetails(plan.id);
    res.json({ success: true, data: planDetails });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const plan = getMealPlanWithDetails(id);

    if (!plan) {
      return res.json({ success: false, error: '计划不存在' });
    }

    res.json({ success: true, data: plan });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { week_start_date } = req.body;

    if (!week_start_date) {
      return res.json({ success: false, error: '周开始日期为必填项' });
    }

    const existing = db.prepare('SELECT id FROM meal_plans WHERE week_start_date = ?').get(week_start_date);
    if (existing) {
      return res.json({ success: false, error: '该周计划已存在' });
    }

    const result = db.prepare(`
      INSERT INTO meal_plans (week_start_date)
      VALUES (?)
    `).run(week_start_date);

    const plan = getMealPlanWithDetails(result.lastInsertRowid);
    res.json({ success: true, data: plan });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

router.post('/:id/items', (req, res) => {
  try {
    const { id } = req.params;
    const { day_index, meal_type, recipe_id, servings } = req.body;

    const plan = db.prepare('SELECT * FROM meal_plans WHERE id = ?').get(id);
    if (!plan) {
      return res.json({ success: false, error: '计划不存在' });
    }

    if (day_index === undefined || !meal_type || !recipe_id) {
      return res.json({ success: false, error: '天索引、餐次类型和食谱ID为必填项' });
    }

    const recipe = db.prepare('SELECT * FROM recipes WHERE id = ?').get(recipe_id);
    if (!recipe) {
      return res.json({ success: false, error: '食谱不存在' });
    }

    const result = db.prepare(`
      INSERT INTO meal_plan_items (meal_plan_id, day_index, meal_type, recipe_id, servings)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, day_index, meal_type, recipe_id, servings || 1);

    const item = db.prepare(`
      SELECT mpi.*, r.name as recipe_name, r.category as recipe_category
      FROM meal_plan_items mpi
      JOIN recipes r ON mpi.recipe_id = r.id
      WHERE mpi.id = ?
    `).get(result.lastInsertRowid);

    const itemWithNutrition = {
      ...item,
      nutrition: calculateRecipeNutrition(item.recipe_id, item.servings)
    };

    res.json({ success: true, data: itemWithNutrition });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

router.put('/:id/items/:itemId', (req, res) => {
  try {
    const { id, itemId } = req.params;
    const { day_index, meal_type, recipe_id, servings } = req.body;

    const plan = db.prepare('SELECT * FROM meal_plans WHERE id = ?').get(id);
    if (!plan) {
      return res.json({ success: false, error: '计划不存在' });
    }

    const item = db.prepare('SELECT * FROM meal_plan_items WHERE id = ? AND meal_plan_id = ?').get(itemId, id);
    if (!item) {
      return res.json({ success: false, error: '餐项不存在' });
    }

    if (recipe_id) {
      const recipe = db.prepare('SELECT * FROM recipes WHERE id = ?').get(recipe_id);
      if (!recipe) {
        return res.json({ success: false, error: '食谱不存在' });
      }
    }

    db.prepare(`
      UPDATE meal_plan_items
      SET day_index = COALESCE(?, day_index),
          meal_type = COALESCE(?, meal_type),
          recipe_id = COALESCE(?, recipe_id),
          servings = COALESCE(?, servings)
      WHERE id = ?
    `).run(day_index, meal_type, recipe_id, servings, itemId);

    const updatedItem = db.prepare(`
      SELECT mpi.*, r.name as recipe_name, r.category as recipe_category
      FROM meal_plan_items mpi
      JOIN recipes r ON mpi.recipe_id = r.id
      WHERE mpi.id = ?
    `).get(itemId);

    const itemWithNutrition = {
      ...updatedItem,
      nutrition: calculateRecipeNutrition(updatedItem.recipe_id, updatedItem.servings)
    };

    res.json({ success: true, data: itemWithNutrition });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

router.delete('/:id/items/:itemId', (req, res) => {
  try {
    const { id, itemId } = req.params;

    const plan = db.prepare('SELECT * FROM meal_plans WHERE id = ?').get(id);
    if (!plan) {
      return res.json({ success: false, error: '计划不存在' });
    }

    const item = db.prepare('SELECT * FROM meal_plan_items WHERE id = ? AND meal_plan_id = ?').get(itemId, id);
    if (!item) {
      return res.json({ success: false, error: '餐项不存在' });
    }

    db.prepare('DELETE FROM meal_plan_items WHERE id = ?').run(itemId);
    res.json({ success: true, data: { message: '删除成功' } });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;

    const plan = db.prepare('SELECT * FROM meal_plans WHERE id = ?').get(id);
    if (!plan) {
      return res.json({ success: false, error: '计划不存在' });
    }

    db.prepare('DELETE FROM meal_plans WHERE id = ?').run(id);
    res.json({ success: true, data: { message: '删除成功' } });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

module.exports = router;
