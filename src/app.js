// require('dotenv').config();
// const express = require('express');
// const bodyParser = require('body-parser');
// const authRoutes = require('./routes/auth');
// const fileUploadRoutes = require('./routes/file-upload')(io);
// const reportRoutes = require('./routes/report')
// const bcrypt = require('bcryptjs');
// const socketIo = require('socket.io');

// const app = express();
// const io = socketIo(server);

// // Set up Socket.IO connections
// io.on('connection', (socket) => {
//     console.log('New client connected');
  
//     socket.on('joinRoom', (jobId) => {
//       socket.join(jobId); // Join a room based on jobId
//       console.log(`Socket joined room: ${jobId}`);
//     });
//   });

// server.listen(3000, () => console.log('Server listening on port 3000'));

// // Middleware
// app.use(bodyParser.json());

// // Routes
// app.use('/api/auth', authRoutes);
// app.use('/api/file-upload', fileUploadRoutes);
// app.use('/api/report', reportRoutes);

// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const cors = require('cors');
const socketModule = require('./config/socket'); // Path to your socket module
const authRoutes = require('./routes/auth');
const fileUploadRoutes = require('./routes/file-upload');
const reportRoutes = require('./routes/report');

const app = express();
const server = http.createServer(app);
const io = socketModule.init(server); // Initialize Socket.IO with the server

// Set up Socket.IO connections
io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('joinRoom', (jobId) => {
    socket.join(jobId);
    console.log(`Socket joined room: ${jobId}`);
  });
});

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/file-upload', fileUploadRoutes);
app.use('/api/report', reportRoutes);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));