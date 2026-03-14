const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// DB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.log('❌ DB Error:', err));

// Routes
app.use('/api/auth',         require('./routes/auth'));
app.use('/api/customers',    require('./routes/customers'));
app.use('/api/services',     require('./routes/services'));
app.use('/api/staff',        require('./routes/staff'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/dashboard',    require('./routes/dashboard'));

app.get('/', (req, res) => res.json({ message: 'Salon Management API Running ✂️' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
