const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const rutas = require('./routes/endpoints');
const alumnos = require('./api/alumnos/alumno.routes')
const escuelas = require('./api/escuelas/escuela.routes')
const trabajadores = require('./api/trabajadores/trabajador.routes')
const port = 3000;
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

main().catch(err => console.log(err));

async function main() {
    await mongoose.connect('mongodb://localhost:27017/gestion-escolar');
}

app.use('/api/alumnos', alumnos);
app.use('/api/escuelas', escuelas);
app.use('/api/trabajadores', trabajadores);
app.use('/api', (req,res)=>res.status(200).send("OK"));

app.listen(port,()=>{console.log('Escucha en puerto:'+port)})