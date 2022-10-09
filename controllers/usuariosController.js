const mongoose = require('mongoose');
const Usuarios = mongoose.model('Usuarios')
const { check, validationResult } = require('express-validator');
const multer = require('multer');
const shortid = require('shortid');

exports.subirImagen = (req, res, next) => {
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
            res.redirect('/administracion');
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
            cb(null, __dirname+'../../public/uploads/perfiles');
        },
        filename : (req, file, cb) => {
            const extension = file.mimetype.split('/')[1];
            cb(null, `${shortid.generate()}.${extension}`);
        }
    }),
    fileFilter(req, file, cb) {
        if(file.mimetype === 'image/jpeg' || file.mimetype === 'image/png'){
            //el callback se ejecuta como true o false : true cuando la imagen se acepta
            cb(null, true);
        } else {
            cb(new Error('Formato no valido'), false);
        }
    },
    
}

const upload = multer(configuracionMulter).single('imagen');


exports.formCrearCuenta = (req, res) => {
    res.render('Crear-cuenta', {
        nombrePagina: 'Crear cuenta en DevJobs',
        tagline: 'Comienza a publicar tus vacantes gratis, solo debes crear una cuenta'
    })
}

exports.validarRegistro = async (req, res, next) => {
    //sanitizar los campos
    const rules = [
        check('nombre').not().isEmpty().withMessage('El nombre es obligatorio').escape(),
        check('email').isEmail().withMessage('El email es obligatorio').normalizeEmail(),
        check('password').not().isEmpty().withMessage('El password es obligatorio').escape(),
        check('confirmar').not().isEmpty().withMessage('Confirmar password es obligatorio').escape(),
        check('confirmar').equals(req.body.password).withMessage('Los passwords no son iguales')
    ];
 
    await Promise.all(rules.map(validation => validation.run(req)));
    const errores = validationResult(req);
    //si hay errores
    if (!errores.isEmpty()) {
        req.flash('error', errores.array().map(error => error.msg));
        res.render('crear-cuenta', {
            nombrePagina: 'Crea una cuenta en Devjobs',
            tagline: 'Comienza a publicar tus vacantes gratis, solo debes crear una cuenta',
            mensajes: req.flash()
        })
        return;
    }
 
    //si toda la validacion es correcta
    next();
}

exports.crearUsuario = async (req, res) => {
    //Crear Usuario
    const usuario = new Usuarios(req.body);

    try {
        await usuario.save();
        res.redirect('/iniciar-sesion');
    } catch (error) {
        req.flash('error', error);
        res.redirect('/crear-cuenta');
    }

   
}

//Formulario para iniciar sesion
exports.formIniciarSesion = (req, res) => {
    res.render('iniciar-sesion', {
        nombrePagina: 'Iniciar Sesion DevJobs'
    })
}

//Formulario para editar el perfil
exports.formEditarPerfil = (req, res) => {
    res.render('editar-perfil', {
        nombrePagina: 'Edita tu perfil en DevJobs',
        usuario: req.user.toObject(),
        cerrarSesion: true,
        nombre: req.user.nombre,
        imagen: req.user.imagen
    })
}

//Guardar cambios del perfil
exports.editarPerfil = async (req, res) => {
    const usuario = await Usuarios.findById(req.user._id);

    usuario.nombre = req.body.nombre;
    usuario.email = req.body.email;
    if(req.body.password) {
        usuario.password = req.body.password;
    }

    if(req.file){
        usuario.imagen = req.file.filename;
        
    }

    await usuario.save();

    req.flash('correcto', 'Cambios guardados correctamente');

    //redirect
    res.redirect('/administracion');
}


//Validar y sanitizar el formulario de editar perfil
exports.validarPerfil = async (req, res, next) => {
    //sanitizar los campos
    const rules = [
        check('nombre').not().isEmpty().withMessage('El nombre es obligatorio').escape(),
        check('email').isEmail().withMessage('El email es obligatorio').normalizeEmail()
    ];
 
    await Promise.all(rules.map(validation => validation.run(req)));
    const errores = validationResult(req);
    //si hay errores
    if (!errores.isEmpty()) {
        req.flash('error', errores.array().map(error => error.msg));
        res.render('editar-perfil', {
            nombrePagina: 'Edita tu perfil en DevJobs',
            usuario: req.user.toObject(),
            cerrarSesion: true,
            nombre: req.user.nombre,
            imagen: req.user.imagen,
            mensajes: req.flash()
        })
        return;
    }
 
    //si toda la validacion es correcta
    next();
}