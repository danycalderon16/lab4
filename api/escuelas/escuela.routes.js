const express = require('express');
const bodyParser = require('body-parser');
const controller = require('./escuela.controller');

const router = express.Router()

router.get('/',controller.getAll);
router.get('/:nombre',controller.getOneByName);
// router.get('/:tipo',controller.getAllByType);
router.get('/trabajadores/docentes',controller.getDocentes)
router.get('/trabajadores/administradores',controller.getAdmons);

router.post('/crear',controller.create);

router.patch('/actualizar/:id',controller.update);

module.exports = router