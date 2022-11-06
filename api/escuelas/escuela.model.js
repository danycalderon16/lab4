const mongoose = require('mongoose');

const escuelaSchema = mongoose.Schema({    
    _id: { type: mongoose.Schema.Types.ObjectId },
    clave:String,
    ciudad: String,
    direccion: String,
    nombre: String,
    administrativos: [String],
    docentes: [String],
    mantenimiento: [String],
    alumnos:[{
        nombre:String,
        fechaIngre:String
    }]
});

module.exports = mongoose.model('escuelas', escuelaSchema);

