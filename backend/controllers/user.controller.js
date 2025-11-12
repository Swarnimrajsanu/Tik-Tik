import { validationResult } from "express-validator";
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