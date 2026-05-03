const router = require('express').Router();
const auth = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { getStats } = require('../controllers/dashboard.controller');

router.get('/stats', auth, authorize('admin', 'receptionist'), getStats);

module.exports = router;
