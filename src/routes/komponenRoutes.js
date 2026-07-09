const express = require('express');
const router = express.Router();
const controller = require('../controllers/komponenController');
const { validateKomponen, validateMongoId } = require('../middleware/validation');

router.get('/', controller.getAll);
router.get('/:id', validateMongoId, controller.getById);
router.post('/', validateKomponen, controller.create);
router.put('/:id', validateMongoId, validateKomponen, controller.update);
router.delete('/:id', validateMongoId, controller.delete);

module.exports = router;
