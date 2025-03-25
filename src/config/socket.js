let io;

module.exports = {
  init: (server) => {
    io = require('socket.io')(server, {
        cors: {
          origin: "http://127.0.0.1:5000", // change to your client's origin (port may vary)
          methods: ["GET", "POST"]
        }
      });
    console.log('Socket.io initialized..')
    return io;
  },
  getIO: () => {
    if (!io) {
      throw new Error('Socket.io not initialized!');
    }
    return io;
  },
};
