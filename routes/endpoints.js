const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const trabajadorSchema = require('../api/trabajadores/trabajador.model');
const escuelaSchema = require('../api/escuelas/escuela.model');

// Middleware-use

const router = express.Router()

router.use((req, res, next) => {
    console.log('--> Middleware en endpoints.js')
    next();
})

// Rutas
router.get('/', (req, res) => {
    res.json({ msg: 'Probando API - Ok' });
})

/** ESCUELAS  **/

/** TRABAJDOR **/
router.post('/trabajadores/', (req, res) => {
    const trabajador = trabajadorSchema(req.body);
    trabajador.save()
        .then((data) => res.json(data))
        .catch((error) => res.json({ message: error }));
});

//ok


router.route('/trabajador/:tipo')
    .post((req, res,) => {
        const { tipo } = req.params
        res.json({ msg: `POST Se ha creado un trabajor como: ${tipo}` });
    });

router.route('/trabajador/:tipo')
    .put((req, res,) => {
        const { tipo } = req.params
        res.json({ msg: `POST Se ha actualizado un trabajor como: ${tipo}` });
    });
router.route('/trabajador/:tipo')
    .delete((req, res,) => {
        const { tipo } = req.params
        res.json({ msg: `DELETE Se ha eliminado  un trabajor como: ${tipo}` });
    });

/** DOCENTES **/

router.route('/docentes/:docente/tutorados')
    .get((req, res) => {
        const { docente } = req.params
        res.json({ msg: `GET /Docente ${docente} con tutorados` })
    });



module.exports = router