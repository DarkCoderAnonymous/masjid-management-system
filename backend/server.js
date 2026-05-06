const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();

const app = express();

// Middleware
const allowedOrigins = [
  /^http:\/\/localhost(:\d+)?$/,
  /^https:\/\/masjid-management-system[a-z0-9-]*\.vercel\.app$/,
];

// Also allow explicitly configured FRONTEND_URL from env
const frontendUrl = process.env.FRONTEND_URL;

function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (frontendUrl && origin === frontendUrl) return true;
  return allowedOrigins.some((pattern) => pattern.test(origin));
}

const corsOptions = {
  origin: function (origin, callback) {
    console.log('CORS origin:', origin, '| allowed:', isAllowedOrigin(origin));
    callback(null, isAllowedOrigin(origin));
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logger + DB connection per request (serverless-safe)
app.use(async (req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} — origin: ${req.headers.origin || 'none'}`);
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error('DB connection failed:', error.message);
    res.status(500).json({ success: false, message: 'Database connection failed' });
  }
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admins', require('./routes/admins'));
app.use('/api/users', require('./routes/users'));
app.use('/api/donations', require('./routes/donations'));
app.use('/api/expenses', require('./routes/expenses'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Masjid Management API is running', timestamp: new Date() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack);
  res.status(500).json({ success: false, message: 'Internal Server Error' });
});

module.exports = app;

const PORT = process.env.PORT || 5000;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n🕌 Masjid Management Backend`);
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`📋 Environment: ${process.env.NODE_ENV || 'development'}\n`);
  });
}
