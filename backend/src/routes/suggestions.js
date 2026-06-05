const express = require('express');
const db = require('../db');

const router = express.Router();

const nutrientSuggestions = {
  protein: {
    name: '蛋白质',
    unit: '克',
    low: {
      message: '蛋白质摄入偏低，建议增加鸡胸肉、鱼类、豆类或蛋类食物',
      foods: ['鸡胸肉', '三文鱼', '鸡蛋', '豆腐', '牛肉', '虾']
    },
    high: {
      message: '蛋白质摄入偏高，建议减少肉类摄入，增加蔬菜和全谷物',
      foods: ['西兰花', '菠菜', '燕麦', '糙米', '红薯']
    }
  },
  fat: {
    name: '脂肪',
    unit: '克',
    low: {
      message: '脂肪摄入偏低，建议增加坚果、牛油果、橄榄油等健康脂肪',
      foods: ['杏仁', '核桃', '牛油果', '橄榄油', '三文鱼']
    },
    high: {
      message: '脂肪摄入偏高，建议减少油炸食品和肥肉，选择 lean protein',
      foods: ['鸡胸肉', '鳕鱼', '蔬菜沙拉', '水果', '燕麦']
    }
  },
  carbs: {
    name: '碳水化合物',
    unit: '克',
    low: {
      message: '碳水化合物摄入偏低，建议增加全谷物、水果和根茎类蔬菜',
      foods: ['燕麦', '糙米', '红薯', '香蕉', '全麦面包']
    },
    high: {
      message: '碳水化合物摄入偏高，建议减少精制糖和白米面，选择低GI食物',
      foods: ['藜麦', '荞麦', '蔬菜', '鸡胸肉', '鱼类']
    }
  },
  fiber: {
    name: '膳食纤维',
    unit: '克',
    low: {
      message: '膳食纤维摄入偏低，建议增加蔬菜、水果、全谷物和豆类',
      foods: ['芹菜', '西兰花', '苹果', '燕麦', '黑豆', '梨']
    },
    high: {
      message: '膳食纤维摄入偏高，注意适量饮水，适当减少粗粮摄入',
      foods: ['白米饭', '面条', '鸡胸肉', '鸡蛋', '牛奶']
    }
  },
  sodium: {
    name: '钠',
    unit: '毫克',
    low: {
      message: '钠摄入偏低，可适当增加盐的摄入或食用含钠丰富的食物',
      foods: ['海带', '紫菜', '虾', '芹菜']
    },
    high: {
      message: '钠摄入偏高，建议减少盐和加工食品，选择新鲜食材',
      foods: ['新鲜蔬菜', '水果', '鸡胸肉', '鱼类', '豆类']
    }
  },
  calories: {
    name: '热量',
    unit: '千卡',
    low: {
      message: '热量摄入偏低，建议增加食物摄入量，保证充足能量供应',
      foods: ['坚果', '牛油果', '全脂牛奶', '香蕉', '花生酱']
    },
    high: {
      message: '热量摄入偏高，建议控制食物分量，增加低热量蔬菜摄入',
      foods: ['黄瓜', '西红柿', '鸡胸肉', '西兰花', '芹菜']
    }
  }
};

function calculate7DaysIntake(userId) {
  const today = new Date();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 6);
  const startDate = sevenDaysAgo.toISOString().split('T')[0];
  const endDate = today.toISOString().split('T')[0];

  const history = db.prepare(`
    SELECT fd.*, 
           COALESCE(SUM(fdi.calories), 0) as total_calories,
           COALESCE(SUM(fdi.protein), 0) as total_protein,
           COALESCE(SUM(fdi.fat), 0) as total_fat,
           COALESCE(SUM(fdi.carbs), 0) as total_carbs,
           COALESCE(SUM(fdi.fiber), 0) as total_fiber,
           COALESCE(SUM(fdi.sodium), 0) as total_sodium,
           COUNT(fdi.id) as item_count
    FROM food_diary fd
    LEFT JOIN food_diary_items fdi ON fd.id = fdi.diary_id
    WHERE fd.user_id = ? AND fd.log_date >= ? AND fd.log_date <= ?
    GROUP BY fd.id
    ORDER BY fd.log_date ASC
  `).all(userId, startDate, endDate);

  if (history.length === 0) {
    return null;
  }

  const avgIntake = {
    calories: 0,
    protein: 0,
    fat: 0,
    carbs: 0,
    fiber: 0,
    sodium: 0
  };

  history.forEach(day => {
    avgIntake.calories += day.total_calories;
    avgIntake.protein += day.total_protein;
    avgIntake.fat += day.total_fat;
    avgIntake.carbs += day.total_carbs;
    avgIntake.fiber += day.total_fiber;
    avgIntake.sodium += day.total_sodium;
  });

  const days = history.length;
  Object.keys(avgIntake).forEach(key => {
    avgIntake[key] = Math.round((avgIntake[key] / days) * 10) / 10;
  });

  return {
    average: avgIntake,
    daily_data: history,
    days_count: days,
    start_date: startDate,
    end_date: endDate
  };
}

