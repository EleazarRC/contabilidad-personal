require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./config/database');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Rutas
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

// Manejo de errores 404
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
