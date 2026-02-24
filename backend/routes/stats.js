const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');

router.get('/monthly', statsController.getMonthlySummary);
router.get('/annual', statsController.getAnnualSummary);
router.get('/years', statsController.getAvailableYears);
router.get('/calendar', statsController.getCalendarData);
router.get('/upcoming-forecasts', statsController.getUpcomingForecasts);
router.get('/daily-balance', statsController.getDailyBalance);

module.exports = router;
