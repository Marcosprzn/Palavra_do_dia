require('dotenv').config();
const path = require('path');
const fs = require('fs');
const http = require('http');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');

const db = require('./config/database');
const verseService = require('./services/verseService');
const whatsappService = require('./services/whatsappService');
const schedulerService = require('./services/schedulerService');
const apiRoutes = require('./routes/api');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Uploads static directory
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Attach Socket.IO
whatsappService.setSocketIo(io);
schedulerService.setSocketIo(io);

io.on('connection', (socket) => {
  // Emit current statuses on fresh connection
  socket.emit('connection_status', whatsappService.getConnectionStatus());
  socket.emit('scheduler_status', schedulerService.getSchedulerStatus());
});

// API Routes
app.use('/api', apiRoutes);

// Serve Client SPA in Production if client/dist exists
const clientDistDir = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDistDir)) {
  app.use(express.static(clientDistDir));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(clientDistDir, 'index.html'));
  });
}

async function startServer(port = process.env.PORT || 3000, connectWhatsApp = true) {
  // 1. Initialize Database
  await db.initDatabase();

  // 2. Initialize Verse Service
  await verseService.initVerseService();

  // 3. Initialize Scheduler
  await schedulerService.initScheduler(io);

  // 4. Optionally Initialize WhatsApp (auto-connect on real server start)
  if (connectWhatsApp) {
    whatsappService.initWhatsApp(io).catch((err) => {
      console.error('Falha ao iniciar Baileys automaticamente:', err);
    });
  }

  return new Promise((resolve) => {
    server.listen(port, () => {
      console.log(`🚀 Servidor Palavra do Dia rodando na porta ${port}`);
      resolve(server);
    });
  });
}

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  startServer(PORT, true);
}

module.exports = {
  app,
  server,
  io,
  startServer
};
