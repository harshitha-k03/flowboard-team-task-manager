const mongoose = require("mongoose");

const subtaskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    completed: {
      type: Boolean,
      default: false
    }
  },
  { _id: true }
);

const commentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: [500, "Comment cannot exceed 500 characters."]
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: true, timestamps: false }
);

const attachmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: [120, "Attachment name cannot exceed 120 characters."]
    },
    url: {
      type: String,
      required: true,
      trim: true
    }
  },
  { _id: true, timestamps: false }
);

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Task title is required."],
      trim: true,
      maxlength: [160, "Task title cannot exceed 160 characters."]
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1500, "Task description cannot exceed 1500 characters."],
      default: ""
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: [true, "Task project is required."],
      index: true
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Task assignee is required."],
      index: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    status: {
      type: String,
      enum: ["Todo", "In Progress", "In Review", "Done", "Blocked"],
      default: "Todo",
      index: true
    },
    priority: {
      type: String,
      enum: ["Critical", "High", "Medium", "Low"],
      default: "Low",
      index: true
    },
    dueDate: {
      type: Date,
      required: [true, "Task due date is required."],
      index: true
    },
    estimatedHours: {
      type: Number,
      min: 1,
      max: 200,
      default: 4
    },
    subtasks: {
      type: [subtaskSchema],
      default: []
    },
    comments: {
      type: [commentSchema],
      default: []
    },
    attachments: {
      type: [attachmentSchema],
      default: []
    }
  },
  {
    timestamps: true
  }
);

taskSchema.index({ projectId: 1, status: 1 });
taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ dueDate: 1, status: 1 });
taskSchema.index({ priority: 1, dueDate: 1 });

taskSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model("Task", taskSchema);
