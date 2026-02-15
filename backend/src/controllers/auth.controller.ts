import { z } from "zod";
import jwt from "jsonwebtoken";
import { Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import prisma from '../utils/prisma';
import { AppError, UnauthorizedError } from "../utils/errors";
import { AuthRequest } from "../middleware/auth";

// schema for user signup
export const signupSchema = z.object({
    name: z.string().min(3, 'Name must be at least 3 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
})

// schema for user login
export const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
})

// generate JWT token
const generateToken = (userId: string): string => {
    return jwt.sign({ userId }, process.env.JWT_SECRET || 'secret', {
        expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any,
    });
};

export const signup = async (req: AuthRequest, res: Response, next: NextFunction) : Promise<void> => {
    try {
        const {name, email, password} = req.body;
        const validation = await prisma.user.findUnique({
            where: { email },
        });
        if (validation) {
            throw new AppError("User already exist with this Email", 409);
        }
        const hashedPassword = await bcrypt.hash(password, 12);
        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
            },
            select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                createdAt: true,
            }
        });
        const token = generateToken(newUser.id);
        res.status(201).json({ data: { newUser, token}, status: "success", message: "User created successfully" });
    } catch (error) {
        next(error);
    }
};

export const login = async (req: AuthRequest, res: Response, next: NextFunction) : Promise<void> => {
    try {
        const {email, password} = req.body;
        const user = await prisma.user.findUnique({ where: {email}});
        if (!user ) {
            throw new UnauthorizedError("Invalid Email or Password");
        }
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            throw new UnauthorizedError("Invalid Email or Password");
        }
        const token = generateToken(user.id);
        res.json({
            data: {
                user: {id: user.id, name: user.name, email: user.email, avatar: user.avatar}, 
                token
            },
            status: "success",
            message: "User logged in successfully"
            
        })

    } catch (error) {
        next(error);
    }
};

export const getMe = async (req: AuthRequest, res: Response, next: NextFunction) : Promise<void> => {
    try {
        const user = await prisma.user.findUnique({ 
            where: {id: req.userId},
            select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                createdAt: true,
            }
        });
    
        if (!user) {
            throw new UnauthorizedError("User not found");
        }
        res.json({
            data: {user},
            status: "success",
            message: "User fetched successfully"
        })

    } catch (error) {
        next(error);
    }
};