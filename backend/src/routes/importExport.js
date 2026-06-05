const express = require('express');
const db = require('../db');

const router = express.Router();

function exportAllData(userId = 1) {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) return null;

  const recipes = db.prepare(`
    SELECT * FROM recipes WHERE author_id = ?
  `).all(userId);

  const recipesWithDetails = recipes.map(recipe => {
    const steps = db.prepare(`
      SELECT * FROM recipe_steps WHERE recipe_id = ? ORDER BY step_order
    `).all(recipe.id);

    const stepsWithIngredients = steps.map(step => ({
      ...step,
      ingredients: db.prepare(`
        SELECT ri.ingredient_id, ri.amount, i.name as ingredient_name
        FROM recipe_ingredients ri
        JOIN ingredients i ON ri.ingredient_id = i.id
        WHERE ri.recipe_step_id = ?
      `).all(step.id)
    }));

    return {
      ...recipe,
      steps: stepsWithIngredients
    };
  });

  const favorites = db.prepare(`
    SELECT rf.*, r.name as recipe_name
    FROM recipe_favorites rf
    JOIN recipes r ON rf.recipe_id = r.id
    WHERE rf.user_id = ?
  `).all(userId);

  const diary = db.prepare(`
    SELECT * FROM food_diary WHERE user_id = ?
  `).all(userId);

  const diaryWithItems = diary.map(d => ({
    ...d,
    items: db.prepare(`
      SELECT fdi.*, r.name as recipe_name, i.name as ingredient_name
      FROM food_diary_items fdi
      LEFT JOIN recipes r ON fdi.recipe_id = r.id
      LEFT JOIN ingredients i ON fdi.ingredient_id = i.id
      WHERE fdi.diary_id = ?
    `).all(d.id)
  }));

  const customIngredients = db.prepare(`
    SELECT * FROM ingredients WHERE is_custom = 1
  `).all();

  return {
    export_version: '1.0',
    exported_at: new Date().toISOString(),
    user: {
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      height: user.height,
      weight: user.weight,
      age: user.age,
      gender: user.gender,
      activity_level: user.activity_level,
      bmr: user.bmr,
      tdee: user.tdee
    },
    recipes: recipesWithDetails,
    favorites: favorites.map(f => ({
      recipe_id: f.recipe_id,
      recipe_name: f.recipe_name,
      created_at: f.created_at
    })),
    diary: diaryWithItems,
    custom_ingredients: customIngredients
  };
}

function exportSingleRecipe(recipeId) {
  const recipe = db.prepare('SELECT * FROM recipes WHERE id = ?').get(recipeId);
  if (!recipe) return null;

  const steps = db.prepare(`
    SELECT * FROM recipe_steps WHERE recipe_id = ? ORDER BY step_order
  `).all(recipeId);

  const stepsWithIngredients = steps.map(step => ({
    step_order: step.step_order,
    description: step.description,
    ingredients: db.prepare(`
      SELECT ri.amount, i.name as ingredient_name, i.category
      FROM recipe_ingredients ri
      JOIN ingredients i ON ri.ingredient_id = i.id
      WHERE ri.recipe_step_id = ?
    `).all(step.id)
  }));

  const author = db.prepare('SELECT username, nickname FROM users WHERE id = ?').get(recipe.author_id);

  return {
    export_version: '1.0',
    export_type: 'single_recipe',
    exported_at: new Date().toISOString(),
    recipe: {
      name: recipe.name,
      category: recipe.category,
      servings: recipe.servings,
      cover_image: recipe.cover_image,
      description: recipe.description,
      author: author ? (author.nickname || author.username) : '未知',
      steps: stepsWithIngredients
    }
  };
}

function validateImportData(data) {
  const errors = [];

  if (!data || typeof data !== 'object') {
    errors.push('数据格式无效');
    return { valid: false, errors };
  }

  if (!data.export_version) {
    errors.push('缺少导出版本信息');
  }

  if (data.recipes && !Array.isArray(data.recipes)) {
    errors.push('recipes 必须是数组');
  }

  if (data.diary && !Array.isArray(data.diary)) {
    errors.push('diary 必须是数组');
  }

  if (data.favorites && !Array.isArray(data.favorites)) {
    errors.push('favorites 必须是数组');
  }

  if (data.custom_ingredients && !Array.isArray(data.custom_ingredients)) {
    errors.push('custom_ingredients 必须是数组');
  }

  return { valid: errors.length === 0, errors };
}

