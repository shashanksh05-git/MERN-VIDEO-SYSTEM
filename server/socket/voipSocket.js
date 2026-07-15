const voipSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    socket.on("voip:join-room", ({ roomId, user }) => {
      socket.join(roomId);
      socket.data.roomId = roomId;
      socket.data.user = user;

      socket.to(roomId).emit("voip:user-joined", {
        socketId: socket.id,
        user,
      });

      console.log(`${user?.name || "User"} joined room ${roomId}`);
    });

    socket.on("voip:offer", ({ roomId, offer }) => {
      socket.to(roomId).emit("voip:offer", {
        from: socket.id,
        offer,
        user: socket.data.user,
      });
    });

    socket.on("voip:answer", ({ roomId, answer }) => {
      socket.to(roomId).emit("voip:answer", {
        from: socket.id,
        answer,
      });
    });

    socket.on("voip:ice-candidate", ({ roomId, candidate }) => {
      socket.to(roomId).emit("voip:ice-candidate", {
        from: socket.id,
        candidate,
      });
    });

    socket.on("voip:leave-room", () => {
      const roomId = socket.data.roomId;

      if (roomId) {
        socket.to(roomId).emit("voip:user-left", {
          socketId: socket.id,
        });

        socket.leave(roomId);
      }
    });

    socket.on("disconnect", () => {
      const roomId = socket.data.roomId;

      if (roomId) {
        socket.to(roomId).emit("voip:user-left", {
          socketId: socket.id,
        });
      }

      console.log("Socket disconnected:", socket.id);
    });
  });
};

export default voipSocket;