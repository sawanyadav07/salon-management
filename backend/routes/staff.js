const router = require('express').Router();
const auth = require('../middleware/auth');
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
router.get('/:id', auth, getStaffById);
router.post('/', auth, createStaff);
router.put('/:id', auth, updateStaff);
router.delete('/:id', auth, deactivateStaff);

module.exports = router;
