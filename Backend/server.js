const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
// 🔌 NEW IMPORTS FOR SOCKET.IO
const http = require('http'); 
const { Server } = require('socket.io'); 
const path = require('path');
const fs = require('fs'); // 1. Import FS
// 🌍 NEW IMPORT FOR GEOCODING
const fetch = require('node-fetch'); // ⬅️ NEW IMPORT
// ------------------------------
require('dotenv').config();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const taskRoutes = require('./routes/tasks');
const walletRoutes = require('./routes/wallet');
const ratingRoutes = require('./routes/ratings');

const app = express();

// --- 2. ROBUST STARTUP: CREATE UPLOADS FOLDERS ---
// We create both the main folder and the subfolders to be safe
const dirs = [
    path.join(__dirname, 'uploads'),
    path.join(__dirname, 'uploads/task-proofs')
];

dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📂 Created directory: ${dir}`);
    }
});
// --------------------------------------------------


// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/neurafund', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch((error) => {
  console.error('MongoDB connection error:', error.message);
  console.log('Note: MongoDB connection failed. Some features may not work properly.');
  console.log('Please ensure MongoDB is running or provide a valid MONGODB_URI in .env file.');
});

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/ratings', ratingRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'NeuraFund API is running' });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error(error.stack);
  res.status(500).json({
    success: false,
    error: {
      message: 'Internal server error',
      code: 'INTERNAL_ERROR'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: 'Route not found',
      code: 'NOT_FOUND'
    }
  });
});

// ----------------------------------------------------------------
// 🛠️ SOCKET.IO INTEGRATION AND SERVER STARTUP
// ----------------------------------------------------------------

const PORT = process.env.PORT || 5001;

// 1. Create the HTTP server using the Express app
const httpServer = http.createServer(app);

// 2. Attach Socket.IO to the HTTP server
const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:3000", // Allow your React client
        methods: ["GET", "POST"]
    }
});

// 3. Define Socket.IO Events and Logic
io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // --- CHAT ROOM LOGIC ---
    socket.on('JOIN_TASK', (taskId) => {
        socket.join(taskId);
        console.log(`User ${socket.id} joined room ${taskId}`);
    });

    // 🛠️ FIX: LOG AND RELAY FULL DATA
    socket.on('SEND_MESSAGE', (data) => {
        // 1. Log to terminal so you can SEE it working
        console.log(`📨 New Message in Room ${data.taskId}:`, data.message);
        
        // 2. Send the EXACT data object back (Includes name, profilePic, etc.)
        // Previous code might have been stripping these fields.
        io.to(data.taskId).emit('RECEIVE_MESSAGE', data);
    });

    // --- LIVE LOCATION LOGIC ---
    socket.on('SEND_LOCATION', async ({ taskId, userId, lat, lng }) => {
        let address = 'Address lookup unavailable (Map Pin Active)';
        
        try {
            // 5-second timeout for the map API
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); 

            const geoUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
            
            const response = await fetch(geoUrl, {
                headers: { 'User-Agent': 'NeuraFundApp/1.0' },
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            
            if (response.ok) {
                const data = await response.json();
                address = data.display_name || data.address.road || 'Address found';
            }
        } catch (e) {
            // Silent fail for location text
        }
        
        // Always emit the coordinates
        io.to(taskId).emit('RECEIVE_LOCATION', { 
            userId, 
            lat, 
            lng, 
            address, 
            timestamp: Date.now() 
        });
    });
    
    socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
    });
});

// // 4. Start the Server by listening on the new HTTP server object
// httpServer.listen(PORT, () => {
//     console.log(`Server running on port ${PORT}`);
// });

module.exports = httpServer;