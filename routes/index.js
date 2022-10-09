const express = require('express');
const router = express.Router();
const homeController = require('../controllers/homeController');
const vacantesController = require('../controllers/vacantesController');
const usuariosController = require('../controllers/usuariosController');
const authController = require('../controllers/authController');

module.exports = () => {
    router.get('/', homeController.mostarTrabajos);

    //Crear vacantes
    router.get('/vacantes/nueva',
        authController.verificarUsuario, 
        vacantesController.formularioNuevaVacante
    );

    router.post('/vacantes/nueva',
        authController.verificarUsuario, 
        vacantesController.validarVacante,
        vacantesController.agregarVacante
    );


    //Mostrar vacante
    router.get('/vacantes/:url', vacantesController.mostrarVacante);


    //Editar vacantes
    router.get('/vacantes/editar/:url',
        authController.verificarUsuario, 
        vacantesController.formEditarVacante
    );
    
    router.post('/vacantes/editar/:url',
        authController.verificarUsuario,
        vacantesController.validarVacante, 
        vacantesController.editarVacante
    );

    //Eliminar vacantes
    router.delete('/vacantes/eliminar/:id',
        vacantesController.eliminarVacante,
    )


    //Crear cuentas
    router.get('/crear-cuenta', usuariosController.formCrearCuenta);
    router.post('/crear-cuenta',
    usuariosController.validarRegistro, 
    usuariosController.crearUsuario);

    //Autenticas usuarios
    router.get('/iniciar-sesion', usuariosController.formIniciarSesion);
    router.post('/iniciar-sesion', authController.autenticarUsuario);

    //Cerrar sesion
    router.get('/cerrar-sesion', 
        authController.verificarUsuario,
        authController.cerrarSesion
    );

    //Resetear Password
    router.get('/restablecer-password', authController.formReestablecerPassword)
    router.post('/restablecer-password', authController.enviarToken)

    //Resetear Password (Almacenar en la BD)
    router.get('/restablecer-password/:token',
        authController.reestablecerPassword
    )
    router.post('/restablecer-password/:token', 
        authController.guardarPassword
    )
   
    //Panel de administracion
    router.get('/administracion',
        authController.verificarUsuario, 
        authController.mostrarPanel
    );

    //Editar perfil
    router.get('/editar-perfil', 
        authController.verificarUsuario,
        usuariosController.formEditarPerfil
    )
    router.post('/editar-perfil', 
        authController.verificarUsuario,
        // usuariosController.validarPerfil,
        usuariosController.subirImagen,
        usuariosController.editarPerfil
    )

    //Recibir mensajes de los candidatos
    router.post('/vacantes/:url',
        vacantesController.subirCV,
        vacantesController.contactar
    );

    //Muestra los candidatos por vacantes
    router.get('/candidatos/:id',
        authController.verificarUsuario,
        vacantesController.mostrarCandidatos
    )

    //Buscador de vacantes
    router.post('/buscador', vacantesController.buscarVacantes)

    return router;
}