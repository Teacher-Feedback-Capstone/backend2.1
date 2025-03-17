// require('dotenv').config();
// const express = require('express');
// const mysql = require("mysql")
// const bodyParser = require('body-parser');
// const authRoutes = require('./routes/auth'); 
// // const fileUploadRoutes = require('./routes/file-upload');

// const app = express();

// // Middleware
// app.use(bodyParser.json());

// const db = mysql.createConnection({
//     host: process.env.DB_HOST,
//     user: process.env.DB_USER,
//     password: process.env.DB_PASSWORD,
//     database: process.env.DB_NAME,
//     port: process.env.DB_PORT,
//   });

// // Connect to the database
// db.connect((err) => {
//     if (err) {
//       console.error("Error connecting to the database:", err.message);
//     } else {
//       console.log("Connected to the MySQL database!");
//     }
//   });

// // Routes
// app.use('/api/auth', authRoutes);
// // app.use('/api/file-upload', fileUploadRoutes);

// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/auth');
const fileUploadRoutes = require('./routes/file-upload');
const bcrypt = require('bcryptjs');

const app = express();

// Middleware
app.use(bodyParser.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/file-upload', fileUploadRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));