function mapIngredientIdByName(ingredientName) {
  if (!ingredientName) return null;

  const ingredient = db.prepare(`
    SELECT id FROM ingredients WHERE name LIKE ?
  `).get(ingredientName.trim());

  if (ingredient) {
    return ingredient.id;
  }

  return null;
}

function importAllData(data, userId = 1) {
  const validation = validateImportData(data);
  if (!validation.valid) {
    return { success: false, errors: validation.errors };
  }

  const result = {
    recipes_imported: 0,
    recipes_skipped: 0,
    diary_imported: 0,
    favorites_imported: 0,
    ingredients_imported: 0,
    errors: []
  };

  db.exec('BEGIN TRANSACTION');
  try {
    if (data.custom_ingredients && data.custom_ingredients.length > 0) {
      data.custom_ingredients.forEach(ing => {
        try {
          const existing = db.prepare('SELECT id FROM ingredients WHERE name = ?').get(ing.name);
          if (!existing) {
            db.prepare(`
              INSERT INTO ingredients (name, category, calories, protein, fat, carbs, fiber, sodium, is_custom)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
            `).run(
              ing.name,
              ing.category || '其他',
              ing.calories || 0,
              ing.protein || 0,
              ing.fat || 0,
              ing.carbs || 0,
              ing.fiber || 0,
              ing.sodium || 0
            );
            result.ingredients_imported++;
          }
        } catch (e) {
          result.errors.push(`食材 ${ing.name} 导入失败: ${e.message}`);
        }
      });
    }

    const recipeIdMap = {};
    if (data.recipes && data.recipes.length > 0) {
      data.recipes.forEach(recipe => {
        try {
          const existing = db.prepare('SELECT id FROM recipes WHERE name = ? AND author_id = ?').get(recipe.name, userId);
          if (existing) {
            result.recipes_skipped++;
            result.errors.push(`食谱 ${recipe.name} 已存在，已跳过`);
            return;
          }

          const recipeResult = db.prepare(`
            INSERT INTO recipes (name, category, servings, cover_image, description, author_id, is_public)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `).run(
            recipe.name,
            recipe.category || '其他',
            recipe.servings || 1,
            recipe.cover_image || null,
            recipe.description || null,
            userId,
            recipe.is_public || 0
          );

          const newRecipeId = recipeResult.lastInsertRowid;
          recipeIdMap[recipe.id] = newRecipeId;

          if (recipe.steps && recipe.steps.length > 0) {
            recipe.steps.forEach(step => {
              const stepResult = db.prepare(`
                INSERT INTO recipe_steps (recipe_id, step_order, description)
                VALUES (?, ?, ?)
              `).run(newRecipeId, step.step_order, step.description);

              const stepId = stepResult.lastInsertRowid;

              if (step.ingredients && step.ingredients.length > 0) {
                step.ingredients.forEach(ing => {
                  let ingredientId = ing.ingredient_id;
                  if (!ingredientId && ing.ingredient_name) {
                    ingredientId = mapIngredientIdByName(ing.ingredient_name);
                  }

                  if (ingredientId) {
                    db.prepare(`
                      INSERT INTO recipe_ingredients (recipe_step_id, ingredient_id, amount)
                      VALUES (?, ?, ?)
                    `).run(stepId, ingredientId, ing.amount);
                  }
                });
              }
            });
          }

          result.recipes_imported++;
        } catch (e) {
          result.errors.push(`食谱 ${recipe.name} 导入失败: ${e.message}`);
        }
      });
    }

    if (data.favorites && data.favorites.length > 0) {
      data.favorites.forEach(fav => {
        try {
          let recipeId = fav.recipe_id;
          if (recipeIdMap[recipeId]) {
            recipeId = recipeIdMap[recipeId];
          } else if (fav.recipe_name) {
            const recipe = db.prepare('SELECT id FROM recipes WHERE name = ? AND author_id = ?').get(fav.recipe_name, userId);
            if (recipe) {
              recipeId = recipe.id;
            } else {
              return;
            }
          }

          const existing = db.prepare('SELECT id FROM recipe_favorites WHERE recipe_id = ? AND user_id = ?').get(recipeId, userId);
          if (!existing) {
            db.prepare(`
              INSERT INTO recipe_favorites (recipe_id, user_id)
              VALUES (?, ?)
            `).run(recipeId, userId);
            result.favorites_imported++;
          }
        } catch (e) {
          result.errors.push(`收藏导入失败: ${e.message}`);
        }
      });
    }

    if (data.diary && data.diary.length > 0) {
      data.diary.forEach(d => {
        try {
          const existingDiary = db.prepare('SELECT id FROM food_diary WHERE user_id = ? AND log_date = ?').get(userId, d.log_date);
          let diaryId;
          if (existingDiary) {
            diaryId = existingDiary.id;
          } else {
            const diaryResult = db.prepare(`
              INSERT INTO food_diary (user_id, log_date)
              VALUES (?, ?)
            `).run(userId, d.log_date);
            diaryId = diaryResult.lastInsertRowid;
          }

          if (d.items && d.items.length > 0) {
            d.items.forEach(item => {
              try {
                let recipeId = item.recipe_id;
                if (recipeId && recipeIdMap[recipeId]) {
                  recipeId = recipeIdMap[recipeId];
                }

                let ingredientId = item.ingredient_id;
                if (!ingredientId && item.ingredient_name) {
                  ingredientId = mapIngredientIdByName(item.ingredient_name);
                }

                db.prepare(`
                  INSERT INTO food_diary_items 
                  (diary_id, meal_type, item_type, recipe_id, ingredient_id, ingredient_name, amount, servings,
                   calories, protein, fat, carbs, fiber, sodium)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `).run(
                  diaryId,
                  item.meal_type || 'breakfast',
                  item.item_type || 'recipe',
                  recipeId || null,
                  ingredientId || null,
                  item.ingredient_name || null,
                  item.amount || 0,
                  item.servings || 1,
                  item.calories || 0,
                  item.protein || 0,
                  item.fat || 0,
                  item.carbs || 0,
                  item.fiber || 0,
                  item.sodium || 0
                );

                result.diary_imported++;
              } catch (e) {
                result.errors.push(`日记条目导入失败: ${e.message}`);
              }
            });
          }
        } catch (e) {
          result.errors.push(`日记 ${d.log_date} 导入失败: ${e.message}`);
        }
      });
    }

    db.exec('COMMIT');
    return { success: true, data: result };
  } catch (err) {
    db.exec('ROLLBACK');
    return { success: false, errors: [err.message] };
  }
}

