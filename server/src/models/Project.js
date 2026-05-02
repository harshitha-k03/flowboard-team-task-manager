const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Project title is required."],
      trim: true,
      maxlength: [120, "Project title cannot exceed 120 characters."]
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Project description cannot exceed 1000 characters."],
      default: ""
    },
    status: {
      type: String,
      enum: ["Planning", "In Progress", "On Track", "At Risk", "Completed"],
      default: "Planning",
      index: true
    },
    dueDate: {
      type: Date,
      required: [true, "Project due date is required."],
      index: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

projectSchema.index({ status: 1, dueDate: 1 });
projectSchema.index({ members: 1 });

projectSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model("Project", projectSchema);
