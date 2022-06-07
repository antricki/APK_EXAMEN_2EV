const md5 = require('md5');

var sqlite3 = require('sqlite3').verbose()


const DBSOURCE = "db.sqlite"

let db = new sqlite3.Database(DBSOURCE, (err) => {
    if (err) {
        // Cannot open database
        console.error(err.message)
        throw err
    } else {
        console.log('Connected to the SQLite database.')
        console.log('Creant taula usuari') 
        db.run(`CREATE TABLE user (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name text, 
            email text UNIQUE, 
            password text, 
            CONSTRAINT email_unique UNIQUE (email)
            )`,
            (err) => {
                if (err) {
                    // Table already created
                } else {
                    // Table just created, creating some rows
                    console.error("Insertant usuari") // comprobación de creación de tabla
                    var insert = 'INSERT INTO user (name, email, password) VALUES (?,?,?)'
                    var param = ["ferran","fer@fer.com",md5("password")] // Usuario 
                    db.run(insert, param)
                }
            })
            console.log('Creant taula anotacions') // comprobación de creación de tabla anotaciones
        db.run(
            `CREATE TABLE "anotacions" (
                "id"	INTEGER,
                "anotacio"	TEXT,
                "id_user"	INTEGER,
                FOREIGN KEY("id_user") REFERENCES user(id),
                PRIMARY KEY("id" AUTOINCREMENT)
            ); 
            )`,
                (err) => { 
                    if (err) {
                        // Table already created
                    } else {
                        console.error("Insertant anotació")
                        // Table just created, creating some rows
                        var insert = 'INSERT INTO anotacions (id_user, anotacio) VALUES (?,?)'
                        var param = [1,md5("Comentari")] // El comentario cifrado con MD5 nunca. Mejorarlo en futuras versiones
                                                         // con algún codificador. https://stackoverflow.com/questions/18279141/javascript-string-encryption-and-decryption
                    db.run(insert, param)
                    }
                });
    }
});


module.exports = db