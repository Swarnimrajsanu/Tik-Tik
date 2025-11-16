import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        minlength: [5, "Email must be at least 5 characters"],
        maxlength: [50, "Email must be at most 50 characters"],
    },
    password: {
        type: String,
        required: true,
        select: false,
    },
});

// static method for hashing password
userSchema.statics.hashPassword = async function(password) {
    return await bcrypt.hash(password, 10);
};

// instance method to check password
userSchema.methods.isValidPassword = async function(password) {
    return await bcrypt.compare(password, this.password);
};

// instance method to generate JWT
userSchema.methods.generateJWT = function() {
    return jwt.sign({ email: this.email, _id: this._id, userId: this._id }, // ✅ include both _id and userId for compatibility
        process.env.JWT_SECRET, { expiresIn: "24h" }
    );
};

// ✅ model name must match the ref in project model ("User")
const User = mongoose.model("User", userSchema);

export default User;