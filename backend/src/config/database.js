import mongoose from 'mongoose';

let isConnected = false;
let memoryServer = null;

export async function connectDB() {
  if (isConnected) {
    console.log('MongoDB already connected');
    return;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  // For development, fallback to in-memory MongoDB if Atlas fails
  const isDev = process.env.NODE_ENV === 'development';
  
  try {
    const options = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,
    };

    await mongoose.connect(uri, options);
    isConnected = true;
    console.log('MongoDB connected successfully (Atlas)');
  } catch (atlasError) {
    if (isDev) {
      console.warn('Atlas connection failed, starting in-memory MongoDB for development...');
      try {
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        memoryServer = await MongoMemoryServer.create();
        const memUri = memoryServer.getUri();
        
        await mongoose.connect(memUri, {
          maxPoolSize: 10,
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 45000,
          family: 4,
        });
        isConnected = true;
        console.log('MongoDB connected successfully (in-memory)');
      } catch (memError) {
        console.error('Failed to start in-memory MongoDB:', memError);
        throw atlasError;
      }
    } else {
      throw atlasError;
    }
  }

  mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
    isConnected = false;
  });

  mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected');
    isConnected = false;
  });

  process.on('SIGINT', async () => {
    await mongoose.connection.close();
    if (memoryServer) {
      await memoryServer.stop();
    }
    console.log('MongoDB connection closed due to app termination');
    process.exit(0);
  });
}

export function getConnectionStatus() {
  return {
    isConnected,
    readyState: mongoose.connection.readyState,
    host: mongoose.connection.host,
    name: mongoose.connection.name,
  };
}

export async function disconnectDB() {
  if (isConnected) {
    await mongoose.connection.close();
    if (memoryServer) {
      await memoryServer.stop();
    }
    isConnected = false;
    console.log('MongoDB disconnected gracefully');
  }
}