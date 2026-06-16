const mongoose = require('mongoose');

async function connectDB() {
  let dbUri = process.env.MONGODB_URI;

  if (!dbUri || dbUri.includes('127.0.0.1') || dbUri.includes('localhost')) {
    try {
      console.log('Attempting to launch in-memory MongoDB for local testing...');
      
      // Configure download directory inside workspace to avoid permission issues
      process.env.MONGOMS_DOWNLOAD_DIR = require('path').join(__dirname, 'mongodb-binaries');
      
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create({
        instance: {
          dbName: 'bookkeeping'
        }
      });
      dbUri = mongod.getUri();
      console.log('In-memory MongoDB started successfully at:', dbUri);
    } catch (err) {
      console.error('MongoMemoryServer launch failed:', err.message);
      console.log('Falling back to default local MongoDB URL...');
      dbUri = dbUri || 'mongodb://127.0.0.1:27017/bookkeeping';
    }
  }

  await mongoose.connect(dbUri);
  console.log(`Connected to MongoDB Database: ${mongoose.connection.name}`);
}

module.exports = connectDB;
