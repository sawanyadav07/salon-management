const router = require('express').Router();
const auth = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { askAssistant } = require('../controllers/adminAssistant.controller');

router.post('/chat', auth, authorize('admin', 'receptionist'), askAssistant);

module.exports = router;
