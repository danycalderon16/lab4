const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const alumnos = require('./api/alumnos/alumno.routes')
const escuelas = require('./api/escuelas/escuela.routes')
const trabajadores = require('./api/trabajadores/trabajador.routes')
const port = 3000;
const app = express();

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


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

main().catch(err => console.log(err));

async function main() {
    await mongoose.connect('mongodb://localhost:27017/gestion-escolar');
}

app.use('/api/alumnos', alumnos);
app.use('/api/escuelas', escuelas);
app.use('/api/trabajadores', trabajadores);
app.use('/api/trabajadores', trabajadores);
app.delete('/redis', (req,res)=>{
    redisClient.flushAll('ASYNC', (err)=> {if(err)console.log(err)});
    res.status(200).send("Caché Limpio");
});

app.listen(port,()=>{console.log('Escucha en puerto:'+port)})