const router = require('express').Router();
const { register, login } = require('../controllers/auth.controller');
const { validate } = require('../validation/validate');
const { authSchemas } = require('../validation/authSchemas');

router.post('/register', validate({ body: authSchemas.registerBody }), register);
router.post('/login', validate({ body: authSchemas.loginBody }), login);

module.exports = router;
