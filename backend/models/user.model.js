import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        minlength: [5, 'Email must be at least 5 characters'],
        maxlength: [50, 'Email must be at most 50 characters']
    },
    password: {
        type: String,
        required: true,
        select: false,
    }
})

userSchema.statics.hashPassword = async function(password) {
    return await bcrypt.hash(password, 10);
}

userSchema.methods.isValidPassword = async function(password) {
    return await bcrypt.compare(password, this.password);
}

userSchema.methods.generateJWT = function() {
    return jwt.sign({ email: this.email },
        process.env.JWT_SECRET, { expiresIn: '24h' }
    );
}

const User = mongoose.model('user', userSchema);

export default User;