function calculateNutrientGaps(avgIntake, targets) {
  const gaps = [];

  Object.keys(targets).forEach(nutrient => {
    if (avgIntake[nutrient] === undefined) return;

    const actual = avgIntake[nutrient];
    const target = targets[nutrient];
    const ratio = actual / target;
    const deficit = target - actual;
    const percent = Math.round(ratio * 100);

    let status = 'normal';
    if (ratio < 0.85) status = 'deficit';
    else if (ratio > 1.15) status = 'excess';

    const suggestion = nutrientSuggestions[nutrient];
    if (suggestion) {
      gaps.push({
        nutrient,
        name: suggestion.name,
        unit: suggestion.unit,
        actual,
        target,
        deficit: Math.round(deficit * 10) / 10,
        percent,
        status,
        message: status === 'deficit' ? suggestion.low.message : 
                 status === 'excess' ? suggestion.high.message : null,
        recommended_foods: status === 'deficit' ? suggestion.low.foods :
                           status === 'excess' ? suggestion.high.foods : []
      });
    }
  });

  return gaps;
}

function findRecommendedRecipes(gaps, limit = 3) {
  const deficitNutrients = gaps.filter(g => g.status === 'deficit').map(g => g.nutrient);
  if (deficitNutrients.length === 0) {
    deficitNutrients.push('protein', 'fiber');
  }

  const priorityNutrient = deficitNutrients[0];

  const recipes = db.prepare(`
    SELECT r.*, 
           COALESCE(AVG(rr.rating), 0) as avg_rating,
           COUNT(DISTINCT rf.id) as favorite_count
    FROM recipes r
    LEFT JOIN recipe_ratings rr ON r.id = rr.recipe_id
    LEFT JOIN recipe_favorites rf ON r.id = rf.recipe_id
    WHERE r.is_public = 1
    GROUP BY r.id
    ORDER BY avg_rating DESC, favorite_count DESC
    LIMIT 20
  `).all();

  const scoredRecipes = recipes.map(recipe => {
    const ingredients = db.prepare(`
      SELECT ri.amount, i.${priorityNutrient}
      FROM recipe_ingredients ri
      JOIN ingredients i ON ri.ingredient_id = i.id
      JOIN recipe_steps rs ON ri.recipe_step_id = rs.id
      WHERE rs.recipe_id = ?
    `).all(recipe.id);

    let nutrientPerServing = 0;
    ingredients.forEach(ing => {
      const factor = ing.amount / 100;
      nutrientPerServing += (ing[priorityNutrient] || 0) * factor;
    });
    nutrientPerServing = nutrientPerServing / (recipe.servings || 1);

    const target = 2000;
    const score = (recipe.avg_rating * 10) + nutrientPerServing * 0.5;

    return {
      ...recipe,
      avg_rating: recipe.avg_rating ? Math.round(recipe.avg_rating * 10) / 10 : 0,
      nutrient_content: Math.round(nutrientPerServing * 10) / 10,
      score: Math.round(score * 10) / 10
    };
  });

  scoredRecipes.sort((a, b) => b.score - a.score);
  return scoredRecipes.slice(0, limit);
}

router.get('/daily', (req, res) => {
  try {
    const userId = 1;

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!user) {
      return res.json({ success: false, error: '用户不存在' });
    }

    const tdee = user.tdee || 2000;
    const targets = {
      calories: tdee,
      protein: Math.round((tdee * 0.3) / 4),
      fat: Math.round((tdee * 0.3) / 9),
      carbs: Math.round((tdee * 0.4) / 4),
      fiber: 25,
      sodium: 2000
    };

    const intakeData = calculate7DaysIntake(userId);

    if (!intakeData) {
      return res.json({
        success: true,
        data: {
          user,
          targets,
          has_data: false,
          message: '最近7天没有饮食记录，请先记录饮食日记以获取个性化建议'
        }
      });
    }

    const gaps = calculateNutrientGaps(intakeData.average, targets);
    const recommendations = findRecommendedRecipes(gaps, 3);

    const dailySuggestions = gaps
      .filter(g => g.status !== 'normal')
      .map(g => ({
        type: g.status === 'deficit' ? 'warning' : 'danger',
        nutrient: g.name,
        message: g.message,
        actual: g.actual,
        target: g.target,
        unit: g.unit,
        percent: g.percent
      }));

    res.json({
      success: true,
      data: {
        user,
        targets,
        has_data: true,
        intake_summary: intakeData,
        nutrient_gaps: gaps,
        daily_suggestions: dailySuggestions,
        recommended_recipes: recommendations,
        generated_at: new Date().toISOString()
      }
    });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

module.exports = router;
