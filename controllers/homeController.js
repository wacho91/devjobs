const mongoose = require('mongoose');
const Vacante = mongoose.model('Vacante');

exports.mostarTrabajos = async(req, res, next) => {

    const vacantes = await Vacante.find().lean();

    if(!vacantes) return next();

    res.render('home', {
        nombrePagina: 'devJobs',
        tagline: 'Encuentra y publica trabajos para desarrolladores web',
        barra: true,
        boton: true,
        vacantes
    })
}

    // res.render('home', {
    //     nombrePagina: 'DevJobs',
    //     tagline: 'Encuentra y publica Trabajos para Desarrolladores Web',
    //     barra: true,
    //     boton: true
    // })
