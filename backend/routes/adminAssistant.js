const router = require('express').Router();
const auth = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { askAssistant, getAssistantStatus } = require('../controllers/adminAssistant.controller');

router.get('/status', auth, authorize('admin', 'receptionist'), getAssistantStatus);
router.post('/chat', auth, authorize('admin', 'receptionist'), askAssistant);

module.exports = router;
