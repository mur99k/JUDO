const express = require('express');
const router = express.Router();
const SubscriptionController = require('../controllers/subscription.controller');
const { requireAdmin, requireAdminOrCoach } = require('../middleware/auth');

router.get('/summary', requireAdminOrCoach, SubscriptionController.stats);

router.use(requireAdmin);

router.get('/', SubscriptionController.list);
router.get('/:id', SubscriptionController.getById);
router.post('/', SubscriptionController.create);
router.put('/:id', SubscriptionController.update);
router.delete('/:id', SubscriptionController.delete);

module.exports = router;
