import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import authRoutes from './routes/authRoutes';
import todoRoutes from './routes/todoRoutes';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/todo', todoRoutes);

// Add a health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    database: mongoose.connection.readyState === 1 ? 'MongoDB Connected' : 'MongoDB Disconnected'
  });
});

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/todo-app';

// Connect to MongoDB and start server only if successful
mongoose.connect(MONGO_URI, {
  dbName: 'todo-app'
})
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    console.log('📊 Database URL:', MONGO_URI.replace(/\/\/.*@/, '//***:***@')); // Hide credentials
    startServer();
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed');
    console.error('❌ Connection error:', err.message);
    console.log('📋 To use MongoDB:');
    console.log('1. Check your .env file has the correct MONGO_URI');
    console.log('2. Ensure MongoDB Atlas is accessible');
    console.log('3. Check network access settings in MongoDB Atlas');
    process.exit(1); // Exit if MongoDB connection fails
  });

function startServer() {
  app.listen(PORT, () => {
    console.log('🚀 Server running on http://localhost:${PORT}');
    console.log('📊 Health check: http://localhost:${PORT}/api/health');
    console.log('🔗 Frontend should be available at http://localhost:3000');
    console.log('⏰ Server started at:', new Date().toISOString());
  });
}

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - ${req.ip}`);
  next();
});
