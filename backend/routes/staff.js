const router = require('express').Router();
const auth = require('../middleware/auth');
const { validate } = require('../validation/validate');
const { commonSchemas } = require('../validation/commonSchemas');
const { staffSchemas } = require('../validation/staffSchemas');
const {
  getStaff,
  getAllStaff,
  getStaffById,
  createStaff,
  updateStaff,
  deactivateStaff
} = require('../controllers/staff.controller');

router.get('/', auth, getStaff);
router.get('/all', auth, getAllStaff);
router.get('/:id', auth, validate({ params: commonSchemas.idParam }), getStaffById);
router.post('/', auth, validate({ body: staffSchemas.createBody }), createStaff);
router.put('/:id', auth, validate({ params: commonSchemas.idParam, body: staffSchemas.updateBody }), updateStaff);
router.delete('/:id', auth, validate({ params: commonSchemas.idParam }), deactivateStaff);

module.exports = router;
