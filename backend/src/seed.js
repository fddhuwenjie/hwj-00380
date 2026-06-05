const db = require('./db');
const ingredients = require('./data/ingredients');
const recipes = require('./data/recipes');
const mealPlan = require('./data/mealPlan');

function seedDatabase() {
  const existingCount = db.prepare('SELECT COUNT(*) as count FROM ingredients').get().count;
  if (existingCount > 0) {
    console.log('数据库已有数据，跳过填充');
    return;
  }

  const insertIngredient = db.prepare(`
    INSERT INTO ingredients (name, category, calories, protein, fat, carbs, fiber, sodium, is_custom)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
  `);

  const ingredientMap = new Map();
  db.exec('BEGIN TRANSACTION');
  try {
    ingredients.forEach(ing => {
      const result = insertIngredient.run(
        ing.name, ing.category, ing.calories, ing.protein,
        ing.fat, ing.carbs, ing.fiber, ing.sodium
      );
      ingredientMap.set(ing.name, result.lastInsertRowid);
    });
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
  console.log(`已插入 ${ingredients.length} 种食材`);

  const insertRecipe = db.prepare(`
    INSERT INTO recipes (name, category, servings)
    VALUES (?, ?, ?)
  `);

  const insertStep = db.prepare(`
    INSERT INTO recipe_steps (recipe_id, step_order, description)
    VALUES (?, ?, ?)
  `);

  const insertRecipeIngredient = db.prepare(`
    INSERT INTO recipe_ingredients (recipe_step_id, ingredient_id, amount)
    VALUES (?, ?, ?)
  `);

  const recipeMap = new Map();

  db.exec('BEGIN TRANSACTION');
  try {
    recipes.forEach(recipe => {
      const recipeResult = insertRecipe.run(recipe.name, recipe.category, recipe.servings);
      const recipeId = recipeResult.lastInsertRowid;
      recipeMap.set(recipe.name, recipeId);

      recipe.steps.forEach(step => {
        const stepResult = insertStep.run(recipeId, step.step_order, step.description);
        const stepId = stepResult.lastInsertRowid;

        step.ingredients.forEach(ing => {
          const ingredientId = ingredientMap.get(ing.ingredient_name);
          if (ingredientId) {
            insertRecipeIngredient.run(stepId, ingredientId, ing.amount);
          }
        });
      });
    });
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
  console.log(`已插入 ${recipes.length} 个食谱`);

  const insertMealPlan = db.prepare(`
    INSERT INTO meal_plans (week_start_date)
    VALUES (?)
  `);

  const insertMealPlanItem = db.prepare(`
    INSERT INTO meal_plan_items (meal_plan_id, day_index, meal_type, recipe_id, servings)
    VALUES (?, ?, ?, ?, ?)
  `);

  db.exec('BEGIN TRANSACTION');
  try {
    const planResult = insertMealPlan.run(mealPlan.week_start_date);
    const planId = planResult.lastInsertRowid;

    mealPlan.items.forEach(item => {
      const recipeId = recipeMap.get(item.recipe_name);
      if (recipeId) {
        insertMealPlanItem.run(planId, item.day_index, item.meal_type, recipeId, item.servings);
      }
    });
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
  console.log('已插入一周示例饮食计划');

  console.log('数据库填充完成！');
}

module.exports = seedDatabase;
