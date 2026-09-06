import express from 'express';
import { apiRouter } from '../server/api';

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use('/api', apiRouter);

export default app;
