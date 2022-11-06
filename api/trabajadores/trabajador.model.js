const mongoose = require('mongoose');

const trabajadorSchema = mongoose.Schema({
    _id: String,
    curp:String,
    nombre: String,
    telfono: String,
    numCuenta: String,
    trabajaEn: String,
    tipo: String,
    datos:{
        // numOficina:String,
        // areaEspecialidad:String,
        // gradoEstudio:String
    },
    tutorados:[String],
    enabled:Boolean
});

module.exports = mongoose.model('trabajadores', trabajadorSchema);