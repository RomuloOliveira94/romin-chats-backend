const express = require("express");
const http = require("http");
const cors = require("cors");
const router = require("./router");
const { Server } = require("socket.io");
const app = express();
app.use(cors());
app.use(router);
app.set("port", process.env.PORT || 5000);

const server_port = 5000;
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "https://romin-chats.vercel.app"],
  },
});

let rooms = {};
io.on("connection", (socket) => {
  function getQuantityOfUsers(roomID) {
    const room = io.sockets.adapter.rooms.get(roomID);
    const numUsers = room ? room.size : 0;
    return socket.to(roomID).emit("userQuantity", numUsers);
  }

  console.log(`User Connected: ${socket.id}`);

  socket.on("disconnect", () => {
    console.log(`User desconnected: ${socket.id}`);
  });

  socket.on("join_room", (data) => {
    socket.join(data.room);
    rooms[data.room] = io.sockets.adapter.rooms.get(data.room);
    socket.emit("userQuantity", rooms[data.room].size);
    socket.to(data.room).emit("userQuantity", rooms[data.room].size);
    socket.to(data.room).emit("receive_message", data);
    console.log(`User: ${socket.id}, entrou na sala ${data.room}`);
  });

  socket.on("send_message", (data) => {
    socket.to(data.room).emit("receive_message", data);
  });

  socket.on("leaveRoom", (data) => {
    socket.leave(data.room);
    console.log(`User: ${socket.id}, saiu da sala ${data.room}`);
    socket.to(data.room).emit("receive_message", data);
    socket.emit("userQuantity", rooms[data.room].size);
    socket.to(data.room).emit("userQuantity", rooms[data.room].size);
    rooms[data.room] = io.sockets.adapter.rooms.get(data.room);
  });
});

server.listen(server_port, () => {
  console.log(`Server rodando em localhost:${server_port}`);
});
