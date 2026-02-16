import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

let io : SocketServer;

export const initServerSocket =(httpServer: HttpServer)=>{
    io = new SocketServer(httpServer, {
        cors: {
            origin: process.env.CLIENT_URL || "http://localhost:5173",
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    // middleware for connections
    io.use((socket: Socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if(!token){
                throw next(new Error("Authentication required"));
            }
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { userId: string };
            (socket as any).userId = decoded.userId;
            next();
        } catch (error) {
            next(new Error('Invalid token'));
        }
    });

    io.on('connection', (socket: Socket) => {
        const userId = (socket as any).userId;
        console.log(`User ${userId} connected via WebSocket`);

        // Join a board room
        socket.on('join-board', (boardId: string) => {
            socket.join(`board:${boardId}`);
            console.log(`User ${userId} joined board:${boardId}`);
        });

        // Leave a board room
        socket.on('leave-board', (boardId: string) => {
            socket.leave(`board:${boardId}`);
            console.log(`User ${userId} left board:${boardId}`);
        });

        socket.on('disconnect', () => {
            console.log(`User ${userId} disconnected`);
        });
    });

    return io;
}

export const emitBoardEvent = (boardId: string, event: string, data: any) => {
    if (io) {
        io.to(`board:${boardId}`).emit(event, data);
    }
};

export const getIO = (): SocketServer => io;