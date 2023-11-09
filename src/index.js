const express = require("express");
const http = require("http");
const cors = require("cors");
const app = express();
const router = require('./router');

app.use(cors());

app.use(router);


const server_port = 5000;
const server = http.createServer(app);

const io = require("socket.io")(server, {
  cors: {
    origin: "https://romin-chats.vercel.app/",
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {

  function getQuantityOfUsers (roomID) {
    const room = io.sockets.adapter.rooms.get(roomID);
    const numUsers = room ? room.size : 0;
    return socket.to(roomID).emit("userQuantity", numUsers)
  }

  console.log(`User Connected: ${socket.id}`);

  socket.on("disconnect", () => {
    console.log(`User desconnected: ${socket.id}`);
  });

  socket.on("join_room", (data) => {
    socket.join(data.room);
    socket.to(data.room).emit("receive_message", data)
    getQuantityOfUsers(data.room)
    console.log(`User: ${socket.id}, entrou na sala ${data.room}`);
  });

  socket.on("send_message", (data) => {
    socket.to(data.room).emit("receive_message", data)
  });

  socket.on("leaveRoom", (data) => {
    socket.leave(data.room);
    console.log(`User: ${socket.id}, saiu da sala ${data.room}`);
    socket.to(data.room).emit("receive_message", data);
    getQuantityOfUsers(data.room)
  });
});

server.listen(server_port, () => {
  console.log(`Server rodando em localhost:${server_port}`);
})



