const Alumno = require('../alumnos/alumno.model');
const Trabajador = require('./trabajador.model');
const Escuela = require('../escuelas/escuela.model');
const mongoose = require('mongoose');

exports.getAll = ((req, res,) => {
    Trabajador
        .find()
        .then((data) => {
            res.json(data);
            res.status(200);
        })
        .catch((error) => res.status(404).json({ message: error }));
});

exports.getOneByName = ((req, res,) => {
    try {
        Trabajador.findOne({ "nombre": req.params.nombre }, (err, trabajador) => {
            if (err) { res.send(err) }
            res.status(200).json(trabajador);
        })
    } catch (error) {
        res.status(404).send(error.message);
    }
});

exports.getAllBySchool = ((req, res,) => {
    console.log("hola");
    console.log(req.params.claveEscuela);
    try {
        Trabajador.find({ "trabajaEn": req.params.claveEscuela }, (err, trabajador) => {
            if (err) { res.send(err) }
            res.status(200).json(trabajador);
        })
    } catch (error) {
        res.status(404).send(error.message);
    }
});