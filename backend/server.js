const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const initDatabase = require('./src/init');
const seedDatabase = require('./src/seed');

const ingredientsRouter = require('./src/routes/ingredients');
const recipesRouter = require('./src/routes/recipes');
const mealPlansRouter = require('./src/routes/mealPlans');
const shoppingListRouter = require('./src/routes/shoppingList');
const searchRouter = require('./src/routes/search');
const goalsRouter = require('./src/routes/goals');
const usersRouter = require('./src/routes/users');
const ratingsRouter = require('./src/routes/ratings');
const favoritesRouter = require('./src/routes/favorites');
const replacementsRouter = require('./src/routes/replacements');
const diaryRouter = require('./src/routes/diary');
const statisticsRouter = require('./src/routes/statistics');
const communityRouter = require('./src/routes/community');
const suggestionsRouter = require('./src/routes/suggestions');
const recipeVersionsRouter = require('./src/routes/recipeVersions');
const priceHistoryRouter = require('./src/routes/priceHistory');
const importExportRouter = require('./src/routes/importExport');

const app = express();
const PORT = 8380;

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

initDatabase();
seedDatabase();

app.get('/api/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok', message: '食谱管理与营养计算系统 API 服务正常' } });
});

app.use('/api/ingredients', ingredientsRouter);
app.use('/api/recipes', recipesRouter);
app.use('/api/meal-plans', mealPlansRouter);
app.use('/api/shopping-list', shoppingListRouter);
app.use('/api/search', searchRouter);
app.use('/api/goals', goalsRouter);
app.use('/api/users', usersRouter);
app.use('/api/ratings', ratingsRouter);
app.use('/api/favorites', favoritesRouter);
app.use('/api/replacements', replacementsRouter);
app.use('/api/diary', diaryRouter);
app.use('/api/statistics', statisticsRouter);
app.use('/api/community', communityRouter);
app.use('/api/suggestions', suggestionsRouter);
app.use('/api/recipe-versions', recipeVersionsRouter);
app.use('/api/price-history', priceHistoryRouter);
app.use('/api/import-export', importExportRouter);

app.use((req, res) => {
  res.status(404).json({ success: false, error: '接口不存在' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: '服务器内部错误' });
});

app.listen(PORT, () => {
  console.log(`🚀 服务器已启动在端口 ${PORT}`);
  console.log(`📦 API 基础地址: http://localhost:${PORT}/api`);
  console.log(`🍳 食材库: http://localhost:${PORT}/api/ingredients`);
  console.log(`📖 食谱库: http://localhost:${PORT}/api/recipes`);
  console.log(`📅 饮食计划: http://localhost:${PORT}/api/meal-plans`);
});
