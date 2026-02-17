import express from 'express';
import { authMiddleware } from './auth';
import { registerRoutes } from './routes';

const app = express();
const PORT = process.env.PORT || 3000;

// Parse JSON request bodies
app.use(express.json());

// Apply authentication middleware
app.use(authMiddleware);

// Register all application routes
registerRoutes(app);

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
