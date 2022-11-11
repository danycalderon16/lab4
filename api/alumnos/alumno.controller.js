const Alumno = require('./alumno.model');
const Trabajador = require('../trabajadores/trabajador.model');
const Escuela = require('../escuelas/escuela.model');
const mongoose = require('mongoose');
const { ObjectID } = require('mongodb');

const redis = require("redis");

let redisClient;

(async () => {
    redisClient = redis.createClient({
        host: "127.0.0.1",
        port: 6379,
    });

    redisClient.on("error", (error) => console.error(`Error : ${error}`));

    await redisClient.connect();
})();

exports.getAll = async (req, res) => {
    let results;
    let isCached = false;
    const cacheResults = await redisClient.get("alumnos");
    if (cacheResults) {
        isCached = true;
        results = JSON.parse(cacheResults);
        return res.send({
            fromCache: isCached,
            data: results,
        });
    } else {
        Alumno.find({}, async (err, data) => {
            const stringData = JSON.stringify(data);
            redisClient.set("GET:ALUMNOS:09-11-22", "09-11-22", (err, reply) => {
                if (err) return res.status(404).send(err);
            });
            return res.status(201).send({
                fromCache: isCached,
                data: data,
            });
        });
    }
};

exports.getOneByName = async (req, res,) => {
    try {
        const nombre = req.params.nombre;
        let results;
        let isCached = false;
        const cacheResults = await redisClient.get(`alumnos:${nombre}`);
        if (cacheResults) {
            isCached = true;
            results = JSON.parse(cacheResults);
            return res.send({
                fromCache: isCached,
                data: results,
            });
        } else {
            Alumno.findOne({ "nombre": nombre }, (err, alumno) => {
                const stringData = JSON.stringify(alumno);
                redisClient.set(`GET:ALUMNOS:${nombre}:09-11-22`,"09-11-22", (err, reply) => {
                    if (err) return res.status(404).send(err);
                });
                if (err || alumno === null) { return res.send('Alumno no encontrado. Error: ' + err) }
                return res.status(201).send({
                    fromCache: isCached,
                    data: alumno,
                });
            });
        }
    } catch (error) {
        res.status(404).send("Hubo un error " + error.message);
    }

};

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
            if (alumno != null) {
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
                    //let id = new mongoose.Types.ObjectID(newAlumno._id)
                    Trabajador.updateOne(
                        { nombre: newAlumno.tutor },
                        { $push: { tutorados: newAlumno._id } }, (err, result) => {
                            if (err) { return res.send(err) }
                        });
                    Escuela.updateOne(
                        { nombre: newAlumno.estudia },
                        {
                            $push: { alumnos: { idAlumno: newAlumno._id, fechaIngre: newAlumno.fechaIngre } }
                        }, function (err, result) {
                            if (err) return res.send(err);
                        });
                    Alumno.create(newAlumno, (err) => {
                        if (err) {
                            return res.send(err);
                        }
                        redisClient.set(`CREATE:ALUMNOS:${newAlumno.nombre}:09-11-22`,"09-11-22", (err, reply) => {
                            if (err) return res.status(404).send(err);
                        });
                        redisClient.del('alumnos')
                        redisClient.del('escuelas')
                        redisClient.del(`escuelas:${newAlumno.estudia}`)
                        redisClient.del('trabajadores');
                        redisClient.del(`trabajadores:${newAlumno.tutor}`);
                        redisClient.del(`docentes:tutorados:${newAlumno.tutor}`)
                        return res.status(201).json(newAlumno);
                    });

                });
            });

        })
    } catch (error) {
        res.status(404).send(error.message);
    }
});

exports.update = async (req, res) => {
    try {
        const student = await Alumno.findById(req.params.id).exec();
        const newStudent = req.body;

        let oldTutor = {};
        let newTutor = {};

        let updateTutor = false;
        let updateSchool = false;

        let oldSchool = {};
        let newSchool = {};

        console.log(student);

        if ('tutor' in newStudent) {
            newTutor = await Trabajador.findOne({ "nombre": newStudent.tutor }).exec();
            if (newTutor === null)
                return res.status(500).send('Tutor no encontrado');
            oldTutor = await Trabajador.findOne({ "nombre": student.tutor }).exec();
            updateTutor = true;
        }

        if ('estudia' in newStudent) {
            newSchool = await Escuela.findOne({ "nombre": newStudent.estudia }).exec();
            if (newSchool === null) {
                return res.status(500).send('Escuela no encontrada')
            }
            oldSchool = await Escuela.findOne({ "nombre": student.estudia }).exec();
            updateSchool = true;
        }

        console.log(newSchool);

        if (updateTutor) {
            let index = oldTutor.tutorados.indexOf(student._id);
            if (index !== -1) {
                oldTutor.tutorados.splice(index, 1);
            }
            newTutor.tutorados.push(student._id);
            Object.assign(oldTutor, oldTutor.tutorados)
            Object.assign(newTutor, newTutor.tutorados)
            oldTutor.save();
            newTutor.save();

            redisClient.del(`trabajadores:${student.tutor}`);
            redisClient.del(`docentes:tutorados:${student.tutor}`)
            redisClient.del(`trabajadores:${newStudent.tutor}`);
            redisClient.del(`docentes:tutorados:${newStudent.tutor}`)
        }

        if (updateSchool) {
            console.log(oldSchool.nombre, oldSchool.alumnos);
            console.log('////////////////');
            const searchObject = oldSchool.alumnos.find((alumno) => alumno.idAlumno.toString() === student._id + "");
            const indexObject = oldSchool.alumnos.findIndex((alumno) => alumno.idAlumno.toString() === student._id + "");
            console.log(indexObject + '-' + searchObject);
            let auxNewObj = [];
            let auxOldObj = [];

            newSchool.alumnos.map(alumno => {
                auxNewObj.push(alumno);
            });
            oldSchool.alumnos.map(alumno => {
                auxOldObj.push(alumno);
            });
            auxNewObj.push(searchObject);

            if (auxOldObj.length === 1) {
                auxOldObj = [];
            } else {
                auxOldObj.splice(indexObject, 1);
            }

            oldSchool.alumnos = auxOldObj;
            newSchool.alumnos = auxNewObj;

            console.log(oldSchool.nombre, oldSchool.alumnos);
            console.log(newSchool.nombre, newSchool.alumnos);

            oldSchool.save();
            newSchool.save();

            
            redisClient.del(`escuelas:${student.estudia}`);
            redisClient.del(`escuelas:${newStudent.estudia}`);
        }
    
        redisClient.set(`UPDATE:ALUMNOS:${student.nombre}:09-11-22`,"09-11-22", (err, reply) => {
            if (err) return res.status(404).send(err);
        });
        Object.assign(student, req.body);
        redisClient.del("alumnos");
        student.save();
        redisClient.del('trabajadores');
        redisClient.del('alumnos')
        redisClient.del('escuelas')
        return res.send({ data: student });
    } catch (error) {
        res.status(404).send('Alumno no encontrado\n' + error);
    }
};