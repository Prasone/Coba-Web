const express = require('express');
const mysql = require('mysql2');
const path = require('path');
const ejsLayouts = require('express-ejs-layouts');

const app = express();

// Set up EJS as the view engine and use express-ejs-layouts for layout support
app.set('view engine', 'ejs');
app.set("views","views")
app.use(express.static('public'));
// app.use(express.static(path.join(__dirname, 'public')));
app.use(ejsLayouts);

// MySQL Database Connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'cinema'
});

db.connect((err) => {
    if (err) throw err;
    console.log('Connected to the cinema database.');
});

// Route for home page
// app.get('/', (req, res) => res.render('index', { title: 'Home' }));
app.get('/', (req, res) => res.render('index', { title: 'Home'}));

// Route for movies page
app.get('/movies', (req, res) => {
    const query = 'SELECT * FROM movies'; // Replace with your actual table name
    db.query(query, (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send("Error retrieving movies from database");
        } else {
            res.render('movies', { title: 'Movies', movies: results });
        }
    });
});

// Route for schedule page
app.get('/schedule', (req, res) => {
    const query = 'SELECT * FROM schedules'; // Replace with your actual schedule table name and query
    db.query(query, (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send("Error retrieving schedule from database");
        } else {
            // Pass the results to the schedule.ejs view
            res.render('schedule', { title: 'Schedule', schedule: results });
        }
    });
});

app.get('/login', (req, res) => res.render('login', { title: 'Login Page' }));



// Start the server
app.listen(3000, () => console.log('Server running on http://localhost:3000'));
