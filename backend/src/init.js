const db = require('./db');
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS ingredients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      calories REAL NOT NULL DEFAULT 0,
      protein REAL NOT NULL DEFAULT 0,
      fat REAL NOT NULL DEFAULT 0,
      carbs REAL NOT NULL DEFAULT 0,
      fiber REAL NOT NULL DEFAULT 0,
      sodium REAL NOT NULL DEFAULT 0,
      is_custom INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS recipes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      servings INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS recipe_steps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recipe_id INTEGER NOT NULL,
      step_order INTEGER NOT NULL,
      description TEXT NOT NULL,
      FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS recipe_ingredients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recipe_step_id INTEGER NOT NULL,
      ingredient_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      FOREIGN KEY (recipe_step_id) REFERENCES recipe_steps(id) ON DELETE CASCADE,
      FOREIGN KEY (ingredient_id) REFERENCES ingredients(id)
    );

    CREATE TABLE IF NOT EXISTS meal_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      week_start_date TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS meal_plan_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      meal_plan_id INTEGER NOT NULL,
      day_index INTEGER NOT NULL,
      meal_type TEXT NOT NULL,
      recipe_id INTEGER NOT NULL,
      servings REAL NOT NULL DEFAULT 1,
      FOREIGN KEY (meal_plan_id) REFERENCES meal_plans(id) ON DELETE CASCADE,
      FOREIGN KEY (recipe_id) REFERENCES recipes(id)
    );

    CREATE TABLE IF NOT EXISTS shopping_list (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      meal_plan_id INTEGER,
      ingredient_id INTEGER,
      ingredient_name TEXT NOT NULL,
      category TEXT,
      amount REAL NOT NULL,
      unit TEXT NOT NULL DEFAULT '克',
      is_checked INTEGER NOT NULL DEFAULT 0,
      is_manual INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (meal_plan_id) REFERENCES meal_plans(id) ON DELETE CASCADE,
      FOREIGN KEY (ingredient_id) REFERENCES ingredients(id)
    );

    CREATE TABLE IF NOT EXISTS health_goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      calories REAL NOT NULL DEFAULT 2000,
      protein REAL NOT NULL DEFAULT 60,
      fat REAL NOT NULL DEFAULT 65,
      carbs REAL NOT NULL DEFAULT 300,
      fiber REAL NOT NULL DEFAULT 25,
      sodium REAL NOT NULL DEFAULT 2000,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      height REAL NOT NULL DEFAULT 0,
      weight REAL NOT NULL DEFAULT 0,
      age INTEGER NOT NULL DEFAULT 0,
      gender TEXT NOT NULL DEFAULT 'male',
      activity_level TEXT NOT NULL DEFAULT 'sedentary',
      bmr REAL NOT NULL DEFAULT 0,
      tdee REAL NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS recipe_ratings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recipe_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL DEFAULT 1,
      rating INTEGER NOT NULL DEFAULT 0,
      comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(recipe_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS recipe_favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recipe_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(recipe_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS food_diary (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL DEFAULT 1,
      log_date TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, log_date)
    );

    CREATE TABLE IF NOT EXISTS food_diary_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      diary_id INTEGER NOT NULL,
      meal_type TEXT NOT NULL DEFAULT 'breakfast',
      item_type TEXT NOT NULL DEFAULT 'recipe',
      recipe_id INTEGER,
      ingredient_id INTEGER,
      ingredient_name TEXT,
      amount REAL NOT NULL DEFAULT 0,
      servings REAL NOT NULL DEFAULT 1,
      calories REAL NOT NULL DEFAULT 0,
      protein REAL NOT NULL DEFAULT 0,
      fat REAL NOT NULL DEFAULT 0,
      carbs REAL NOT NULL DEFAULT 0,
      fiber REAL NOT NULL DEFAULT 0,
      sodium REAL NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (diary_id) REFERENCES food_diary(id) ON DELETE CASCADE,
      FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE SET NULL,
      FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_ingredients_category ON ingredients(category);
    CREATE INDEX IF NOT EXISTS idx_ingredients_name ON ingredients(name);
    CREATE INDEX IF NOT EXISTS idx_recipes_category ON recipes(category);
    CREATE INDEX IF NOT EXISTS idx_meal_plan_items_plan ON meal_plan_items(meal_plan_id);
    CREATE INDEX IF NOT EXISTS idx_recipe_ratings_recipe ON recipe_ratings(recipe_id);
    CREATE INDEX IF NOT EXISTS idx_recipe_favorites_user ON recipe_favorites(user_id);
    CREATE INDEX IF NOT EXISTS idx_food_diary_date ON food_diary(log_date);
    CREATE INDEX IF NOT EXISTS idx_food_diary_items_diary ON food_diary_items(diary_id);
  `);

  const goalsCheck = db.prepare('SELECT COUNT(*) as count FROM health_goals').get();
  if (goalsCheck.count === 0) {
    db.prepare(`
      INSERT INTO health_goals (calories, protein, fat, carbs, fiber, sodium)
      VALUES (2000, 60, 65, 300, 25, 2000)
    `).run();
  }

  const userCheck = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (userCheck.count === 0) {
    const defaultBMR = 10 * 70 + 6.25 * 175 - 5 * 30 + 5;
    const defaultTDEE = defaultBMR * 1.375;
    db.prepare(`
      INSERT INTO users (username, height, weight, age, gender, activity_level, bmr, tdee)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run('默认用户', 175, 70, 30, 'male', 'moderate', defaultBMR, defaultTDEE);
  }

  console.log('数据库表结构初始化完成');
}

module.exports = initDatabase;
