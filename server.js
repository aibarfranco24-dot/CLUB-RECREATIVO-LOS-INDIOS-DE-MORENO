const express = require('express');
const mysql = require('mysql2');
const cors = require('cors'); // <--- 1. IMPORTA CORS
const app = express();

app.use(cors()); // <--- 2. ACTIVA CORS PARA TODAS LAS PETICIONES

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'tienda_club'
});

app.get('/productos', (req, res) => {
  db.query('SELECT * FROM productos', (err, results) => {
    if (err) return res.send(err);
    res.json(results);
  });
});

app.listen(3000, () => console.log('Servidor activo en http://localhost:3000'));