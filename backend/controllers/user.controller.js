import { validationResult } from "express-validator";
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
        res.status(201).json(user, token);
    } catch (error) {
        res.status(500).json({ error: error.message });
    };

};


export const logincontroller = async(req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const { email, password } = req.body;
        const user = await userService.findUserByEmail(email);
        if (!user) {
            return res.status(401).json({ error: "Invalid email or password" });
        }
        const isMatched = await user.isValidPassword(password);
        if (!isMatched) {
            return res.status(401).json({ error: "Invalid email or password" });
        }
        const token = await user.generateJWT();
        res.status(200).json({ token });
    } catch (error) {
        res.status(500).json({ error: error.message });
    };
}


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