const express = require("express");
const fileUpload = require("express-fileupload");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const app = express();
const server = http.createServer(app);
const mongoose = require("mongoose");
require("dotenv").config();
const { ChatModel } = require("./src/model/userModel");
// const io = socketIo(server);
mongoose
  .connect("mongodb://127.0.0.1:27017/blogChatDB", { useNewUrlParser: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Error connecting to MongoDB:", err));
// Set up static file serving
app.use(express.static("public"));

// Enable all CORS requests
const corsOptions = {
  origin: "http://localhost:3000", // Adjust this to match your React frontend URL
  methods: ["GET", "POST"], // Add any other HTTP methods you need
};
app.use(cors());
// Enable the cors middleware for socket.io
const io = socketIo(server, {
  cors: corsOptions,
});
const PORT = process.env.PORT; // Port for the API
console.log(PORT);

// Middleware to handle CORS and JSON parsing
app.use(
  express.urlencoded({
    extended: true,
  })
);
// Map to store user IDs and their corresponding WebSocket connections
const userSockets = new Map();
// Define Socket.IO middleware to pass 'io' instance to controllers
app.use((req, res, next) => {
  req.app.set("io", io);
  req.userSockets = userSockets;
  next();
});
app.use(express.json({ limit: "50mb" }));
// app.use((req, res, next) => {
//   res.setHeader('Access-Control-Allow-Origin', '*');
//   res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
//   next();
// });
app.use(fileUpload());

// Server-side Socket.IO connection event
io.on("connection", (socket) => {
  //console.log('A user connected');

  // Handle username assignment
  socket.on("setUsername", (username) => {
    userSockets.set(username, socket);
    console.log(`User ${username} connected`);
    socket.username = username; // Set the username property on the socket object
    //connectedClients[username] = socket; // Add the socket to connectedClients object
  });

  // Handle private messages
  socket.on("privateMessage", async ({ recipient, sender, message }) => {
    //console.log(`Sending private message from ${socket.username} to ${recipient}: ${message}`);
    try {
      const newChatMessage = new ChatModel({
        /* sender: sender,*/
        sender: socket.username,
        receiver: recipient,
        message: message,
      });
      //console.log(newChatMessage);
      const savedMessage = await newChatMessage.save();
    } catch (error) {
      console.error("Error saving chat message:", error);
    }

    const userSocket = userSockets.get(recipient);
    if (userSocket) {
      userSocket.emit("privateMessage", {
        sender: socket.username,
        message,
      });
    } else {
      socket.emit("offlineResponse", { message: "User offline" });
      console.log(`Recipient ${recipient} not found.`);
      // Handle recipient not found (e.g., display an error message to the sender)
    }
  });

  // Handle user disconnection
  socket.on("disconnect", () => {
    console.log(`User ${socket.id} disconnected`);
    const username = socket.username;
    if (username) {
      userSockets.delete(username); // Remove the user socket from userSockets map
    }
  });
});

// apis
const userRoutes = require("./src/routes/userRoute");
app.use("/users", userRoutes);
const offerRoutes = require("./src/routes/offerRoutes");
app.use("/offer", offerRoutes);
// Start the server
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
module.exports = userSockets;
