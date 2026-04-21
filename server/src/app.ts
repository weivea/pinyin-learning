import express, { Express } from 'express';
import cors from 'cors';
import type { DB } from './db/connection.js';
import { usersRouter } from './routes/users.js';

export interface AppDeps {
  db: DB;
}

export function createApp(deps?: AppDeps): Express {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  if (deps?.db) {
    app.use('/api/users', usersRouter(deps.db));
  }

  return app;
}
