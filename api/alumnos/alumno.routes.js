const express = require('express');
const controller = require('./alumno.controller');

// Middleware-use

const router = express.Router()

router.get('/',controller.getAll);
router.get('/:nombre',controller.getOneByName);
router.post('/crear',controller.create);
router.patch('/actualizar/:id',controller.update);

module.exports = router