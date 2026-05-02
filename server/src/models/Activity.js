const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    action: {
      type: String,
      required: true,
      trim: true,
      maxlength: [240, "Activity action cannot exceed 240 characters."]
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      default: null,
      index: true
    },
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      default: null,
      index: true
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

activitySchema.index({ createdAt: -1 });

activitySchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model("Activity", activitySchema);
