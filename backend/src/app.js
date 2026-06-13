import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import routes from './routes/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const DEV_FRONTEND_URL = 'http://localhost:5173';
const DEV_ADMIN_URL = 'http://localhost:5174';
const isProduction = process.env.NODE_ENV === 'production';

const allowedOrigins = isProduction
  ? [process.env.FRONTEND_URL, process.env.ADMIN_URL].filter(Boolean)
  : [DEV_FRONTEND_URL, DEV_ADMIN_URL];

const isAllowedOrigin = (origin) => {
  if (!origin) {
    return true;
  }

  return allowedOrigins.includes(origin);
};

app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    environment: process.env.NODE_ENV || 'development',
  });
});

app.use('/api', routes);

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

export default app;
