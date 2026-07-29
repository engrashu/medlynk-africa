const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { connectDB } = require('./config/db');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    message: 'Medlynk Africa API is running',
    version: '1.0.0',
    status: 'healthy'
  });
});

app.use('/api/medicines',  require('./routes/medicines'));
app.use('/api/pharmacies', require('./routes/pharmacies'));
app.use('/api/users',      require('./routes/users'));
app.use('/api/facilities', require('./routes/facilities'));
app.use('/api/home',       require('./routes/home'));
app.use('/api/dashboard',  require('./routes/dashboard'));

const PORT = process.env.PORT || 3000;

const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 Medlynk Africa API running on port ${PORT}`);
    console.log(`📡 Test it: http://localhost:${PORT}`);
  });
};

start();