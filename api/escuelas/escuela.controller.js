const Alumno = require('../alumnos/alumno.model');
const Trabajador = require('../trabajadores/trabajador.model');
const Escuela = require('./escuela.model');
const mongoose = require('mongoose');
const redis = require("redis");

let redisClient;

let today = new Date();
let date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();

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
    const cacheResults = await redisClient.get("escuelas");
    if (cacheResults) {
        isCached = true;
        results = JSON.parse(cacheResults);
        return res.send({
            fromCache: isCached,
            data: results,
        });
    } else {
        Escuela.find({}, async (err, data) => {
            const stringData = JSON.stringify(data);
            redisClient.set("GET:ESCUELAS:"+date, date, (err, reply) => {
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
        const cacheResults = await redisClient.get(`escuelas:${nombre}`);
        if (cacheResults) {
            isCached = true;
            results = JSON.parse(cacheResults);
            return res.send({
                fromCache: isCached,
                data: results,
            });
        } else {
            Escuela.findOne({ "nombre": nombre }, (err, escuela) => {
                const stringData = JSON.stringify(escuela);
                redisClient.set(`GET:ESCUELAS:${nombre}:09-11-22`, '09-11-22', (err, reply) => {
                    if (err) return res.status(404).send(err);
                });
                if (err || escuela === null) { return res.status(404).send("Escuela no encontrada. Error:" + err) }
                return res.status(201).send({
                    fromCache: isCached,
                    data: escuela,
                });
            });
        }
    } catch (error) {
        res.status(404).send("Hubo un error " + error.message);
    }
};

// exports.getAllByType = ((req, res) => {
//     const tipo = req.params.tipo;
//     res.json({ msg: `GET /escuelas con personal ${tipo}` });
// });

exports.getDocentes = async (req, res,) => {
    console.log("hola");
    let results;
    let isCached = false;
    const cacheResults = await redisClient.get("escuelas:docentes");
    if (cacheResults) {
        isCached = true;
        results = JSON.parse(cacheResults);
        return res.send({
            fromCache: isCached,
            data: results,
        });
    } else {
        Escuela
            .aggregate([
                {
                    "$lookup": {
                        "from": "trabajadores",
                        "let": { "docentes": "$docentes" },
                        "pipeline": [
                            { "$match": { "$expr": { "$in": ["$_id", "$$docentes"] } } }
                        ],
                        "as": "docentes"
                    }
                },{
                    $project: {
                        "trabajan": 0,
                        "alumnos": 0,
                        "mantenimiento": 0,
                        "administrativos": 0
                    }
                }
            ])
            .then((data) => {
                const stringData = JSON.stringify(data);
                redisClient.set("GET:DOCENTES:"+date, '09-11-22', (err, reply) => {
                    if (err) return res.status(404).send(err);
                });
                return res.status(201).send({
                    fromCache: isCached,
                    data: data,
                });
            })
            .catch((error) => res.status(404).json({ message: error }));
    }
};

exports.getAdmons = async (req, res,) => {
    let results;
    let isCached = false;
    const cacheResults = await redisClient.get("escuelas:administradores");
    if (cacheResults) {
        isCached = true;
        results = JSON.parse(cacheResults);
        return res.send({
            fromCache: isCached,
            data: results,
        });
    } else {
        Trabajador
            .aggregate([
                {
                    $lookup:
                        {
                            from: "escuelas",
                            localField: "trabajaEn",
                            foreignField: "clave",
                            as: "centroDeTrabajo"
                        }
                },
                {$match:{"tipo":"Administrativo"}}
            ])
            .then((data) => {
                const stringData = JSON.stringify(data);
                redisClient.set("GET:ADMINISTRADORES:"+date, '09-11-22', (err, reply) => {
                    if (err) return res.status(404).send(err);
                });
                return res.status(201).send({
                    fromCache: isCached,
                    data: data,
                });
            })
            .catch((error) => res.status(404).json({ message: error }));
    }
};

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
                return res.status(403).send(`Escuela con clave ${req.body.clave} ya existe`);
            }
            Escuela.create(newEscuela, (err) => {
                if (err) {
                    return res.send(err);
                }
                redisClient.set("CREATE:ESCUELAS:"+date, '09-11-22', (err, reply) => {
                    if (err) return res.status(404).send(err);
                });             
                return res.status(201).json(newEscuela);
            });
        });
    } catch (error) {
        res.status(404).send(error.message);
    }
});

exports.update = async (req, res) => {
    try {
        const school = await Escuela.findById(req.params.id).exec();
        const newSchool = req.body;

        if ("alumnos" in newSchool) {
            return res.status(403).send('No se puede actulizar la lista de alumnos directamente');
        }
        if ("docentes" in newSchool || "administrativos" in newSchool || "mantenimiento" in newSchool) {
            return res.status(403).send('No se puede actulizar la lista de trabajadores directamente');
        }

        Object.assign(school, req.body);
        school.save();        
        redisClient.set("UPDATE:ESCUELAS:"+date, '09-11-22', (err, reply) => {
            if (err) return res.status(404).send(err);
        });
        redisClient.del('escuelas');   
        redisClient.del(`escuelas:${school.nombre}`);   
        return res.send({ data: school, newData: newSchool });

    } catch (error) {
        res.status(404).send('Escuela no encontrada\n' + error);

    }
}