const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const items = db.prepare(`
      SELECT sl.*, mp.week_start_date
      FROM shopping_list sl
      LEFT JOIN meal_plans mp ON sl.meal_plan_id = mp.id
      ORDER BY sl.meal_plan_id, sl.category, sl.ingredient_name
    `).all();

    const groupedByPlan = items.reduce((acc, item) => {
      const planId = item.meal_plan_id || 'manual';
      if (!acc[planId]) {
        acc[planId] = {
          meal_plan_id: item.meal_plan_id,
          week_start_date: item.week_start_date,
          items: [],
          grouped: {}
        };
      }
      acc[planId].items.push(item);
      
      if (!acc[planId].grouped[item.category]) {
        acc[planId].grouped[item.category] = [];
      }
      acc[planId].grouped[item.category].push(item);
      
      return acc;
    }, {});

    const result = Object.values(groupedByPlan);
    res.json({ success: true, data: result });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

router.get('/:planId', (req, res) => {
  try {
    const { planId } = req.params;

    const plan = db.prepare('SELECT * FROM meal_plans WHERE id = ?').get(planId);
    if (!plan) {
      return res.json({ success: false, error: '计划不存在' });
    }

    const ingredients = db.prepare(`
      SELECT i.id as ingredient_id, i.name as ingredient_name, i.category,
             SUM(ri.amount / r.servings * mpi.servings) as total_amount
      FROM meal_plan_items mpi
      JOIN recipes r ON mpi.recipe_id = r.id
      JOIN recipe_steps rs ON r.id = rs.recipe_id
      JOIN recipe_ingredients ri ON rs.id = ri.recipe_step_id
      JOIN ingredients i ON ri.ingredient_id = i.id
      WHERE mpi.meal_plan_id = ?
      GROUP BY i.id, i.name, i.category
      ORDER BY i.category, i.name
    `).all(planId);

    const existingManual = db.prepare(`
      SELECT * FROM shopping_list
      WHERE meal_plan_id = ? AND is_manual = 1
      ORDER BY created_at
    `).all(planId);

    db.prepare(`
      DELETE FROM shopping_list
      WHERE meal_plan_id = ? AND is_manual = 0
    `).run(planId);

    const insertItem = db.prepare(`
      INSERT INTO shopping_list (meal_plan_id, ingredient_id, ingredient_name, category, amount, unit, is_manual)
      VALUES (?, ?, ?, ?, ?, '克', 0)
    `);

    ingredients.forEach(ing => {
      insertItem.run(planId, ing.ingredient_id, ing.ingredient_name, ing.category, ing.total_amount);
    });

    const allItems = db.prepare(`
      SELECT * FROM shopping_list
      WHERE meal_plan_id = ?
      ORDER BY category, ingredient_name
    `).all(planId);

    const grouped = allItems.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {});

    res.json({ success: true, data: { items: allItems, grouped } });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

router.get('/export/:planId', (req, res) => {
  try {
    const { planId } = req.params;

    const plan = db.prepare('SELECT * FROM meal_plans WHERE id = ?').get(planId);
    if (!plan) {
      return res.json({ success: false, error: '计划不存在' });
    }

    const items = db.prepare(`
      SELECT * FROM shopping_list
      WHERE meal_plan_id = ?
      ORDER BY category, ingredient_name
    `).all(planId);

    let text = `购物清单 (${plan.week_start_date})\n`;
    text += '='.repeat(50) + '\n\n';

    const grouped = items.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {});

    Object.keys(grouped).forEach(category => {
      text += `【${category}】\n`;
      grouped[category].forEach(item => {
        const checked = item.is_checked ? '[✓]' : '[ ]';
        const manual = item.is_manual ? ' (手动)' : '';
        text += `${checked} ${item.ingredient_name}: ${item.amount}${item.unit}${manual}\n`;
      });
      text += '\n';
    });

    const checkedCount = items.filter(i => i.is_checked).length;
    text += `\n总计: ${items.length} 项，已完成 ${checkedCount} 项\n`;

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="shopping-list-${plan.week_start_date}.txt"`);
    res.send(text);
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { meal_plan_id, ingredient_name, category, amount, unit } = req.body;

    if (!ingredient_name || !amount) {
      return res.json({ success: false, error: '食材名称和数量为必填项' });
    }

    let ingredientId = null;
    if (ingredient_name) {
      const ingredient = db.prepare('SELECT id FROM ingredients WHERE name = ?').get(ingredient_name);
      if (ingredient) {
        ingredientId = ingredient.id;
      }
    }

    const result = db.prepare(`
      INSERT INTO shopping_list (meal_plan_id, ingredient_id, ingredient_name, category, amount, unit, is_manual)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `).run(
      meal_plan_id || null,
      ingredientId,
      ingredient_name,
      category || '其他',
      amount,
      unit || '克'
    );

    const item = db.prepare('SELECT * FROM shopping_list WHERE id = ?').get(result.lastInsertRowid);
    res.json({ success: true, data: item });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { ingredient_name, category, amount, unit, is_checked } = req.body;

    const item = db.prepare('SELECT * FROM shopping_list WHERE id = ?').get(id);
    if (!item) {
      return res.json({ success: false, error: '项目不存在' });
    }

    let ingredientId = item.ingredient_id;
    if (ingredient_name && ingredient_name !== item.ingredient_name) {
      const ingredient = db.prepare('SELECT id FROM ingredients WHERE name = ?').get(ingredient_name);
      if (ingredient) {
        ingredientId = ingredient.id;
      }
    }

    db.prepare(`
      UPDATE shopping_list
      SET ingredient_id = COALESCE(?, ingredient_id),
          ingredient_name = COALESCE(?, ingredient_name),
          category = COALESCE(?, category),
          amount = COALESCE(?, amount),
          unit = COALESCE(?, unit),
          is_checked = COALESCE(?, is_checked)
      WHERE id = ?
    `).run(
      ingredientId,
      ingredient_name,
      category,
      amount,
      unit,
      is_checked,
      id
    );

    const updated = db.prepare('SELECT * FROM shopping_list WHERE id = ?').get(id);
    res.json({ success: true, data: updated });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;

    const item = db.prepare('SELECT * FROM shopping_list WHERE id = ?').get(id);
    if (!item) {
      return res.json({ success: false, error: '项目不存在' });
    }

    db.prepare('DELETE FROM shopping_list WHERE id = ?').run(id);
    res.json({ success: true, data: { message: '删除成功' } });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

module.exports = router;
