const router = require('express').Router();
const auth = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { validate } = require('../validation/validate');
const { commonSchemas } = require('../validation/commonSchemas');
const { customerPortalSchemas } = require('../validation/customerPortalSchemas');
const {
  getServices,
  getStaff,
  getAvailability,
  getMyAppointments,
  bookAppointment,
  cancelMyAppointment
} = require('../controllers/customerPortal.controller');

router.get('/services', getServices);
router.get('/staff', getStaff);
router.get('/availability', validate({ query: customerPortalSchemas.availabilityQuery }), getAvailability);

router.get('/appointments', auth, authorize('customer'), getMyAppointments);
router.post(
  '/appointments',
  auth,
  authorize('customer'),
  validate({ body: customerPortalSchemas.createAppointmentBody }),
  bookAppointment
);
router.put(
  '/appointments/:id/cancel',
  auth,
  authorize('customer'),
  validate({ params: commonSchemas.idParam, body: customerPortalSchemas.cancelAppointmentBody }),
  cancelMyAppointment
);

module.exports = router;
