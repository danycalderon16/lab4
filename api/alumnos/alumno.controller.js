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
            if (err || alumno===null) { return res.send('Alumno no encontrado. Error: '+err) }
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
                        { $push: { tutorados: newAlumno._id } }, (err,result) => {
                            console.log(result);
                            if (err) { return res.send(err) }
                        });
                    Escuela.updateOne(
                        { nombre: newAlumno.estudia },
                        {
                            $push: { alumnos: { idAlumno: newAlumno._id, fechaIngre: newAlumno.fechaIngre } }
                        }, function (err,result) {
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

exports.update = async (req,res)=>{
    try {
        const student = await Alumno.findById(req.params.id).exec();
        const newStudent = req.body;
        if('tutor' in newStudent){
            const newTutor = await Trabajador.findOne({ "nombre": newStudent.tutor }).exec();
            const oldTutor = await Trabajador.findOne({ "nombre": student.tutor }).exec();
            
            console.log("viejo",oldTutor.tutorados);
            console.log("nuevo",newTutor.tutorados);
            if(newTutor===null)
            return res.status(500).send('Tutor no encontrado');
            var index = oldTutor.tutorados.indexOf(student._id);
            if (index !== -1) {
                oldTutor.tutorados.splice(index, 1);
            }
            newTutor.tutorados.push(student._id);
            Object.assign(oldTutor,oldTutor.tutorados)
            Object.assign(newTutor,newTutor.tutorados)
            oldTutor.save();
            newTutor.save();
            console.log("viejo",oldTutor.tutorados);
            console.log("nuevo",newTutor.tutorados);
            // console.log(student);
            Object.assign(student,req.body);
            // console.log(student);
            student.save();
            return res.send({data:student});
        }
    } catch (error) {
        res.status(404).send('Alumno no encontrado\n'+error.message);        
    }
};