import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes";
import apiRoutes from "./routes/api.routes";
import { errorHandler } from "./middleware/errorHandler";
import { createServer } from "http";
import { initServerSocket } from "./sockets";

dotenv.config();

const app = express();
const server = createServer(app);
const port = process.env.PORT || 3001;

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

initServerSocket(server);
server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

export default app;