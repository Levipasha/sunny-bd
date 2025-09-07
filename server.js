const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB with detailed logging
console.log('Attempting to connect to MongoDB...');
console.log('MongoDB URI:', process.env.MONGODB_URI ? 'Found' : 'Missing');

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000, // 5 seconds timeout
  socketTimeoutMS: 45000, // 45 seconds socket timeout
  connectTimeoutMS: 10000, // 10 seconds connection timeout
  maxPoolSize: 10
})
.then(async () => {
  console.log('✅ MongoDB connected successfully');
  console.log('MongoDB host:', mongoose.connection.host);
  console.log('MongoDB database:', mongoose.connection.name);
  try {
    const User = require('./models/User');
    const count = await User.countDocuments();
    if (count === 0) {
      const bcrypt = require('bcryptjs');
      const passwordHash = await bcrypt.hash('Vamshi.c2002', 10);
      await User.create({ name: 'Vamshi', passwordHash, passkey: '2003' });
      console.log('👤 Seeded default user Vamshi');
    }
  } catch (seedErr) {
    console.warn('⚠️  Could not seed default user:', seedErr.message);
  }
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err.message);
  console.error('Error stack:', err.stack);
  console.error('MongoDB connection state:', mongoose.connection.readyState);
  process.exit(1);
});

// Handle MongoDB connection events
mongoose.connection.on('connected', () => {
  console.log('🔗 Mongoose connected to DB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️  Mongoose disconnected');
});

// Log unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️  Unhandled Rejection at:', promise, 'reason:', reason);
});

// Import routes
const inventoryRoutes = require('./routes/inventory');
const recipeRoutes = require('./routes/recipes');
const inventoryRecordRoutes = require('./routes/inventoryRecords');
const authRoutes = require('./routes/auth');

// Use routes
app.use('/inventory', inventoryRoutes);
app.use('/recipes', recipeRoutes);
app.use('/inventory-records', inventoryRecordRoutes);
app.use('/auth', authRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'nuv eri puku vii' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Server accessible at http://localhost:${PORT}`);
});
