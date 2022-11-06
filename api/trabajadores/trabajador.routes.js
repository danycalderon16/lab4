const { Router } = require('express');
const express = require('express');
const controller = require('./trabajador.controller');

const router = express.Router()

router.get('/', controller.getAll);
router.get('/nombre/:nombre',controller.getOneByName);
router.get('/clave/:claveEscuela',controller.getAllBySchool);
router.post('/crear',controller.create);

module.exports = router