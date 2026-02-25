require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./config/database');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Rutas API
app.use('/api/categories', require('./routes/categories'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/forecasts', require('./routes/forecasts'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/savings', require('./routes/savings'));
app.use('/api/debts', require('./routes/debts'));

// Ruta de prueba
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'API funcionando correctamente' });
});

// Servir frontend estático (producción / Electron)
const frontendDist = process.env.FRONTEND_DIST || path.join(__dirname, '..', 'frontend', 'dist');
app.use(express.static(frontendDist));

// SPA catch-all: cualquier ruta que no sea /api → index.html
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Ruta no encontrada' });
  }
  res.sendFile(path.join(frontendDist, 'index.html'));
});

// Función para arrancar el servidor (usada por Electron)
function startServer(port, callback) {
  const p = port || PORT;
  app.listen(p, () => {
    console.log(`Servidor corriendo en puerto ${p}`);
    if (callback) callback();
  });
}

// Si se ejecuta directamente (no desde Electron), arrancar automáticamente
if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