router.get('/export/all', (req, res) => {
  try {
    const userId = 1;
    const data = exportAllData(userId);

    if (!data) {
      return res.json({ success: false, error: '用户不存在' });
    }

    const filename = `nutrition-backup-${new Date().toISOString().split('T')[0]}.json`;

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(JSON.stringify(data, null, 2));
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

router.get('/export/recipe/:id', (req, res) => {
  try {
    const { id } = req.params;
    const data = exportSingleRecipe(id);

    if (!data) {
      return res.json({ success: false, error: '食谱不存在' });
    }

    const safeName = data.recipe.name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_');
    const filename = `recipe-${safeName}.json`;

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(JSON.stringify(data, null, 2));
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

router.post('/import/validate', (req, res) => {
  try {
    const { data } = req.body;

    if (!data) {
      return res.json({ success: false, error: '请提供导入数据' });
    }

    const validation = validateImportData(data);

    res.json({
      success: true,
      data: {
        valid: validation.valid,
        errors: validation.errors,
        preview: {
          recipes_count: data.recipes ? data.recipes.length : 0,
          diary_count: data.diary ? data.diary.length : 0,
          favorites_count: data.favorites ? data.favorites.length : 0,
          ingredients_count: data.custom_ingredients ? data.custom_ingredients.length : 0
        }
      }
    });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

router.post('/import/all', (req, res) => {
  try {
    const { data } = req.body;
    const userId = 1;

    if (!data) {
      return res.json({ success: false, error: '请提供导入数据' });
    }

    const result = importAllData(data, userId);
    res.json(result);
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

module.exports = router;
