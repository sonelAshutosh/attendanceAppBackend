const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const chalk = require('chalk');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorMiddleware');
const notFound = require('./middleware/notFound');

// Load env vars
dotenv.config({ path: '.env' });

// Connect to database
connectDB();

// Route files (will be added later)
// const authRoutes = require('./routes/auth.routes');

const app = express();

// Body parser
app.use(express.json());

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Mount routers (will be added later)
// app.use('/api/auth', authRoutes);


app.get('/', (req, res) => {
    res.send('API is running...');
});

// Handle 404 not found errors
app.use(notFound);
// Handle all other errors
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () =>
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(chalk.red(`Error: ${err.message}`));
  // Close server & exit process
  server.close(() => process.exit(1));
});
