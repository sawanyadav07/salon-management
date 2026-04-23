const router = require('express').Router();
const auth = require('../middleware/auth');
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

router.get('/', auth, validate({ query: serviceSchemas.listQuery }), getServices);
router.get('/all', auth, getAllServices);
router.get('/:id', auth, validate({ params: commonSchemas.idParam }), getService);
router.post('/', auth, validate({ body: serviceSchemas.createBody }), createService);
router.put('/:id', auth, validate({ params: commonSchemas.idParam, body: serviceSchemas.updateBody }), updateService);
router.delete('/:id', auth, validate({ params: commonSchemas.idParam }), deactivateService);

module.exports = router;
