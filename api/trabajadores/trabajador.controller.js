const Trabajador = require('./trabajador.model');
const mongoose = require('mongoose');
var bodyParser = require('body-parser')

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
            if (err) { res.send(err) }
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
        console.log(newTrabajador.curp);
        Trabajador.findOne({"curp":newTrabajador.curp}, (err, trabajador) => {
            console.log(trabajador);
            if (trabajador!==null) {
                return res.status(403).send(`El trabajador con CURP ${newTrabajador.curp} ya existe.`) 
            }    
            console.log(newTrabajador);
            Trabajador.create(newTrabajador,  (err) => {
                if (err) {
                    return res.send(err);
                }
                return res.status(201).json(newTrabajador);
            });         
        });
    } catch (error) {
        res.status(404).send(error.message);
    }
});