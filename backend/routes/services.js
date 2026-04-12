const router = require('express').Router();
const auth = require('../middleware/auth');
const {
  getServices,
  getAllServices,
  getService,
  createService,
  updateService,
  deactivateService
} = require('../controllers/service.controller');

router.get('/', auth, getServices);
router.get('/all', auth, getAllServices);
router.get('/:id', auth, getService);
router.post('/', auth, createService);
router.put('/:id', auth, updateService);
router.delete('/:id', auth, deactivateService);

module.exports = router;
