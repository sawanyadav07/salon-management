const router = require('express').Router();
const auth = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { validate } = require('../validation/validate');
const { commonSchemas } = require('../validation/commonSchemas');
const { serviceSchemas } = require('../validation/serviceSchemas');
const {
  getServices,
  getAllServices,
  getService,
  createService,
  updateService,
  deactivateService
} = require('../controllers/service.controller');

router.get('/', auth, authorize('admin', 'receptionist'), validate({ query: serviceSchemas.listQuery }), getServices);
router.get('/all', auth, authorize('admin', 'receptionist'), getAllServices);
router.get('/:id', auth, authorize('admin', 'receptionist'), validate({ params: commonSchemas.idParam }), getService);
router.post('/', auth, authorize('admin', 'receptionist'), validate({ body: serviceSchemas.createBody }), createService);
router.put('/:id', auth, authorize('admin', 'receptionist'), validate({ params: commonSchemas.idParam, body: serviceSchemas.updateBody }), updateService);
router.delete('/:id', auth, authorize('admin', 'receptionist'), validate({ params: commonSchemas.idParam }), deactivateService);

module.exports = router;
