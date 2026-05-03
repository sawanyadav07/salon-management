const router = require('express').Router();
const { validate } = require('../validation/validate');
const { customerPortalSchemas } = require('../validation/customerPortalSchemas');
const { signup, login } = require('../controllers/customerAuth.controller');

router.post('/signup', validate({ body: customerPortalSchemas.signupBody }), signup);
router.post('/login', validate({ body: customerPortalSchemas.loginBody }), login);

module.exports = router;
