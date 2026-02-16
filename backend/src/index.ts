import app from "./app";
import { createServer } from "http";
import { initServerSocket } from "./sockets";
import dotenv from "dotenv";

dotenv.config();

const server = createServer(app);
const port = process.env.PORT || 3001;

initServerSocket(server);

server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});