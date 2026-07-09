const express = require('express');
const router = express.Router();
const controller = require('../controllers/produkController');
const { validateProduk, validateMongoId } = require('../middleware/validation');

router.get('/', controller.getAll);
router.get('/:id', validateMongoId, controller.getById);
router.post('/', validateProduk, controller.create);
router.put('/:id', validateMongoId, validateProduk, controller.update);
router.delete('/:id', validateMongoId, controller.delete);

module.exports = router;
