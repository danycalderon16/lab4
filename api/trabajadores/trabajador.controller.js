const Trabajador = require('./trabajador.model');
const mongoose = require('mongoose');
var bodyParser = require('body-parser');
const Escuela = require('../escuelas/escuela.model');

let jsonParser = bodyParser.json()

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
            if (err || trabajador===null) { return res.send('Trabajador no encontrado. Error: '+err) }
            res.status(200).json(trabajador);
        })
    } catch (error) {
        res.status(404).send(error.message);
    }
});

exports.getAllBySchool = ((req, res) => {
    try {
        Trabajador.find({ "trabajaEn": req.params.claveEscuela }, (err, trabajador) => {
            if (err) { res.send(err) }
            res.status(200).json(trabajador);
        })
    } catch (error) {
        res.status(404).send(error.message);
    }
});

exports.create = (jsonParser,(req,res)=>{
    try {
        let newTrabajador = req.body;
        newTrabajador._id =  new mongoose.Types.ObjectId();
        Escuela.findOne({clave:newTrabajador.trabajaEn}, (err, escuela) => {
            if (escuela == null) {
                return res.status(500).send('Escuela no encontrada');
            }
            Trabajador.findOne({"curp":newTrabajador.curp}, (err, trabajador) => {
            
                if (trabajador!==null) {
                    return res.status(403).send(`El trabajador con CURP ${newTrabajador.curp} ya existe.`) 
                }                
                Trabajador.create(newTrabajador,  (err) => {
                    if (err) {
                        return res.send(err);
                    }
                    if(newTrabajador.tipo==='Administrativo'){
                        Escuela.updateOne(
                            {clave:newTrabajador.trabajaEn},
                            {$push: {'administrativos':newTrabajador.nombre}},  (err) =>{
                                if (err) return res.send(err);
                            });
                    }
                    if(newTrabajador.tipo==='Mantenimiento'){
                        Escuela.updateOne(
                            {clave:newTrabajador.trabajaEn},
                            {$push: {'mantenimiento':newTrabajador.nombre}},  (err) =>{
                                if (err) return res.send(err);
                            });
                    }
                    if(newTrabajador.tipo==='Docente'){
                        Escuela.updateOne(
                            {clave:newTrabajador.trabajaEn},
                            {$push: {'docentes':newTrabajador.nombre}},  (err) =>{
                                if (err) return res.send(err);
                            });
                    }            
                    return res.status(201).json(newTrabajador);
                });         
            });
        });       
    } catch (error) {
        res.status(404).send(error.message);
    }
});