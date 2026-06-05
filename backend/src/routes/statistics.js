const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/trend', (req, res) => {
  try {
    const userId = 1;
    const { days = 7 } = req.query;
    const daysNum = parseInt(days) || 7;

    const today = new Date();
    const dates = [];
    for (let i = daysNum - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }

    const placeholders = dates.map(() => '?').join(',');
    const items = db.prepare(`
      SELECT fd.log_date, 
             COALESCE(SUM(fdi.calories), 0) as total_calories,
             COALESCE(SUM(fdi.protein), 0) as total_protein,
             COALESCE(SUM(fdi.fat), 0) as total_fat,
             COALESCE(SUM(fdi.carbs), 0) as total_carbs
      FROM food_diary fd
      LEFT JOIN food_diary_items fdi ON fd.id = fdi.diary_id
      WHERE fd.user_id = ? AND fd.log_date IN (${placeholders})
      GROUP BY fd.log_date
      ORDER BY fd.log_date ASC
    `).all(userId, ...dates);

    const dataMap = {};
    items.forEach(item => {
      dataMap[item.log_date] = {
        calories: Math.round(item.total_calories),
        protein: Math.round(item.total_protein),
        fat: Math.round(item.total_fat),
        carbs: Math.round(item.total_carbs)
      };
    });

    const result = dates.map(date => ({
      date,
      calories: dataMap[date]?.calories || 0,
      protein: dataMap[date]?.protein || 0,
      fat: dataMap[date]?.fat || 0,
      carbs: dataMap[date]?.carbs || 0
    }));

    const user = db.prepare('SELECT tdee FROM users ORDER BY id LIMIT 1').get();
    const tdee = user ? user.tdee : 2000;
    const targets = {
      calories: tdee,
      protein: Math.round((tdee * 0.3) / 4),
      fat: Math.round((tdee * 0.3) / 9),
      carbs: Math.round((tdee * 0.4) / 4)
    };

    res.json({
      success: true,
      data: {
        days: daysNum,
        dates,
        trend: result,
        targets
      }
    });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

router.get('/macro-ratio', (req, res) => {
  try {
    const userId = 1;
    const { period = 'week' } = req.query;

    let days = 7;
    if (period === 'month') {
      days = 30;
    }

    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - days + 1);
    const startDateStr = startDate.toISOString().split('T')[0];

    const totals = db.prepare(`
      SELECT 
        COALESCE(SUM(fdi.protein), 0) as total_protein,
        COALESCE(SUM(fdi.fat), 0) as total_fat,
        COALESCE(SUM(fdi.carbs), 0) as total_carbs
      FROM food_diary fd
      LEFT JOIN food_diary_items fdi ON fd.id = fdi.diary_id
      WHERE fd.user_id = ? AND fd.log_date >= ?
    `).get(userId, startDateStr);

    const proteinCalories = totals.total_protein * 4;
    const fatCalories = totals.total_fat * 9;
    const carbsCalories = totals.total_carbs * 4;
    const totalMacroCalories = proteinCalories + fatCalories + carbsCalories;

    const actualRatio = {
      protein: totalMacroCalories > 0 ? Math.round((proteinCalories / totalMacroCalories) * 100) : 0,
      fat: totalMacroCalories > 0 ? Math.round((fatCalories / totalMacroCalories) * 100) : 0,
      carbs: totalMacroCalories > 0 ? Math.round((carbsCalories / totalMacroCalories) * 100) : 0
    };

    const recommendedRatio = {
      protein: 40,
      fat: 30,
      carbs: 30
    };

    res.json({
      success: true,
      data: {
        period,
        days,
        actual: {
          protein: { grams: Math.round(totals.total_protein), calories: Math.round(proteinCalories), percentage: actualRatio.protein },
          fat: { grams: Math.round(totals.total_fat), calories: Math.round(fatCalories), percentage: actualRatio.fat },
          carbs: { grams: Math.round(totals.total_carbs), calories: Math.round(carbsCalories), percentage: actualRatio.carbs }
        },
        recommended: recommendedRatio
      }
    });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

router.get('/summary', (req, res) => {
  try {
    const userId = 1;
    const { period = 'week' } = req.query;

    let days = 7;
    if (period === 'month') {
      days = 30;
    }

    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - days + 1);
    const startDateStr = startDate.toISOString().split('T')[0];

    const data = db.prepare(`
      SELECT 
        COUNT(DISTINCT fd.log_date) as active_days,
        COUNT(fdi.id) as total_items,
        COALESCE(AVG(daily_calories), 0) as avg_calories,
        COALESCE(AVG(daily_protein), 0) as avg_protein,
        COALESCE(AVG(daily_fat), 0) as avg_fat,
        COALESCE(AVG(daily_carbs), 0) as avg_carbs,
        COALESCE(SUM(fdi.calories), 0) as total_calories
      FROM food_diary fd
      LEFT JOIN food_diary_items fdi ON fd.id = fdi.diary_id
      LEFT JOIN (
        SELECT diary_id, 
               SUM(calories) as daily_calories,
               SUM(protein) as daily_protein,
               SUM(fat) as daily_fat,
               SUM(carbs) as daily_carbs
        FROM food_diary_items
        GROUP BY diary_id
      ) daily ON fd.id = daily.diary_id
      WHERE fd.user_id = ? AND fd.log_date >= ?
    `).get(userId, startDateStr);

    const user = db.prepare('SELECT tdee FROM users ORDER BY id LIMIT 1').get();
    const tdee = user ? user.tdee : 2000;

    const avgCalories = data.avg_calories || 0;
    const diffFromTarget = Math.round(avgCalories - tdee);
    const diffPercent = tdee > 0 ? Math.round((diffFromTarget / tdee) * 100) : 0;

    res.json({
      success: true,
      data: {
        period,
        days,
        active_days: data.active_days || 0,
        total_items: data.total_items || 0,
        total_calories: Math.round(data.total_calories || 0),
        average: {
          calories: Math.round(data.avg_calories || 0),
          protein: Math.round(data.avg_protein || 0),
          fat: Math.round(data.avg_fat || 0),
          carbs: Math.round(data.avg_carbs || 0)
        },
        target_comparison: {
          target_calories: tdee,
          diff_from_target: diffFromTarget,
          diff_percent: diffPercent
        }
      }
    });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

module.exports = router;
