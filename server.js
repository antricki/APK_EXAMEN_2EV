// Create express app
var express = require("express")
var app = express()
// Conexión a la base de datos
var db = require("./database.js")
var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));
var md5= require('md5')
var jwt = require('jsonwebtoken') // https://www.digitalocean.com/community/tutorials/nodejs-jwt-expressjs
app.use(bodyParser.json());
// HTTPS
const fs = require('fs');
const https = require('https');
// Puerto HTTPS
const PORT = 8443;
const clau = 'hola'
const cookieparser = require("cookie-parser")
app.use(cookieparser())
const CryptoJS = require('crypto-js');

 

//let encryptText = encryptWithAES("comentari"); 
//EncryptedText==>  //U2FsdGVkX19GgWeS66m0xxRUVxfpI60uVkWRedyU15I= 

//let decryptText = decryptWithAES(encryptText);
////decryptText==>  //YAZAN 
const decryptWithAES = (ciphertext) => {
    const passphrase = "My Secret Passphrase";
    const bytes = CryptoJS.AES.decrypt(ciphertext, passphrase);
    const originalText = bytes.toString(CryptoJS.enc.Utf8);
    return originalText;
  };

  const encryptWithAES = (text) => {
    const passphrase = "My Secret Passphrase";
    return CryptoJS.AES.encrypt(text, passphrase).toString();
  };
  //The Function Below To Decrypt Text


  
https.createServer({
    key: fs.readFileSync('my_cert.key'),
    cert: fs.readFileSync('my_cert.crt')
  }, app).listen(PORT, function(){
    console.log("Servidor HTTPS Toni escuchando en la URL https://localhost:%PORT%".replace("%PORT%",PORT))
  });
  
  app.get("/", (req, res, next) => {
    res.json({"message":"Ok"})
 });

 function generartoken (usuari) { // Función que genera un token: https://stackoverflow.com/questions/67432096/generating-jwt-tokens
    return jwt.sign({
    name: usuari.name,
    email: usuari.email,
    id: usuari.id,
    }, clau, {expiresIn: '3h'});
}

function autenticarusuari(req, res, next){
    const token = req.cookies['token']
    if (token) {
        jwt.verify(token, clau, (err, user) => { // Muy importante el "verify" para verificar todos los elementos de ese token
            if (err) {
                return res.sendStatus(403); 
            }
            req.usuari = user;
            next();
        });
    } else {
        res.json({"message":"Primero loguéate y luego podrás acceder!!"}) // Si no estamos loqgueados no podemos tener el token
        }
};
  
// Ahora iremos añadiendo los endpoints

// Usuarios registrados
app.get("/api/users", (req, res, next) => {
    var sql = "select * from user"
    var params = []
    db.all(sql, params, (err, rows) => {
        if (err) {
          res.status(400).json({"error":err.message});
          return;
        }
        res.json({
            "message":"success",
            "data":rows
        })
      });
});

// Autenticación de usuarios (Se ha parametrizado contra ataques SQLi)
app.post("/api/autenticar/", (req, res, next) => {   
    var sql ="SELECT * FROM user WHERE email=? AND password=?"
    db.get(sql,[req.body.email, md5(req.body.password)],(err, user) => { // Encriptamos la contraseña con MD5 (ya sabemos que no es muy segura)
        if (err) {
          res.status(400).json({"error":err.message});
        }else{
            if (user){
                const token = generartoken(user); // generamos el token
                res.cookie('token', token); // la guardamos en la cookie
                res.json({
                    "message":"success"
                })
            }else{
                res.json({
                    "message":"Contraseña incorrecta!" 
                })
            }  
        }
    });
})
       
// Registrar usuario (copiado de la práctica anterior modificando el acceso a la base de datos) 
app.post("/api/user/", (req, res, next) => {
    var errors=[]
    if (!req.body.password){ // Obligamos a que no esté vacío
        errors.push("No se ha especificado ninguna contraseña");
    }
    if (!req.body.email){  // Obligamos a que no esté vacío
        errors.push("No se ha especificado ningun email");
    }
    if (errors.length){
        res.status(400).json({"error":errors.join(",")});
        return;
    }
    var data = {
        name: req.body.name,
        email: req.body.email,
        password : md5(req.body.password)
    }
    var sql ='INSERT INTO user (name, email, password) VALUES (?,?,?)' // Solucionado el error del ID (al ser incrementable no debe de ponerse)
    
    var params =[data.name, data.email, data.password]
    db.run(sql, params, function (err, result) {
        if (err){
            res.status(400).json({"error": err.message})
            return;
        }
        res.json({
            "message": "success",
            "data": data,
            "id" : this.lastID
        })
    });
})

// Actualizar usuario por ID (copiado de la práctica anterior)
app.patch("/api/user/:id", (req, res, next) => {
    var data = {
        name: req.body.name,
        email: req.body.email,
        password : req.body.password ? md5(req.body.password) : null
    }
    db.run(
        `UPDATE user set 
           name = COALESCE(?,name), 
           email = COALESCE(?,email), 
           password = COALESCE(?,password) 
           WHERE id = ?`,
        [data.name, data.email, data.password, req.params.id],
        function (err, result) {
            if (err){
                res.status(400).json({"error": res.message})
                return;
            }
            res.json({
                message: "success",
                data: data,
                changes: this.changes
            })
    });
})

// Crear anotaciones
app.post('/api/anotar', autenticarusuari, (req, res) => {
    var sql = "INSERT INTO anotacions (id_user, anotacio) VALUES (?,?)"; // Consulta a la base de datos
    db.run(sql, [req.usuari.id, encryptWithAES(req.body.anotacio)], function (err) {
        if (err){
            res.status(400).json({"error": err.message})
            return
        }
        res.status(200).json({"message": "ok"})
        return
    });
});

// Endpoint para ver las anotaciones
app.get('/api/vorenota/:usuari', autenticarusuari, (req, res) => {
    if(req.params.usuari != req.usuari.id){ // si no autenticat
        res.status(400).json({"error": "no tiene permisos para ver las anotaciones de otros usuarios"})
        return
    }
    var sql = "SELECT anotacio FROM anotacions WHERE id_user = ?";
    db.all(sql, [req.params.usuari,], function (err, result) {
        if (err){
            res.status(400).json({"error": err.message})
            return
        }
        const notes =[];
        result.forEach((row) => {notes.push(decryptWithAES(row['anotacio']))})
        res.status(200).send(notes)
        return
        });
})

// Eliminación de las anotaciones (En proceso...)
app.delete("/api/eliminarnota/:nota", autenticarusuari, (req, res, next) => {
    db.run(`DELETE FROM anotacions WHERE id =? AND id_user =?`, // se eliminarán, tal y como hemos visto en clase hoy, siempre
                                                                // y cuando el id del token y el id del usuario sean iguales
        [req.params.nota, req.usuari.id], function (err, result) {
            if (err){
                res.status(400).json({"error": res.message})
                return;
            }
            if(this.changes > 1){
                res.json({"message":"la anotación no se ha podido eliminar"})
            } 
            else {
                res.json({"message":"La anotación se ha eliminado con éxito"})
            }
        
        }
    )
})

// Default response for any other request
app.use(function (req, res) {
    res.status(404).json({ "error": "Invalid endpoint" });
});