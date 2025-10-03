const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send("Server is running...");
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", 
    methods: ["GET", "POST"],
  },
});

// --- Attach Socket.IO middleware for auth ---
io.use((socket, next) => {
  try {
    const { token, username } = socket.handshake.auth;
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = { id: decoded.id, username: decoded.username };
    } else {
      socket.user = { username: username || "Guest" };
    }
    next();
  } catch (err) {
    next(new Error("Authentication failed"));
  }
});

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.user.username}`);

  // socket.on("join_room", ({ roomCode }) => {
  //   socket.join(roomCode);
  //   socket.to(roomCode).emit("receive_message", {
  //     author: "System",
  //     text: `${socket.user.username} joined the room`,
  //     time: new Date().toLocaleTimeString(),
  //   });
  // });
socket.on("join_room", ({ roomCode }) => {
  if (!socket.rooms.has(roomCode)) {
    socket.join(roomCode);
    socket.to(roomCode).emit("receive_message", {
      author: "System",
      text: `${socket.user.username} joined the room`,
      time: new Date().toLocaleTimeString(),
    });
  }
});

  socket.on("send_message", ({ roomCode, text }) => {
    const msg = {
      author: socket.user.username,
      text,
      time: new Date().toLocaleTimeString(),
    };
    io.to(roomCode).emit("receive_message", msg);
  });

  socket.on("leave_room", ({ roomCode }) => {
    socket.leave(roomCode);
    socket.to(roomCode).emit("receive_message", {
      author: "System",
      text: `${socket.user.username} left the room`,
      time: new Date().toLocaleTimeString(),
    });
  });

  socket.on("disconnect", () => {
    console.log(`${socket.user.username} disconnected`);
  });
});

const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

const roomsRoutes = require("./routes/rooms");
app.use("/api/rooms", roomsRoutes);

const PORT = process.env.PORT || 8000;
server.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
