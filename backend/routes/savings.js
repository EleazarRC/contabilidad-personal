const express = require('express');
const router = express.Router();
const savingsController = require('../controllers/savingsController');

// Rutas de cuentas
router.get('/', savingsController.getAllAccounts);
router.post('/', savingsController.createAccount);
router.put('/:id', savingsController.updateAccount);
router.delete('/:id', savingsController.deleteAccount);

// Resumen global
router.get('/summary', savingsController.getSummary);

// Rutas de movimientos
router.get('/:account_id/movements', savingsController.getMovements);
router.post('/movements', savingsController.createMovement);
router.delete('/movements/:id', savingsController.deleteMovement);

module.exports = router;
