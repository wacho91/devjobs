const mongoose = require('mongoose');
const Vacante = mongoose.model('Vacante');
const { check, validationResult } = require('express-validator');

const multer = require('multer')
const shortid = require('shortid');
const Vacantes = require('../models/Vacantes');

exports.formularioNuevaVacante = (req, res) => {
    res.render('nueva-vacante', {
       nombrePagina: 'Nueva Vacante',
       tagline: 'Llena el formulario y publica tu vacante',
        cerrarSesion: true,
        nombre: req.user.nombre,
        imagen: req.user.imagen 
    })
}

//Agrega las vacantes a la base de datos

exports.agregarVacante = async(req, res) => {
    const vacante = new Vacante (req.body);

    //Usuario autor de la vacante
    vacante.autor = req.user._id;

    //Crear arreglo de habilidades (skills)
    vacante.skills = req.body.skills.split(',');

    //Almacenar en la base de datos
    const nuevaVacante = await vacante.save();

    //Redireccionar
    res.redirect(`/vacantes/${nuevaVacante.url}`);
}

//Muestra una vacante
exports.mostrarVacante = async(req, res, next) => {
    const vacante = await Vacante.findOne({ url: req.params.url}).lean().populate('autor');

    //Si no hay resultados
    if(!vacante) return next();

    res.render('vacante', {
        vacante,
        nombrePagina: vacante.titulo,
        barra: true
    })
}

exports.formEditarVacante = async(req, res) => {
    const vacante = await Vacante.findOne({ url: req.params.url}).lean();

    if(!vacante) return next();

    res.render('editar-vacante', {
        vacante,
        nombrePagina: `Editar - ${vacante.titulo}`,
        cerrarSesion: true,
        nombre: req.user.nombre,
        imagen: req.user.imagen
    })
}

exports.editarVacante = async(req, res) => {
    const vacanteActualizazada = req.body;

    vacanteActualizazada.skills = req.body.skills.split(',');

    const vacante = await Vacante.findOneAndUpdate({ url: req.params.url}, vacanteActualizazada, {
        new: true,
        runValidators: true
    })

    res.redirect(`/vacantes/${vacante.url}`);
}

//Validar y sanitizar los campos de las nuevas vacantes

exports.validarVacante = async (req, res, next) => {
    //sanitizar los campos
    const rules = [
        check('titulo').not().isEmpty().withMessage('Agrega un titulo a la vacante').escape(),
        check('empresa').not().isEmpty().withMessage('Agrega una empresa').escape(),
        check('ubicacion').not().isEmpty().withMessage('Agrega una ubicacion').escape(),
        check('contrato').not().isEmpty().withMessage('Selecciona el tipo de contrato').escape(),
        check('skills').not().isEmpty().withMessage('Agrega al menos una habilidad').escape()
    ]

    await Promise.all(rules.map(validation => validation.run(req)));
    const errores = validationResult(req);

    if(!errores.isEmpty()){
        //Re-render a la vista con los errores
        req.flash('error', errores.array().map(error => error.msg));

        res.render('nueva-vacante', {
            nombrePagina: 'Nueva Vacante',
            tagline: 'Llena el formulario y publica tu vacante',
            cerrarSesion: true,
            nombre: req.user.nombre,
            mensajes: req.flash()
        })
        return;
    }

    next(); //Siguiente middleware
}

exports.eliminarVacante = async(req, res) => {
    const {id} = req.params;

    const vacante = await Vacante.findById(id);

    if(verficicarAutor(vacante, req.user)){
        //Todo biens, si es el usuario, eliminar
        vacante.remove();
        res.status(200).send('Vacante Eliminada Correctamente');
    } else {
        //no permitido
        res.status(403).send('Error');
    }

    
}

const verficicarAutor = (vacante = {}, usuario = {}) => {
    if(!vacante.autor.equals(usuario._id)){
        return false;
    }
    return true;
}

//Subir archivos en PDF
exports.subirCV = (req, res, next) => {
    upload(req, res, function(error) {
        if(error) {
            if(error instanceof multer.MulterError) {
                if(error.code === 'LIMIT_FILE_SIZE'){
                    req.flash('error', 'El archivo es muy grande: Maximo 100kb');
                } else {
                    req.flash('error', error.message);
                }
            }else {
                req.flash('error', error.message);
            }
            res.redirect('back');
            return;
        } else {
            return next();
        }
        
    });
}

//Opciones de Multer
const configuracionMulter = {
    limits: { fileSize: 100000 },
    storage: fileStorage = multer.diskStorage({
        destination : (req, file, cb) => {
            cb(null, __dirname+'../../public/uploads/cv');
        },
        filename : (req, file, cb) => {
            const extension = file.mimetype.split('/')[1];
            cb(null, `${shortid.generate()}.${extension}`);
        }
    }),
    fileFilter(req, file, cb) {
        if(file.mimetype === 'application/pdf'){
            //el callback se ejecuta como true o false : true cuando la imagen se acepta
            cb(null, true);
        } else {
            cb(new Error('Formato no valido'), false);
        }
    },
    
}

const upload = multer(configuracionMulter).single('cv');

//Almacenar los candidatos a la base de datos
exports.contactar = async (req, res, next) => {

    const vacante = await Vacante.findOne({ url: req.params.url});

    //Si no existe la vacante
    if(!vacante){
        return next()
    }

    //Todo pasa bien, construir el nuevo objeto
    const nuevoCandidato = {
        nombre: req.body.nombre,
        email: req.body.email,
        cv: req.file.filename
    }

    //Almacenar la vacante
    vacante.candidatos.push(nuevoCandidato);
    await vacante.save()

    //Mensaje flash y redireccion
    req.flash('correcto', 'Se envio tu curriculum Correctamente');
    res.redirect('/')
}

exports.mostrarCandidatos = async (req, res, next) => {
    const vacante = await Vacante.findById(req.params.id).lean();

    if(vacante.autor === req.user._id.toString()){
        return next();
    } 

    if(!vacante) return next();

    res.render('candidatos', {
        nombrePagina : `Candidatos Vacante - ${vacante.titulo}`,
        tagLine: `${vacante.empresa}`,
        cerrarSesion : true,
        nombre : req.user.nombre,
        imagen : req.user.imagen,
        candidatos : vacante.candidatos 
    })
}

//Buscador de vacantes
exports.buscarVacantes = async(req, res) => {
    const vacantes = await Vacantes.find({
        $text: {
            $search: req.body.q
        }
    }).lean()

    //Mostrar las vacantes
    res.render('home', {
       nombrePagina : `Resultados para la Busqueda : ${req.body.q}`,
       barra : true,
       vacantes
    })

}
