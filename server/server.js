const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const path = require("path");

const app = express();
const server = http.createServer(app);

// ------------------------------------
// SOCKET.IO
// ------------------------------------
const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

// ------------------------------------
// MIDDLEWARE
// ------------------------------------
app.use(cors());

app.use(
  express.static(
    path.join(__dirname, "../public")
  )
);

// ------------------------------------
// HEALTH CHECK
// ------------------------------------
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

// ------------------------------------
// TEMP USER STORAGE
// ------------------------------------
const users = {};

// ------------------------------------
// SOCKET CONNECTIONS
// ------------------------------------
io.on("connection", (socket) => {

  const userId =
    "user_" +
    Math.floor(Math.random() * 100000);

  users[socket.id] = userId;

  console.log(
    `[CONNECT] ${userId} (${socket.id})`
  );

  // Send user ID to client
  socket.emit("init", {
    userId
  });

  // ------------------------------
  // RECEIVE MESSAGE
  // ------------------------------
  socket.on("chat-message", (msg) => {

    const fullMessage = {
      ...msg,
      id: socket.id,
      timestamp: Date.now()
    };

    const payloadSize =
      Buffer.byteLength(
        JSON.stringify(fullMessage),
        "utf8"
      );

    console.log(
      `[PAYLOAD] ${payloadSize} bytes`
    );

    console.log(
      `[MSG] ${msg.user}: ${msg.content.length} chars`
    );

    // Broadcast to all clients
    io.emit(
      "chat-message",
      fullMessage
    );

  });

  // ------------------------------
  // DISCONNECT
  // ------------------------------
  socket.on("disconnect", () => {

    console.log(
      `[DISCONNECT] ${users[socket.id]}`
    );

    delete users[socket.id];

  });

});

// ------------------------------------
// START SERVER
// ------------------------------------
const PORT =
  process.env.PORT || 3000;

server.listen(PORT, () => {

  console.log(
    `Server running on port ${PORT}`
  );

});
