const router = require('express').Router();

router.use('/auth', require('./auth'));
router.use('/customer-auth', require('./customerAuth'));
router.use('/customer', require('./customerPortal'));
router.use('/customers', require('./customers'));
router.use('/services', require('./services'));
router.use('/staff', require('./staff'));
router.use('/appointments', require('./appointments'));
router.use('/dashboard', require('./dashboard'));

module.exports = router;
