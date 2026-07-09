const express = require('express');
const router = express.Router();
const controller = require('../controllers/hpeController');

router.get('/:produkId', controller.calculateHPE);

module.exports = router;
