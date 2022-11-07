const mongoose = require('mongoose');

const alumnoSchema = mongoose.Schema({
    _id: { type: mongoose.Schema.Types.ObjectId },
    nombre: String,
    fechaNac: String,
    curp: String,
    tutor:String,
    estudia:String,
    fechaIngre:String,
    enabled:Boolean
});

module.exports = mongoose.model('alumnos', alumnoSchema);

