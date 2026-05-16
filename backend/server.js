const path = require('path');
const http = require('http');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load env before any other local requires that rely on it
dotenv.config({ path: path.join(__dirname, '.env') });

const { connectDB } = require('./config/db');
const { errorMiddleware } = require('./errors/apiError');
const { initNotifications } = require('./config/notify');
require('./models');

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://mysalonpro.vercel.app"
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));
app.options("*", cors()); 

app.use(express.json());

// Database
connectDB();

// Routes
app.use('/api', require('./routes/index.route'));

app.get('/', (_req, res) => res.json({ message: 'Salon Management API Running ✂️' }));

// Error handler
app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;
// Socket.io init
initNotifications(server);

server.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server running on port ${PORT}`));