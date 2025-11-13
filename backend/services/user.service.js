import userModel from "../models/user.model.js";

export const createUser = async({
    email,
    password
}) => {
    if (!email || !password) {
        throw new Error("Email and password are required");
    }
    const hashPassword = await userModel.hashPassword(password);
    const user = await userModel.create({
        email,
        password: hashPassword,
    });
    return user;
}

export const generateToken = (user) => {
    return user.generateJWT();
}

// export const findUserByEmail = async(email) => {
//     const user = await userModel.findOne({ email }).select('+password');
//     return user;
// }

export const getAllUsers = async(userId) => {
    const users = await userModel
        .find({ _id: { $ne: userId } })
        .select("-password -__v"); // exclude sensitive fields
    return users;
};