/**
 * Domain Reseller Backend - Entry Point
 * (Environment variables already loaded by bootstrap.js)
 */

import createApp from './app.js';

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    const app = await createApp();
    
const server = app.listen(PORT, '0.0.0.0', (err) => {
      if (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
      }
      console.log(`
╔═══════════════════════════════════════════════════════════════╗
║  Domain Reseller Platform - Backend API                      ║
║  Version: 1.0.0                                              ║
║  Environment: ${process.env.NODE_ENV || 'development'.padEnd(44)}║
║  Server running on port ${PORT.toString().padStart(3).padEnd(44)}║
║  API Base: http://localhost:${PORT}/api/v1                   ║
╚═══════════════════════════════════════════════════════════════╝
      `);
    });
    
    // Graceful shutdown
    const shutdown = async (signal) => {
      console.log(`\n${signal} received. Shutting down gracefully...`);
      
      server.close(async () => {
        console.log('HTTP server closed');
        
        try {
          // Close database connection
          const mongoose = await import('mongoose');
          await mongoose.default.connection.close();
          console.log('MongoDB connection closed');
        } catch (error) {
          console.error('Error closing MongoDB:', error);
        }
        
        console.log('Shutdown complete');
        process.exit(0);
      });
      
      // Force close after 30 seconds
      setTimeout(() => {
        console.error('Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };
    
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    
    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      shutdown('UNCAUGHT_EXCEPTION');
    });
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();