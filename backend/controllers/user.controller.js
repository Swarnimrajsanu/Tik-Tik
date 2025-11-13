import { validationResult } from "express-validator";
import userModel from "../models/user.model.js";
import redisClient from "../services/radis.service.js";
import * as userService from "../services/user.service.js";


export const createUser = async(req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const user = await userService.createUser(req.body);

        const token = await userService.generateToken(user);

        delete user._doc.password;
        res.status(201).json(user, token);
    } catch (error) {
        res.status(500).json({ error: error.message });
    };

};


export const logincontroller = async(req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { email, password } = req.body;
        const user = await userModel.findOne({ email }).select('+password');

        if (!user || !(await user.isValidPassword(password))) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        const token = await user.generateJWT();

        const userWithoutPassword = {...user._doc };
        delete userWithoutPassword.password;

        res.status(200).json({ user: userWithoutPassword, token });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


export const profileController = async(req, res) => {
    console.log(req.user);
    res.status(200).json({
        user: req.user
    });
}

export const logoutController = async(req, res) => {
    try {
        // Safely access cookies and authorization header
        const token = (req.cookies && req.cookies.token) ||
            (req.headers.authorization && req.headers.authorization.split(' ')[1]);

        if (!token) {
            return res.status(401).json({ error: "No token provided" });
        }

        // Blacklist the token in Redis
        await redisClient.set(token, 'logout', 'EX', 60 * 60 * 24);

        // Clear the cookie if cookies are available
        if (req.cookies && req.cookies.token) {
            res.clearCookie('token');
        }

        res.status(200).json({ message: "Logout Successful" });

    } catch (err) {
        console.log(err);
        res.status(500).json({ error: err.message });
    }
}

export const getAllUsersController = async(req, res) => {
    try {
        const loggedInUser = await userModel.findOne({ email: req.user.email });
        const allUsers = await userService.getAllUsers(loggedInUser._id);

        res.status(200).json({ users: allUsers });
    } catch (err) {
        console.error(err);
        res.status(400).json({ error: err.message });
    }
};