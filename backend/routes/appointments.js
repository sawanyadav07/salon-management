const router = require('express').Router();
const auth = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { validate } = require('../validation/validate');
const { commonSchemas } = require('../validation/commonSchemas');
const { appointmentSchemas } = require('../validation/appointmentSchemas');
const {
  getAppointments,
  getAppointment,
  createAppointment,
  updateAppointment,
  deleteAppointment
} = require('../controllers/appointment.controller');

router.get('/', auth, authorize('admin', 'receptionist'), validate({ query: appointmentSchemas.listQuery }), getAppointments);
router.get('/:id', auth, authorize('admin', 'receptionist'), validate({ params: commonSchemas.idParam }), getAppointment);
router.post('/', auth, authorize('admin', 'receptionist'), validate({ body: appointmentSchemas.createBody }), createAppointment);
router.put('/:id', auth, authorize('admin', 'receptionist'), validate({ params: commonSchemas.idParam, body: appointmentSchemas.updateBody }), updateAppointment);
router.delete('/:id', auth, authorize('admin', 'receptionist'), validate({ params: commonSchemas.idParam }), deleteAppointment);

module.exports = router;
