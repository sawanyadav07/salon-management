const router = require('express').Router();
const auth = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { listInventory, createInventoryItem, updateInventoryItem, deleteInventoryItem } = require('../controllers/inventory.controller');

router.use(auth, authorize('admin'));
router.get('/', listInventory);
router.post('/', createInventoryItem);
router.put('/:id', updateInventoryItem);
router.delete('/:id', deleteInventoryItem);
module.exports = router;
