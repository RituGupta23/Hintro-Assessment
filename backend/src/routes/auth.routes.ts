import { Router } from "express";
import { validate } from "../middleware/validate";
import { signupSchema, signup, loginSchema, login, getMe } from "../controllers/auth.controller";
import { authMiddleware } from "../middleware/auth";

const route = Router();

route.post("/signup", validate(signupSchema), signup);
route.post("/login", validate(loginSchema), login);
route.get('/me', authMiddleware, getMe);

export default route;
