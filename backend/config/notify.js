const { Server } = require('socket.io');

let ioInstance = null;

const initNotifications = (server) => {
  ioInstance = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: false
    }
  });

  ioInstance.on('connection', (socket) => {
    console.log('🔔 client connected', socket.id);
    socket.on('disconnect', () => console.log('🔌 client disconnected', socket.id));
  });
};

const pushNotification = (payload) => {
  if (!ioInstance) return;
  ioInstance.emit('notification', payload);
};

module.exports = { initNotifications, pushNotification };
