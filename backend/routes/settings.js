const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');

router.get('/stats', settingsController.getDataStats);
router.post('/delete-all', settingsController.deleteAllData);
router.get('/backup', settingsController.backupDatabase);

module.exports = router;
