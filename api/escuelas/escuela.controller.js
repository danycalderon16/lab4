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
        Escuela.findOne({ "nombre": req.params.nombre }, (err, escuela) => {
            if (err || escuela === null) { return res.status(404).send("Escuela no encontrada. Error:" + err) }
             res.status(200).json(escuela); 
        })
    } catch (error) {
        res.status(404).send("Hubo un error " + error.message);
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
        const newEscuela = {
            _id: new mongoose.Types.ObjectId(),
            nombre: req.body.nombre,
            clave: req.body.clave,
            direccion: req.body.direccion,
            ciudad: req.body.ciudad,
            administrativos: req.body.administrativos,
            docentes: req.body.docentes,
            mantenimiento: req.body.mantenimiento,
            alumnos: req.body.alumnos,
            enabled: req.body.enabled,
        }

        Escuela.findOne({ "clave": req.body.clave }, (err, escuela) => {
            if (escuela !== null) { 
                return res.status(403).send(`Escuela con clave ${req.body.clave} ya existe`) ;
            }             
            Escuela.create(newEscuela, (err) => {
                if (err) {
                    return res.send(err);
                }
                return res.status(201).json(newEscuela);
            });
        });
    } catch (error) {
        res.status(404).send(error.message);
    }
});

exports.update = async(req,res)=>{
    try {
        const school = await Escuela.findById(req.params.id).exec();
        const newSchool = req.body;

        if("alumnos" in newSchool){
            return res.status(403).send('No se puede actulizar la lista de alumnos directamente');
        }
        if("docentes" in newSchool ||"administrativos" in newSchool ||"mantenimiento" in newSchool){
            return res.status(403).send('No se puede actulizar la lista de trabajadores directamente');
        }

        Object.assign(school,req.body);
        school.save();
        return res.send({data:school,newData:newSchool});
        
    } catch (error) {
        res.status(404).send('Escuela no encontrada\n'+error);    
        
    }
}