const mongoose = require('mongoose');

const escuelaSchema = mongoose.Schema({    
    _id: { type: mongoose.Schema.Types.ObjectId },
    clave:String,
    ciudad: String,
    direccion: String,
    nombre: String,
    administrativos: [mongoose.Schema.Types.ObjectId],
    docentes:[mongoose.Schema.Types.ObjectId],
    mantenimiento:[mongoose.Schema.Types.ObjectId],
    alumnos:[{
        idAlumno:String,
        fechaIngre:String
    }],
    enabled:Boolean
});

module.exports = mongoose.model('escuelas', escuelaSchema);

