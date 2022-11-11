const mongoose = require('mongoose');

const trabajadorSchema = mongoose.Schema({
    _id:{ type: mongoose.Schema.Types.ObjectId },
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
    tutorados:[mongoose.Schema.Types.ObjectId],
    enabled:Boolean
});

module.exports = mongoose.model('trabajadores', trabajadorSchema);