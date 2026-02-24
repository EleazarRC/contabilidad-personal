const express = require('express');
const router = express.Router();
const forecastController = require('../controllers/forecastController');

router.get('/', forecastController.getAllForecasts);
router.get('/summary', forecastController.getForecastSummary);
router.get('/:id', forecastController.getForecastById);
router.post('/', forecastController.createForecast);
router.put('/:id', forecastController.updateForecast);
router.patch('/:id/toggle', forecastController.toggleCompleted);
router.delete('/:id', forecastController.deleteForecast);

module.exports = router;
