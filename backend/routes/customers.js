const router = require('express').Router();
const auth = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { validate } = require('../validation/validate');
const { commonSchemas } = require('../validation/commonSchemas');
const { customerSchemas } = require('../validation/customerSchemas');
const {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer
} = require('../controllers/customer.controller');

router.get('/', auth, authorize('admin', 'receptionist'), validate({ query: customerSchemas.listQuery }), getCustomers);
router.get('/:id', auth, authorize('admin', 'receptionist'), validate({ params: commonSchemas.idParam }), getCustomer);
router.post('/', auth, authorize('admin', 'receptionist'), validate({ body: customerSchemas.createBody }), createCustomer);
router.put('/:id', auth, authorize('admin', 'receptionist'), validate({ params: commonSchemas.idParam, body: customerSchemas.updateBody }), updateCustomer);
router.delete('/:id', auth, authorize('admin', 'receptionist'), validate({ params: commonSchemas.idParam }), deleteCustomer);

module.exports = router;
