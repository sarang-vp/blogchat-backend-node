const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const userSchema = {
  userName: {
    type: String,
    required: true,
    // Add any other validation rules you need
  },
  email: String,
  mobileNo: Number,
  passWord: { type: String, default: null },
  details: [
    {
      loc: String,
      locName: String,
      locId: {
        type: "UUID",
        default: () => uuidv4(),
      },
    },
  ],
  docId: {
    type: "UUID",
    default: () => uuidv4(),
  },
  db: String,
};
// Define schema for chat messages
const chatSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});
const userModel = mongoose.model("user", userSchema);

// Create model for chat messages
const ChatModel = mongoose.model("ChatMessage", chatSchema);
module.exports = {
  userModel,
  ChatModel,
};
