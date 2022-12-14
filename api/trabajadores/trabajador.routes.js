const { Router } = require('express');
const express = require('express');
const controller = require('./trabajador.controller');

const router = express.Router()

router.get('/', controller.getAll);
router.get('/nombre/:nombre',controller.getOneByName);
router.get('/docente/tutorados/:nombre',controller.getByNameWithTutorados);
router.get('/clave/:claveEscuela',controller.getAllBySchool);
router.post('/crear',controller.create);
router.patch('/actualizar/:id',controller.update);

module.exports = router