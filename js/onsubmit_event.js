function validateForm(){
    console.log('comprobar formulario') // Formulario realizado en clase
    if (document.getElementById('name').value != '' &&
        document.getElementById('email').value != '' &&
        document.getElementById('password').value != '' ){
         
            console.log(document.getElementById('password').value.length < 8)
            if(document.getElementById('password').value.length < 8){ // Añadimos para que la contraseña tenga mínimo 8 carácteres
                
                alert('Contraseña debe ser mayor a 8 carácteres!') // Aviso de ayuda al usuario
                return false
            }
            // Ahora, comparamos las dos contraseñas, si no coinciden...alertar al usuario
            if(document.getElementById('password').value  != document.getElementById('password2').value){
                
                alert('Las contraseñas no coinciden!') // Aviso de ayuda para el usuario
                return false
            }
        return true // si todo se cumple, avanzamos.
    
    }else{
        
        alert('Todos los campos son obligatorios') // Si hay un campo que no está rellenado...alertamos al usuario
        return false
    }
}