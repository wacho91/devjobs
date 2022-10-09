const passport = require('passport');
const mongoose = require('mongoose');
const Vacante = mongoose.model('Vacante');
const Usuarios = mongoose.model('Usuarios')
const crypto = require('crypto');
const enviarEmail = require('../handlers/email');

exports.autenticarUsuario = passport.authenticate('local', {
    successRedirect: '/administracion',
    failureRedirect: '/iniciar-sesion',
    failureFlash: true,
    badRequestMessage: 'Ambos campos son obligatorios' 
})

//Revisar si el usuario esta autenticado o no
exports.verificarUsuario = (req, res, next) => {
    //revisar el usuario
    if(req.isAuthenticated()) {
        return next(); //está autenticado
    }

    //redireccionar
    res.redirect('/iniciar-sesion');
}

exports.mostrarPanel = async(req, res) => {

    //Consultar el usuario autenticado
    const vacantes = await Vacante.find({ autor: req.user._id}).lean();

    res.render('administracion', {
        nombrePagina: 'Panel de Administracion',
        tagline: 'Crea y administra tus vacantes desde aqui',
        cerrarSesion: true,
        nombre: req.user.nombre,
        imagen: req.user.imagen,
        vacantes
    })
}

exports.cerrarSesion = (req, res, next) => {
    req.logout(function(err){
        if(err){
            return next(err);
        }
        req.flash('correcto', 'Cerraste sesion correctamente');
        return res.redirect('/iniciar-sesion');
    })
}

//Formulario para reestablecer el password
exports.formReestablecerPassword = (req, res) => {
    res.render('restablecer-password', {
        nombrePagina : 'Reestablece tu Password',
        tagline : 'Si ya tienes una cuenta pero olvidaste tu password, coloca tu email'
    })
}

//Genera el token en la tabla de ususarios
exports.enviarToken = async(req, res) => {
    const usuario = await Usuarios.findOne({ email: req.body.email})

    if(!usuario) {
        req.flash('error', 'No existe esa cuenta');
        return res.redirect('/iniciar-sesion');
    }

    //El usuario existe generar token
   usuario.token = crypto.randomBytes(20).toString('hex');
   usuario.expira = Date.now() + 3600000

   
    //Guardar Usuario
    await usuario.save();
    const resetUrl = `http://${req.headers.host}/restablecer-password/${usuario.token}`;

    // console.log(resetUrl)
   

   //Enviar notificacion por email
   await enviarEmail.enviar ({
      usuario,
      subject: 'Password Reset',
      resetUrl,
      archivo: 'reset'
   })

   req.flash('correcto', 'Revisa tu email para las indicaciones')
   res.redirect('/iniciar-sesion')
  
}

//Valida si el token es valido y el usuario existe y muestra la vista
exports.reestablecerPassword = async (req, res) => {
    const usuario = await Usuarios.findOne({
        token : req.params.token,
        expira : {
            $gt : Date.now()
        }
    })

    if(!usuario) {
        req.flash('error', 'El formulario no es valido intenta de nuevo')
        return res.redirect('/restablecer-password')
    }

    //Todo bien, mostrar el formulario
    res.render('nuevo-password', {
        nombrePagina : ' Nuevo Password'
    })

}

// Almacena el nuevo password en la base de datos
exports.guardarPassword = async(req, res) => {
    const usuario = await Usuarios.findOne({
        token: req.params.token,
        expira: {
            $gt : Date.now()
        }
    })

    //No existe el usuario o el token es invalido
    if(!usuario) {
        req.flash('error', 'El formulario no es valido intenta de nuevo')
        return res.redirect('/restablecer-password')
    }

    //Asignar nuevo password y limpiar valores previos
    usuario.password = req.body.password
    usuario.token = undefined
    usuario.expira = undefined

    //Agregar y eliminar valores del objeto
    await usuario.save();

    //Redirigir
    req.flash('correcto', 'Passsword Modificado Correctamente')
    res.redirect('/iniciar-sesion')
}
