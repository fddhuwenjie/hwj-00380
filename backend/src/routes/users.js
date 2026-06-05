const express = require('express');
const db = require('../db');

const router = express.Router();

const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  high: 1.725,
  very_high: 1.9
};

function calculateBMR(weight, height, age, gender) {
  if (gender === 'male') {
    return 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    return 10 * weight + 6.25 * height - 5 * age - 161;
  }
}

function calculateTDEE(bmr, activityLevel) {
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] || ACTIVITY_MULTIPLIERS.sedentary;
  return bmr * multiplier;
}

function calculateNutrientTargets(tdee) {
  const proteinGrams = Math.round((tdee * 0.3) / 4);
  const fatGrams = Math.round((tdee * 0.3) / 9);
  const carbsGrams = Math.round((tdee * 0.4) / 4);
  const fiberGrams = 25;
  const sodiumMg = 2000;

  return {
    calories: Math.round(tdee),
    protein: proteinGrams,
    fat: fatGrams,
    carbs: carbsGrams,
    carbohydrate: carbsGrams,
    fiber: fiberGrams,
    sodium: sodiumMg
  };
}

router.get('/current', (req, res) => {
  try {
    const user = db.prepare('SELECT * FROM users ORDER BY id LIMIT 1').get();
    
    if (!user) {
      return res.json({ success: false, error: '用户不存在' });
    }

    const nutrientTargets = calculateNutrientTargets(user.tdee);
    user.nutrientTargets = nutrientTargets;
    
    res.json({ success: true, data: user });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

router.get('/targets', (req, res) => {
  try {
    const user = db.prepare('SELECT * FROM users ORDER BY id LIMIT 1').get();
    
    if (!user) {
      return res.json({ 
        success: true, 
        data: {
          calories: 2000,
          protein: 60,
          fat: 65,
          carbs: 300,
          carbohydrate: 300,
          fiber: 25,
          sodium: 2000
        }
      });
    }

    const nutrientTargets = calculateNutrientTargets(user.tdee);
    res.json({ success: true, data: nutrientTargets });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

router.put('/profile', (req, res) => {
  try {
    const { username, height, weight, age, gender, activity_level } = req.body;

    if (!height || !weight || !age || !gender || !activity_level) {
      return res.json({ success: false, error: '身高、体重、年龄、性别、运动量为必填项' });
    }

    const validLevels = ['sedentary', 'light', 'moderate', 'high', 'very_high'];
    if (!validLevels.includes(activity_level)) {
      return res.json({ success: false, error: '运动量级别无效' });
    }

    const bmr = calculateBMR(weight, height, age, gender);
    const tdee = calculateTDEE(bmr, activity_level);
    const nutrientTargets = calculateNutrientTargets(tdee);

    let user = db.prepare('SELECT * FROM users ORDER BY id LIMIT 1').get();

    if (!user) {
      const result = db.prepare(`
        INSERT INTO users (username, height, weight, age, gender, activity_level, bmr, tdee)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        username || '用户',
        height,
        weight,
        age,
        gender,
        activity_level,
        bmr,
        tdee
      );
      user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
    } else {
      db.prepare(`
        UPDATE users
        SET username = COALESCE(?, username),
            height = ?,
            weight = ?,
            age = ?,
            gender = ?,
            activity_level = ?,
            bmr = ?,
            tdee = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        username || user.username,
        height,
        weight,
        age,
        gender,
        activity_level,
        bmr,
        tdee,
        user.id
      );
      user = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
    }

    user.nutrientTargets = nutrientTargets;
    res.json({ success: true, data: user });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

router.post('/calculate', (req, res) => {
  try {
    const { weight, height, age, gender, activity_level } = req.body;

    if (!weight || !height || !age || !gender) {
      return res.json({ success: false, error: '体重、身高、年龄、性别为必填项' });
    }

    const bmr = calculateBMR(weight, height, age, gender);
    const activity = activity_level || 'sedentary';
    const tdee = calculateTDEE(bmr, activity);
    const nutrientTargets = calculateNutrientTargets(tdee);

    res.json({
      success: true,
      data: {
        bmr: Math.round(bmr),
        tdee: Math.round(tdee),
        activity_level: activity,
        activity_multiplier: ACTIVITY_MULTIPLIERS[activity] || 1.2,
        nutrientTargets
      }
    });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

router.get('/activity-levels', (req, res) => {
  try {
    const levels = [
      { key: 'sedentary', label: '久坐', description: '几乎不运动，办公室工作' },
      { key: 'light', label: '轻度', description: '每周1-3天轻度运动' },
      { key: 'moderate', label: '中度', description: '每周3-5天中等强度运动' },
      { key: 'high', label: '高强度', description: '每周6-7天高强度运动' },
      { key: 'very_high', label: '极高强度', description: '每日高强度运动或体力劳动' }
    ];
    res.json({ success: true, data: levels });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

module.exports = router;
