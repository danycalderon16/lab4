const Alumno = require('./alumno.model');
const Trabajador = require('../trabajadores/trabajador.model');
const Escuela = require('../escuelas/escuela.model');
const mongoose = require('mongoose');

exports.getAll = ((req, res,) => {
    console.log("hola");
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
            if (err) { res.send(err) }
            res.status(200).json(alumno);
        })
    } catch (error) {
        res.status(404).send(error.message);
    }
});

exports.create = ((req, res) => {
    const alumno = {
        _id: new mongoose.Types.ObjectId(),
        nombre: req.body.nombre,
        fechaNac: req.body.fechaNac,
        curp: req.body.curp,
        tutor: req.body.tutor,
        estudia: req.body.estudia,
        fechaIngre: req.body.fechaIngre
    };
    try {
        Trabajador.findOne({ "nombre": alumno.tutor }, (err, tutor) => {
            if (err) { res.send(err) }
            // res.status(200).json(tutor);
            if (tutor == null) {
                res.status(500).send('Tutor no encontrado');
            }
            Escuela.findOne({ "nombre": alumno.estudia }, (err, escuela) => {
                if (escuela == null) {
                    res.status(500).
                        send('Escuela no encontrada');
                }
                Trabajador.updateOne(
                        { nombre: alumno.tutor },
                        { $push: { tutorados: alumno.nombre }},(err,result)=>{
                            if (err) { res.send(err) }
                        }
                    )

                Escuela.updateOne(
                    { nombre: alumno.estudia },
                    {
                        $push: {
                            alumnos: { nombre: alumno.nombre, fechaIngre: alumno.fechaIngre }
                        }
                    }, function (err, result) {
                        if (err) return res.send(err);
                    });

                Alumno.create(alumno, (err) => {
                    if (err) {
                        res.send(err);
                    }
                    return res.status(201).json(alumno);
                }
                );
            });

        })
    } catch (error) {
        res.status(404).send(error.message);
    }
});