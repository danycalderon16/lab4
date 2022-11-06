const Alumno = require('../alumnos/alumno.model');
const Trabajador = require('../trabajadores/trabajador.model');
const Escuela = require('./escuela.model');
const mongoose = require('mongoose');

exports.getAll = ((req, res) => {
    Escuela
        .find().
        then((data) => {
            res.json(data);
            res.status(200);
        })
        .catch((error) => res.status(404).json({ message: error }));
});

exports.getOneByName = ((req, res,) => {
    try {
        Escuela.findOne({ "nombre": req.params.nombre }, (err, alumno) => {
            if (err) { res.send(err) }
            res.status(200).json(alumno);
        })
    } catch (error) {
        res.status(404).send(error.message);
    }
});

// exports.getAllByType = ((req, res) => {
//     const tipo = req.params.tipo;
//     res.json({ msg: `GET /escuelas con personal ${tipo}` });
// });

exports.getDocentes = ((req, res,) => {
    Escuela
        .aggregate([
            {
                $lookup:
                {
                    from: "trabajadores",
                    localField: "docentes",
                    foreignField: "nombre",
                    as: "docentes"
                }
            },
            {
                $project: {
                    "trabajan": 0,
                    "alumnos": 0,
                    "mantenimiento": 0,
                    "administrativos": 0
                }
            }
        ])
        .then((data) => {
            res.json(data);
            res.status(200);
        })
        .catch((error) => res.status(404).json({ message: error }));
});

exports.create = ((req, res) => {
    try {        
        const escuela = {
            _id: new mongoose.Types.ObjectId(),
            nombre: req.body.nombre,
            clave: req.body.clave,
            direccion:req.body.direccion,
            ciudad:req.body.ciudad,
            administrativos: req.body.administrativos,
            docentes: req.body.docentes,
            mantenimiento: req.body.mantenimiento,
            alumnos: req.body.alumnos
        }
        
        console.log(escuela);
        Escuela.create(escuela, (err) => {
            if (err) {
                res.send(err);
            }
            return res.status(201).json(escuela);
        });
    } catch (error) {        
        res.status(404).send(error.message);
    }
});