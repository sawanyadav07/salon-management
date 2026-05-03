const router = require('express').Router();
const auth = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
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

router.get('/', auth, authorize('admin', 'receptionist'), getStaff);
router.get('/all', auth, authorize('admin', 'receptionist'), getAllStaff);
router.get('/:id', auth, authorize('admin', 'receptionist'), validate({ params: commonSchemas.idParam }), getStaffById);
router.post('/', auth, authorize('admin', 'receptionist'), validate({ body: staffSchemas.createBody }), createStaff);
router.put('/:id', auth, authorize('admin', 'receptionist'), validate({ params: commonSchemas.idParam, body: staffSchemas.updateBody }), updateStaff);
router.delete('/:id', auth, authorize('admin', 'receptionist'), validate({ params: commonSchemas.idParam }), deactivateStaff);

module.exports = router;
