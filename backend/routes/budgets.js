const express = require('express');
const router = express.Router();
const controller = require('../controllers/budgetController');

router.get('/', controller.getAllBudgets);
router.post('/', controller.createBudget);
router.put('/:id', controller.updateBudget);
router.delete('/:id', controller.deleteBudget);
router.get('/results', controller.getMonthlyResults);

module.exports = router;
