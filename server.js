require('dotenv').config();
const app = require('./src/app');
const { connectDB } = require('./src/config/database');

const PORT = process.env.PORT || 5000;

// loanlinkDBuser - AHvLx7RRsyDLS6eH

// Connect to database and start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Start the server
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    🚀 LoanLink Server 🚀                    ║
║                                                              ║
║  Server is running on: http://localhost:${PORT}              ║
║  Environment: ${process.env.NODE_ENV || 'development'}       ║
║  MongoDB: Connected                                          ║
║                                                              ║
║  API Endpoints:                                              ║
║  • Auth: /api/auth                                           ║
║  • Users: /api/users                                         ║
║  • Loans: /api/loans                                         ║
║  • Applications: /api/applications                           ║
║  • Payments: /api/payments                                   ║
║  • Upload: /api/upload                                       ║
║                                                              ║
║  Health Check: /api/health                                   ║
╚══════════════════════════════════════════════════════════════╝
      `);
    });

    // Handle server shutdown gracefully
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down gracefully');
      server.close(() => {
        console.log('Process terminated');
      });
    });

    process.on('SIGINT', () => {
      console.log('SIGINT received, shutting down gracefully');
      server.close(() => {
        console.log('Process terminated');
      });
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
startServer();