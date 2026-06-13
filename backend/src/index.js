import './config/env.js';
import app from './app.js';
import connectDB from './config/db.js';
import { validateAnthropicConfig } from './services/anthropic.service.js';
import { seedDermatologistsIfEmpty } from './seed/dermatologist.seed.js';
import { logError } from './utils/logger.js';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  validateAnthropicConfig();
  await connectDB();
  await seedDermatologistsIfEmpty();

  app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
  });
};

startServer().catch((error) => {
  logError(`Server failed to start: ${error.message}`);
  process.exit(1);
});
