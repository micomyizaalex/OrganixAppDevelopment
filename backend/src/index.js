import express from 'express';
import cors from 'cors';
import { serverConfig } from './config/server.js';
import { requestLogger, errorHandler } from './middlewares/logger.js';

// Import routes
import authRoutes from './routes/authRoutes.js';
import caseRoutes from './routes/caseRoutes.js';
import donorRoutes from './routes/donorRoutes.js';
import sponsorRoutes from './routes/sponsorRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

const app = express();

// ==================== MIDDLEWARE ====================

// CORS configuration
app.use(cors({
  origin: serverConfig.corsOrigin,
  credentials: true
}));

// Parse JSON request bodies
app.use(express.json());

// Request logging
app.use(requestLogger);

// ==================== HEALTH CHECK ====================

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: serverConfig.env
  });
});

// ==================== API ROUTES ====================

app.use('/auth', authRoutes);
app.use('/cases', caseRoutes);
app.use('/donor', donorRoutes);
app.use('/sponsor', sponsorRoutes);
app.use('/admin', adminRoutes);

// ==================== ERROR HANDLING ====================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path
  });
});

// Global error handler
app.use(errorHandler);

// ==================== START SERVER ====================

app.listen(serverConfig.port, () => {
  console.log(`🚀 Organix API Server running on http://localhost:${serverConfig.port}`);
  console.log(`📊 Health check: http://localhost:${serverConfig.port}/health`);
  console.log(`🌍 Environment: ${serverConfig.env}`);
});

export default app;
