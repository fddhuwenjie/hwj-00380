const express = require('express');
const db = require('../db');

const router = express.Router();

function calculateRecipePrice(recipeId, servings) {
  const ingredients = db.prepare(`
    SELECT ri.amount, i.price_per_500g
    FROM recipe_ingredients ri
    JOIN ingredients i ON ri.ingredient_id = i.id
    JOIN recipe_steps rs ON ri.recipe_step_id = rs.id
    WHERE rs.recipe_id = ?
  `).all(recipeId);

  let totalPrice = 0;
  ingredients.forEach(ing => {
    const pricePerGram = (ing.price_per_500g || 0) / 500;
    totalPrice += pricePerGram * ing.amount;
  });

  return {
    total_price: Math.round(totalPrice * 100) / 100,
    per_serving_price: servings > 0 ? Math.round((totalPrice / servings) * 100) / 100 : 0
  };
}

router.get('/ingredient/:ingredientId', (req, res) => {
  try {
    const { ingredientId } = req.params;
    const { period = 'week' } = req.query;

    const ingredient = db.prepare('SELECT * FROM ingredients WHERE id = ?').get(ingredientId);
    if (!ingredient) {
      return res.json({ success: false, error: '食材不存在' });
    }

    let dateLimit;
    if (period === 'month') {
      dateLimit = new Date();
      dateLimit.setMonth(dateLimit.getMonth() - 1);
    } else if (period === '3months') {
      dateLimit = new Date();
      dateLimit.setMonth(dateLimit.getMonth() - 3);
    } else {
      dateLimit = new Date();
      dateLimit.setDate(dateLimit.getDate() - 7);
    }

    const dateStr = dateLimit.toISOString().split('T')[0];

    const history = db.prepare(`
      SELECT * FROM ingredient_price_history
      WHERE ingredient_id = ? AND record_date >= ?
      ORDER BY record_date ASC
    `).all(ingredientId, dateStr);

    const weeklyData = {};
    history.forEach(item => {
      const date = item.record_date;
      const weekStart = getWeekStart(date);
      if (!weeklyData[weekStart]) {
        weeklyData[weekStart] = {
          dates: [],
          prices: [],
          avg_price: 0
        };
      }
      weeklyData[weekStart].dates.push(date);
      weeklyData[weekStart].prices.push(item.price_per_500g);
    });

    const weeklyAverage = Object.entries(weeklyData).map(([weekStart, data]) => {
      const avg = data.prices.reduce((a, b) => a + b, 0) / data.prices.length;
      return {
        week_start: weekStart,
        average_price: Math.round(avg * 100) / 100,
        record_count: data.prices.length,
        dates: data.dates,
        prices: data.prices
      };
    });

    const trend = history.length >= 2
      ? Math.round(((history[history.length - 1].price_per_500g - history[0].price_per_500g) / history[0].price_per_500g) * 10000) / 100
      : 0;

    res.json({
      success: true,
      data: {
        ingredient: {
          id: ingredient.id,
          name: ingredient.name,
          category: ingredient.category,
          current_price: ingredient.price_per_500g
        },
        history,
        weekly_average: weeklyAverage,
        trend_percent: trend,
        period
      }
    });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

function getWeekStart(dateStr) {
  const date = new Date(dateStr);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date.setDate(diff));
  return monday.toISOString().split('T')[0];
}

router.post('/ingredient/:ingredientId', (req, res) => {
  try {
    const { ingredientId } = req.params;
    const { price_per_500g, record_date } = req.body;

    if (price_per_500g === undefined || price_per_500g === null) {
      return res.json({ success: false, error: '价格为必填项' });
    }

    const price = parseFloat(price_per_500g);
    if (isNaN(price) || price < 0) {
      return res.json({ success: false, error: '价格必须为非负数' });
    }

    const ingredient = db.prepare('SELECT * FROM ingredients WHERE id = ?').get(ingredientId);
    if (!ingredient) {
      return res.json({ success: false, error: '食材不存在' });
    }

    const recordDate = record_date || new Date().toISOString().split('T')[0];

    const existing = db.prepare(`
      SELECT id FROM ingredient_price_history 
      WHERE ingredient_id = ? AND record_date = ?
    `).get(ingredientId, recordDate);

    if (existing) {
      db.prepare(`
        UPDATE ingredient_price_history
        SET price_per_500g = ?
        WHERE id = ?
      `).run(price, existing.id);
    } else {
      db.prepare(`
        INSERT INTO ingredient_price_history (ingredient_id, price_per_500g, record_date)
        VALUES (?, ?, ?)
      `).run(ingredientId, price, recordDate);
    }

    db.prepare(`
      UPDATE ingredients
      SET price_per_500g = ?
      WHERE id = ?
    `).run(price, ingredientId);

    const updated = db.prepare('SELECT * FROM ingredients WHERE id = ?').get(ingredientId);

    res.json({
      success: true,
      data: {
        ingredient: updated,
        message: '价格记录已更新'
      }
    });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

router.get('/recipes/budget', (req, res) => {
  try {
    const { max_price, min_price = 0, category, sort_by = 'price', page = 1, page_size = 12 } = req.query;

    if (max_price === undefined) {
      return res.json({ success: false, error: '请提供最高预算' });
    }

    const maxPrice = parseFloat(max_price);
    const minPrice = parseFloat(min_price);

    const allRecipes = db.prepare('SELECT id, name, category, servings FROM recipes').all();

    const recipesWithPrice = allRecipes.map(recipe => {
      const priceInfo = calculateRecipePrice(recipe.id, recipe.servings);
      return {
        ...recipe,
        total_price: priceInfo.total_price,
        per_serving_price: priceInfo.per_serving_price
      };
    });

    let filtered = recipesWithPrice.filter(r => 
      r.total_price >= minPrice && r.total_price <= maxPrice && r.total_price > 0
    );

    if (category) {
      filtered = filtered.filter(r => r.category === category);
    }

    if (sort_by === 'price') {
      filtered.sort((a, b) => a.total_price - b.total_price);
    } else if (sort_by === 'rating') {
      filtered.sort((a, b) => b.avg_rating - a.avg_rating);
    } else if (sort_by === 'popular') {
      filtered.sort((a, b) => b.favorite_count - a.favorite_count);
    } else {
      filtered.sort((a, b) => a.total_price - b.total_price);
    }

    const recipeIds = filtered.map(r => r.id);
    if (recipeIds.length > 0) {
      const placeholders = recipeIds.map(() => '?').join(',');
      const stats = db.prepare(`
        SELECT r.id,
               COALESCE(AVG(rr.rating), 0) as avg_rating,
               COUNT(DISTINCT rf.id) as favorite_count
        FROM recipes r
        LEFT JOIN recipe_ratings rr ON r.id = rr.recipe_id
        LEFT JOIN recipe_favorites rf ON r.id = rf.recipe_id
        WHERE r.id IN (${placeholders})
        GROUP BY r.id
      `).all(...recipeIds);

      const statsMap = {};
      stats.forEach(s => {
        statsMap[s.id] = s;
      });

      filtered = filtered.map(r => ({
        ...r,
        avg_rating: statsMap[r.id] ? Math.round(statsMap[r.id].avg_rating * 10) / 10 : 0,
        favorite_count: statsMap[r.id] ? statsMap[r.id].favorite_count : 0
      }));
    }

    const total = filtered.length;
    const offset = (page - 1) * page_size;
    const paginated = filtered.slice(offset, offset + parseInt(page_size));

    res.json({
      success: true,
      data: {
        list: paginated,
        total,
        page: parseInt(page),
        page_size: parseInt(page_size),
        total_pages: Math.ceil(total / page_size),
        budget: {
          min: minPrice,
          max: maxPrice
        }
      }
    });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

router.get('/recipe/:recipeId/price', (req, res) => {
  try {
    const { recipeId } = req.params;

    const recipe = db.prepare('SELECT * FROM recipes WHERE id = ?').get(recipeId);
    if (!recipe) {
      return res.json({ success: false, error: '食谱不存在' });
    }

    const ingredients = db.prepare(`
      SELECT ri.amount, i.name, i.category, i.price_per_500g
      FROM recipe_ingredients ri
      JOIN ingredients i ON ri.ingredient_id = i.id
      JOIN recipe_steps rs ON ri.recipe_step_id = rs.id
      WHERE rs.recipe_id = ?
    `).all(recipeId);

    let totalPrice = 0;
    const ingredientPrices = ingredients.map(ing => {
      const pricePerGram = (ing.price_per_500g || 0) / 500;
      const itemPrice = pricePerGram * ing.amount;
      totalPrice += itemPrice;
      return {
        name: ing.name,
        category: ing.category,
        amount: ing.amount,
        unit: '克',
        price_per_500g: ing.price_per_500g,
        item_price: Math.round(itemPrice * 100) / 100
      };
    });

    const priceInfo = {
      total_price: Math.round(totalPrice * 100) / 100,
      per_serving_price: recipe.servings > 0 ? Math.round((totalPrice / recipe.servings) * 100) / 100 : 0,
      servings: recipe.servings,
      ingredient_prices: ingredientPrices
    };

    res.json({
      success: true,
      data: {
        recipe_id: recipeId,
        recipe_name: recipe.name,
        ...priceInfo
      }
    });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

module.exports = router;
module.exports.calculateRecipePrice = calculateRecipePrice;
