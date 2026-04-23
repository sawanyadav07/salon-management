const router = require('express').Router();
const auth = require('../middleware/auth');
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

router.get('/', auth, validate({ query: customerSchemas.listQuery }), getCustomers);
router.get('/:id', auth, validate({ params: commonSchemas.idParam }), getCustomer);
router.post('/', auth, validate({ body: customerSchemas.createBody }), createCustomer);
router.put('/:id', auth, validate({ params: commonSchemas.idParam, body: customerSchemas.updateBody }), updateCustomer);
router.delete('/:id', auth, validate({ params: commonSchemas.idParam }), deleteCustomer);

module.exports = router;
