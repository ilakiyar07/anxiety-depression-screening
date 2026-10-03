const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config();

const db = require('./config/database');
const { seedDatabase } = require('./services/seedService');

async function initializeDatabase() {
  await db.init();
  const questionCount = await db.get('SELECT COUNT(*) as count FROM questions');
  if (!questionCount || Number(questionCount.count) === 0) {
    await seedDatabase();
  }
}

const databaseReady = initializeDatabase().catch(err => {
  console.error('[Database Initialization Error]', err);
  throw err;
});

const app = express();
const PORT = process.env.PORT || 5000;

app.use(async (req, res, next) => {
  try {
    await databaseReady;
    next();
  } catch (err) {
    res.status(503).json({ error: 'Database initialization failed. Please try again later.' });
  }
});

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (process.env.NODE_ENV !== 'test') {
      console.log(`[HTTP] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/screenings', require('./routes/screeningRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/profile', require('./routes/profileRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    system: 'Anxiety and Depression Screening System API'
  });
});

const frontendDist = path.resolve(__dirname, '..', 'frontend', 'dist');
const indexHtmlPath = path.join(frontendDist, 'index.html');
app.use(express.static(frontendDist));

app.use('/api', (req, res) => {
  res.status(404).json({ error: `API endpoint ${req.originalUrl} not found.` });
});

app.use((req, res) => {
  if (fs.existsSync(indexHtmlPath)) return res.sendFile(indexHtmlPath);
  res.status(404).json({
    error: 'Frontend build not detected. Please run the frontend development server on http://localhost:5173'
  });
});

app.use((err, req, res, next) => {
  console.error('[Unhandled Server Error]', err);
  res.status(500).json({ error: 'An internal server error occurred. Please try again later.' });
});

if (process.env.NODE_ENV !== 'test') {
  databaseReady
    .then(() => {
      app.listen(PORT, () => {
        console.log('====================================================');
        console.log('  Anxiety & Depression Screening System Backend API ');
        console.log(`  Listening on port: ${PORT}`);
        console.log('====================================================');
      });
    })
    .catch(() => process.exit(1));
}

module.exports = app;
