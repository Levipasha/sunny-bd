const mongoose = require('mongoose');
require('dotenv').config();

console.log('MongoDB URI from .env:', process.env.MONGODB_URI);

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('Successfully connected to MongoDB!');
  process.exit(0);
})
.catch(error => {
  console.error('MongoDB connection error:', error);
  process.exit(1);
});
