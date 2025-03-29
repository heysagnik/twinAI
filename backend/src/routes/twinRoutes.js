const express = require('express');
const router = express.Router();
const TwinController = require('../controllers/twinController');

const twinController = new TwinController();

// Route to create a digital twin
router.post('/create', twinController.createDigitalTwin);

// Route to retrieve digital twin data
router.get('/:userId', twinController.getDigitalTwin);

// Route to update digital twin data
router.put('/:userId', twinController.updateDigitalTwin);

// Route to delete a digital twin
router.delete('/:userId', twinController.deleteDigitalTwin);

// Route to learn from user behavior
router.post('/:userId/learn', twinController.learnFromUserBehavior);

module.exports = router;