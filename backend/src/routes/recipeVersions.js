const express = require('express');
const db = require('../db');

const router = express.Router();

function getRecipeSnapshot(recipeId) {
  const recipe = db.prepare('SELECT * FROM recipes WHERE id = ?').get(recipeId);
  if (!recipe) return null;

  const steps = db.prepare(`
    SELECT * FROM recipe_steps WHERE recipe_id = ? ORDER BY step_order
  `).all(recipeId);

  const stepsWithIngredients = steps.map(step => ({
    step_order: step.step_order,
    description: step.description,
    ingredients: db.prepare(`
      SELECT ri.ingredient_id, ri.amount
      FROM recipe_ingredients ri
      WHERE ri.recipe_step_id = ?
    `).all(step.id)
  }));

  return {
    name: recipe.name,
    category: recipe.category,
    servings: recipe.servings,
    cover_image: recipe.cover_image,
    description: recipe.description,
    steps: stepsWithIngredients
  };
}

function createVersionSnapshot(recipeId) {
  const recipe = db.prepare('SELECT * FROM recipes WHERE id = ?').get(recipeId);
  if (!recipe) return null;

  const snapshot = getRecipeSnapshot(recipeId);
  const snapshotData = JSON.stringify(snapshot);

  const maxVersion = db.prepare(`
    SELECT COALESCE(MAX(version_number), 0) as max_version
    FROM recipe_versions WHERE recipe_id = ?
  `).get(recipeId);

  const newVersion = maxVersion.max_version + 1;

  db.prepare(`
    INSERT INTO recipe_versions (recipe_id, version_number, name, category, servings, snapshot_data)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(recipeId, newVersion, recipe.name, recipe.category, recipe.servings, snapshotData);

  return newVersion;
}

router.get('/recipe/:recipeId', (req, res) => {
  try {
    const { recipeId } = req.params;

    const recipe = db.prepare('SELECT id FROM recipes WHERE id = ?').get(recipeId);
    if (!recipe) {
      return res.json({ success: false, error: '食谱不存在' });
    }

    const versions = db.prepare(`
      SELECT * FROM recipe_versions 
      WHERE recipe_id = ? 
      ORDER BY version_number DESC
    `).all(recipeId);

    const result = versions.map(v => ({
      ...v,
      snapshot_data: undefined,
      created_at: v.created_at
    }));

    res.json({ success: true, data: result });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

router.get('/:versionId', (req, res) => {
  try {
    const { versionId } = req.params;

    const version = db.prepare(`
      SELECT rv.*, r.name as current_name
      FROM recipe_versions rv
      JOIN recipes r ON rv.recipe_id = r.id
      WHERE rv.id = ?
    `).get(versionId);

    if (!version) {
      return res.json({ success: false, error: '版本不存在' });
    }

    let snapshotData;
    try {
      snapshotData = JSON.parse(version.snapshot_data);
    } catch (e) {
      snapshotData = null;
    }

    res.json({
      success: true,
      data: {
        ...version,
        snapshot_data: snapshotData
      }
    });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

router.post('/:versionId/rollback', (req, res) => {
  try {
    const { versionId } = req.params;
    const userId = 1;

    const version = db.prepare('SELECT * FROM recipe_versions WHERE id = ?').get(versionId);
    if (!version) {
      return res.json({ success: false, error: '版本不存在' });
    }

    let snapshotData;
    try {
      snapshotData = JSON.parse(version.snapshot_data);
    } catch (e) {
      return res.json({ success: false, error: '版本数据损坏' });
    }

    const recipeId = version.recipe_id;
    const recipe = db.prepare('SELECT * FROM recipes WHERE id = ?').get(recipeId);
    if (!recipe) {
      return res.json({ success: false, error: '食谱不存在' });
    }

    const currentSnapshot = getRecipeSnapshot(recipeId);
    const currentSnapshotData = JSON.stringify(currentSnapshot);

    db.exec('BEGIN TRANSACTION');
    try {
      const maxVersion = db.prepare(`
        SELECT COALESCE(MAX(version_number), 0) as max_version
        FROM recipe_versions WHERE recipe_id = ?
      `).get(recipeId);

      db.prepare(`
        INSERT INTO recipe_versions (recipe_id, version_number, name, category, servings, snapshot_data)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        recipeId,
        maxVersion.max_version + 1,
        recipe.name,
        recipe.category,
        recipe.servings,
        currentSnapshotData
      );

      db.prepare(`
        UPDATE recipes
        SET name = ?,
            category = ?,
            servings = ?,
            cover_image = ?,
            description = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        snapshotData.name,
        snapshotData.category,
        snapshotData.servings,
        snapshotData.cover_image || null,
        snapshotData.description || null,
        recipeId
      );

      db.prepare('DELETE FROM recipe_ingredients WHERE recipe_step_id IN (SELECT id FROM recipe_steps WHERE recipe_id = ?)').run(recipeId);
      db.prepare('DELETE FROM recipe_steps WHERE recipe_id = ?').run(recipeId);

      const insertStep = db.prepare(`
        INSERT INTO recipe_steps (recipe_id, step_order, description)
        VALUES (?, ?, ?)
      `);

      const insertIngredient = db.prepare(`
        INSERT INTO recipe_ingredients (recipe_step_id, ingredient_id, amount)
        VALUES (?, ?, ?)
      `);

      snapshotData.steps.forEach(step => {
        const stepResult = insertStep.run(recipeId, step.step_order, step.description);
        const stepId = stepResult.lastInsertRowid;

        if (step.ingredients && step.ingredients.length > 0) {
          step.ingredients.forEach(ing => {
            insertIngredient.run(stepId, ing.ingredient_id, ing.amount);
          });
        }
      });

      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }

    const updatedRecipe = db.prepare(`
      SELECT r.*, 
             COALESCE(AVG(rr.rating), 0) as avg_rating,
             CASE WHEN rf.id IS NOT NULL THEN 1 ELSE 0 END as is_favorite
      FROM recipes r
      LEFT JOIN recipe_ratings rr ON r.id = rr.recipe_id
      LEFT JOIN recipe_favorites rf ON r.id = rf.recipe_id AND rf.user_id = ?
      WHERE r.id = ?
      GROUP BY r.id
    `).get(userId, recipeId);

    res.json({
      success: true,
      data: {
        recipe: updatedRecipe,
        message: `已回滚到版本 ${version.version_number}`,
        rollback_from: version.version_number
      }
    });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

router.post('/recipe/:recipeId/snapshot', (req, res) => {
  try {
    const { recipeId } = req.params;

    const recipe = db.prepare('SELECT id FROM recipes WHERE id = ?').get(recipeId);
    if (!recipe) {
      return res.json({ success: false, error: '食谱不存在' });
    }

    const versionNumber = createVersionSnapshot(recipeId);

    res.json({
      success: true,
      data: {
        recipe_id: recipeId,
        version_number: versionNumber,
        message: '版本快照已创建'
      }
    });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

module.exports = router;
module.exports.createVersionSnapshot = createVersionSnapshot;
