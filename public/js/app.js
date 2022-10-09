import axios from 'axios';
import Swal from 'sweetalert2';


document.addEventListener('DOMContentLoaded', () => {
    const skills = document.querySelector('.lista-conocimientos');

    //Limpiar las alertas
    let alertas = document.querySelector('.alertas');

    if(alertas) {
        limpiarAlertas()
    }

    if(skills){
        skills.addEventListener('click', agregarSkills);

        //Una ves que estamos en editar, llamar la función
        skillsSeleccionados();
    }

    const vacanteListado = document.querySelector('.panel-administracion');

    if(vacanteListado) {
        vacanteListado.addEventListener('click', accionesListado);
    }
})

const skills = new Set();

const agregarSkills = (e) => {
    if(e.target.tagName === 'LI') {
       if(e.target.classList.contains('activo')){
           skills.delete(e.target.textContent);
           e.target.classList.remove('activo');
       } else {
            skills.add(e.target.textContent);
            e.target.classList.add('activo');
       }
    }

    const skillsArray = [...skills];
    document.querySelector('#skills').value = skillsArray;
} 

const skillsSeleccionados = () => {
    const seleccionados = Array.from(document.querySelectorAll('.lista-conocimientos .activo'));

    seleccionados.forEach(seleccionado => {
        skills.add(seleccionado.textContent);
    })

    //Inyectar en el hidden
    const skillsArray = [...skills]
    document.querySelector('#skills').value = skillsArray;
    
}

const limpiarAlertas = () => {
    const alertas = document.querySelector('.alertas');
    const interval = setInterval(() => {
        if(alertas.children.length > 0) {
            alertas.removeChild(alertas.children[0]);
        }else if (alertas.children.length === 0) {
            alertas.parentElement.removeChild(alertas);
            clearInterval(interval);
        }
    }, 2000)
}

//Eliminar vacantes
const accionesListado = e => {
    e.preventDefault();

    if(e.target.dataset.eliminar) {
        //Eliminar por medio de axios
        Swal.fire({
            title: 'Confirmar la eliminacion?',
            text: "Una vez eliminado, no se puede recuperar!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Si, eliminar!',
            cancelButtonText: 'No, cancelar'
        }).then((result) => {
            if(result.value) {
                //Enviar petición a axios
                const url = `${location.origin}/vacantes/eliminar/${e.target.dataset.eliminar}`;

                //Axios para eliminar el registro
                axios.delete(url, { params: {url} })
                    .then(function(respuesta) {
                        if(respuesta.status === 200){
                            Swal.fire(
                                'Eliminado!',
                                respuesta.data,
                                'success'
                            )
                           //Todo: Eliminar del DOM
                           e.target.parentElement.parentElement.parentElement.removeChild(e.target.parentElement.parentElement);
                        }
                    })
            
               
            }
        })
        .catch(() => {
            Swal.fire({
                type: 'error',
                title: 'Hubo un error',
                text: 'No se pudo eliminar la vacante'
            })
        })
    } else if(e.target.tagName === 'A') {
        window.location.href = e.target.href;
    }
}