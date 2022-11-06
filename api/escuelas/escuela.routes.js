const express = require('express');
const bodyParser = require('body-parser');
const controller = require('./escuela.controller');

const router = express.Router()

router.get('/',controller.getAll)
router.get('/:nombre',controller.getOneByName)
// router.get('/:tipo',controller.getAllByType);
router.get('/docentes',controller.getDocentes)

router.post('/crear',controller.create);

router.route('/')
    .put((req, res,) => {
        res.json({ msg: `PUT Se ha actualizado una escuela` });
    });
router.route('/escuelas')
    .delete((req, res,) => {
        res.json({ msg: `DELETE Se ha eliminado una escuela` });
    });

module.exports = router