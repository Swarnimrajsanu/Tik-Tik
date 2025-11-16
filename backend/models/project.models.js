import mongoose from "mongoose";
import "./user.model.js"; // ✅ make sure User schema is registered

const projectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        unique: [true, "Project name already exists"],
    },
    users: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // ✅ must match mongoose.model("User", userSchema)
    }, ],
    fileTree: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, { timestamps: true });

// ✅ Capitalize model name for consistency
const Project = mongoose.model("Project", projectSchema);

export default Project;