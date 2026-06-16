let io;

const initSocket = (serverIo) => {
  io = serverIo;
  io.on('connection', (socket) => {
    console.log('⚡ Client connected:', socket.id);

    // Join room for specific table
    socket.on('join_table', (tableNumber) => {
      socket.join(`table_${tableNumber}`);
      console.log(`Table ${tableNumber} joined room`);
    });

    // Kitchen joins kitchen room
    socket.on('join_kitchen', () => {
      socket.join('kitchen');
      console.log('Kitchen joined room');
    });

    socket.on('disconnect', () => {
      console.log('❌ Client disconnected:', socket.id);
    });
  });
};

const getIo = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

module.exports = { initSocket, getIo };
