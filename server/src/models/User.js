const mongoose = require("mongoose");
const { comparePassword, hashPassword, isHashedPassword } = require("../utils/password");

const buildAvatar = (name = "FlowBoard User") =>
  `https://ui-avatars.com/api/?background=2563eb&color=ffffff&name=${encodeURIComponent(name)}`;
const isGeneratedAvatar = (avatar = "") => avatar.includes("ui-avatars.com/api/");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required."],
      trim: true,
      maxlength: [80, "Name cannot exceed 80 characters."]
    },
    email: {
      type: String,
      required: [true, "Email is required."],
      unique: true,
      trim: true,
      lowercase: true,
      index: true
    },
    password: {
      type: String,
      required: [true, "Password is required."],
      minlength: [6, "Password must be at least 6 characters."],
      select: false
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true
    },
    role: {
      type: String,
      enum: ["admin", "member"],
      default: "member",
      index: true
    },
    availability: {
      type: String,
      enum: ["Available", "Busy", "On Leave"],
      default: "Available",
      index: true
    },
    avatar: {
      type: String,
      default: function avatarDefault() {
        return buildAvatar(this.name);
      }
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

userSchema.pre("save", async function prepareUser() {
  if (this.isModified("name") && !this.isModified("avatar") && (!this.avatar || isGeneratedAvatar(this.avatar))) {
    this.avatar = buildAvatar(this.name);
  }

  if (!this.isModified("password")) {
    return;
  }

  if (!isHashedPassword(this.password)) {
    this.password = await hashPassword(this.password);
  }
});

userSchema.methods.comparePassword = async function comparePassword(candidatePassword) {
  return comparePassword(candidatePassword, this.password);
};

userSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model("User", userSchema);
