const express = require('express');
const router = express.Router();
const controller = require('../controllers/riwayatController');
const { validateRiwayat, validateMongoId } = require('../middleware/validation');

router.get('/', controller.getAll);
router.get('/:id', validateMongoId, controller.getById);
router.get('/komponen/:komponenId', validateMongoId, controller.getByKomponen);
router.post('/', validateRiwayat, controller.create);
router.put('/:id', validateMongoId, validateRiwayat, controller.update);
router.delete('/:id', validateMongoId, controller.delete);

module.exports = router;
