const express = require('express');
const router = express.Router();
const debtsController = require('../controllers/debtsController');

// Rutas de deudas
router.get('/', debtsController.getAllDebts);
router.post('/', debtsController.createDebt);
router.put('/:id', debtsController.updateDebt);
router.delete('/:id', debtsController.deleteDebt);

// Resumen global
router.get('/summary', debtsController.getSummary);

// Rutas de pagos
router.get('/:debt_id/payments', debtsController.getPayments);
router.post('/payments', debtsController.createPayment);
router.delete('/payments/:id', debtsController.deletePayment);

module.exports = router;
