const router = require('express').Router();
const auth = require('../middleware/auth');
const { getStats } = require('../controllers/dashboard.controller');

router.get('/stats', auth, getStats);

module.exports = router;
