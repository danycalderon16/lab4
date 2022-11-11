const Trabajador = require('./trabajador.model');
const mongoose = require('mongoose');
var bodyParser = require('body-parser');
const Escuela = require('../escuelas/escuela.model');
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
const cacheResults = false;


let jsonParser = bodyParser.json()

exports.getAll = async (req, res) => {
    let results;
    let isCached = false;
    const cacheResults = await redisClient.get("trabajadores");
    if (cacheResults) {
        isCached = true;
        results = JSON.parse(cacheResults);
        return res.send({
            fromCache: isCached,
            data: results,
        });
    } else {
        Trabajador.find({}, async (err, data) => {
            const stringData = JSON.stringify(data);
            redisClient.set("GET:TRABAJADORES:09-11-22", '09-11-22', (err, reply) => {
                if (err) return res.status(404).send(err);
            });
            return res.status(201).send({
                fromCache: isCached,
                data: data,
            });
        });
    }
};

exports.getByNameWithTutorados = (async (req, res,) => {
    const name = req.params.nombre;
    let results;
    let isCached = false;
    const cacheResults = await redisClient.get(`docentes:tutorados:${name}`);
    if (cacheResults) {
        isCached = true;
        results = JSON.parse(cacheResults);
        return res.send({
            fromCache: isCached,
            data: results,
        });
    } else {
        Trabajador.aggregate([
            {
                "$lookup": {
                    "from": "alumnos",
                    "let": { "tutorados": "$tutorados" },
                    "pipeline": [
                        { "$match": { "$expr": { "$in": ["$_id", "$$tutorados"] } } }
                    ],
                    "as": "tutorados"
                }

            },
            { $match: { "nombre": name } }

        ])
            .then((data) => {
                const stringData = JSON.stringify(data);
                redisClient.set("GET:TRABAJADORES:09-11-22", '09-11-22', (err, reply) => {
                    if (err) return res.status(404).send(err);
                });
                return res.status(201).send({
                    fromCache: isCached,
                    data: data,
                });
            })
            .catch((error) => res.status(404).json({ message: error }));
    }
});

exports.getOneByName = (async(req, res,) => {
    const name = req.params.nombre;
    let results;
    let isCached = false;
    const cacheResults = await redisClient.get(`trabajadores:${name}`);
    if (cacheResults) {
        isCached = true;
        results = JSON.parse(cacheResults);
        return res.send({
            fromCache: isCached,
            data: results,
        });
    }
    try {
        Trabajador.findOne({ "nombre": req.params.nombre }, (err, trabajador) => {
            if (err || trabajador === null) { return res.send('Trabajador no encontrado. Error: ' + err) }
            const stringData = JSON.stringify(trabajador);
            redisClient.set("GET:TRABAJADORES:09-11-22", '09-11-22', (err, reply) => {
                if (err) return res.status(404).send(err);
            });
            return res.status(201).send({
                fromCache: isCached,
                data: trabajador,
            });
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

exports.create = (jsonParser, (req, res) => {
    try {
        let newTrabajador = req.body;
        newTrabajador._id = new mongoose.Types.ObjectId();
        Escuela.findOne({ clave: newTrabajador.trabajaEn }, (err, escuela) => {
            if (escuela == null) {
                return res.status(500).send('Escuela no encontrada');
            }
            Trabajador.findOne({ "curp": newTrabajador.curp }, (err, trabajador) => {

                if (trabajador !== null) {
                    return res.status(403).send(`El trabajador con CURP ${newTrabajador.curp} ya existe.`)
                }
                Trabajador.create(newTrabajador, (err) => {
                    if (err) {
                        return res.send(err);
                    }
                    if (newTrabajador.tipo === 'Administrativo') {
                        Escuela.updateOne(
                            { clave: newTrabajador.trabajaEn },
                            { $push: { 'administrativos': newTrabajador._id } }, (err) => {
                                if (err) return res.send(err);
                            });
                        redisClient.del('escuelas:administrativos')
                    }
                    if (newTrabajador.tipo === 'Mantenimiento') {
                        Escuela.updateOne(
                            { clave: newTrabajador.trabajaEn },
                            { $push: { 'mantenimiento': newTrabajador._id } }, (err) => {
                                if (err) return res.send(err);
                            });
                        redisClient.del('escuelas:mantenimiento')
                    }
                    if (newTrabajador.tipo === 'Docente') {
                        Escuela.updateOne(
                            { clave: newTrabajador.trabajaEn },
                            { $push: { docentes: newTrabajador._id } }, (err) => {
                                if (err) return res.send(err);
                            });
                        redisClient.del('escuelas:docentes')
                    }
                    redisClient.set(`CREATE:TRABAJADORES:09-11-22`, '09-11-22', (err, reply) => {
                        if (err) return res.status(404).send(err);
                    });
                    redisClient.del('trabajadores')
                    return res.status(201).json(newTrabajador);
                });
            });
        });
    } catch (error) {
        res.status(404).send(error.message);
    }
});

exports.update = async (req, res) => {
    // try {
    const worker = await Trabajador.findById(req.params.id).exec();
    const newWorker = req.body;

    let oldSchool = {};
    let newSchool = {};

    let updateSchool = false;

    console.log(worker);
    if ('trabajaEn' in newWorker) {
        newSchool = await Escuela.findOne({ "clave": newWorker.trabajaEn }).exec();
        oldSchool = await Escuela.findOne({ "clave": worker.trabajaEn }).exec();
        if (newSchool === null) {
            return res.status(500).send('Escuela no encontrada')
        }
        updateSchool = true;
    }
    console.log(oldSchool.nombre, oldSchool.docentes);
    console.log(newSchool.nombre, newSchool.docentes);

    let typeOfWorker = worker.tipo

    if (updateSchool) {
        if (typeOfWorker === 'Docente') {
            let index = oldSchool.docentes.indexOf(worker._id);
            if (index !== -1) {
                oldSchool.docentes.splice(index, 1);
            }
            newSchool.docentes.push(worker._id);
            Object.assign(oldSchool, oldSchool.docentes)
            Object.assign(newSchool, newSchool.docentes)
            oldSchool.save();
            newSchool.save();
        }
        redisClient.del(`escuelas:${worker.trabajaEn}`)
        redisClient.del(`escuelas:${newWorker.trabajaEn}`)
    }
    console.log(oldSchool.nombre, oldSchool.docentes);
    console.log(newSchool.nombre, newSchool.docentes);

    redisClient.set(`UPDATE:TRABAJADORES:09-11-22`, '09-11-22', (err, reply) => {
        if (err) return res.status(404).send(err);
    });

    redisClient.del(`trabajadores`)
    redisClient.del(`trabajadores:${worker.nombre}`)
    redisClient.del(`docentes:tutorados:${worker.nombre}`)

    Object.assign(worker, req.body);
    worker.save();
    res.status(201).json(worker);
    // } catch (error) {

    // }
};