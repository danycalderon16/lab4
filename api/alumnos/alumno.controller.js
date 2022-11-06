const Alumno = require('./alumno.model');
const Trabajador = require('../trabajadores/trabajador.model');
const Escuela = require('../escuelas/escuela.model');
const mongoose = require('mongoose');

exports.getAll = ((req, res,) => {
    try {
        Alumno.find((err, alumnos) => {
            if (err) { res.send(err) }
            res.status(200).json(alumnos);
        })
    } catch (error) {
        res.status(404).send(error.message);
    }
});

exports.getOneByName = ((req, res,) => {
    try {
        Alumno.findOne({ "nombre": req.params.nombre }, (err, alumno) => {
            if (err) { return res.send(err) }
            return res.status(200).json(alumno);
        });
    } catch (error) {
        res.status(404).send(error.message);
    }
});

exports.create = ((req, res) => {
    const newAlumno = {
        _id: new mongoose.Types.ObjectId(),
        nombre: req.body.nombre,
        fechaNac: req.body.fechaNac,
        curp: req.body.curp,
        tutor: req.body.tutor,
        estudia: req.body.estudia,
        fechaIngre: req.body.fechaIngre,
        enabled: req.body.enabled,
    };
    try {
        Alumno.findOne({ "curp": req.body.curp }, (err, alumno) => {
            console.log(alumno);
            if (alumno!=null) { 
                return res.status(403).send(`El alumno con CURP ${req.body.curp} ya existe`);
            }                   
            Trabajador.findOne({ "nombre": newAlumno.tutor }, (err, tutor) => {
                if (err) { return res.send(err) }
                // res.status(200).json(tutor);
                if (tutor == null) {
                    return res.status(500).send('Tutor no encontrado');
                }
                Escuela.findOne({ "nombre": newAlumno.estudia }, (err, escuela) => {
                    if (escuela == null) {
                        return res.status(500).send('Escuela no encontrada');
                    }

                    Trabajador.updateOne(
                        { nombre: newAlumno.tutor },
                        { $push: { tutorados: newAlumno.nombre } }, (err) => {
                            if (err) { return res.send(err) }
                        });
                    Escuela.updateOne(
                        { nombre: newAlumno.estudia },
                        {
                            $push: { alumnos: { nombre: newAlumno.nombre, fechaIngre: newAlumno.fechaIngre } }
                        }, function (err) {
                            if (err) return res.send(err);
                        });
                    Alumno.create(newAlumno, (err) => {
                        if (err) {
                            return res.send(err);
                        }
                        return res.status(201).json(newAlumno);
                    });

                });
            });

        })
    } catch (error) {
        res.status(404).send(error.message);
    }
});