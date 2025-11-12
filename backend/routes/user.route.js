import { Router } from "express";
import { body } from "express-validator";
import * as userController from "../controllers/user.controller.js";

const router = Router();

router.post("/register",
    body("email").isEmail().withMessage("Email is required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),

    userController.createUser);

router.post("/login",
    body("email").isEmail().withMessage("Email is required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
    userController.logincontroller);


export default router;