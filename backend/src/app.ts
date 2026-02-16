import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes";
import apiRoutes from "./routes/api.routes";
import { errorHandler } from "./middleware/errorHandler";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
}));
app.use(express.json());

// health check
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// auth route
app.use('/api/auth', authRoutes);

// all api routes
app.use('/api', apiRoutes);

app.use(errorHandler);

export default app;
