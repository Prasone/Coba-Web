const express = require('express');
const mysql = require('mysql2');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const ejsLayouts = require('express-ejs-layouts');
const { title } = require('process');
const multer = require("multer");

const app = express();

// Set up EJS as the view engine and use express-ejs-layouts for layout support
app.set('view engine', 'ejs');
app.set("views","views")
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));
app.use(ejsLayouts);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Middleware untuk parsing data formulir
app.use(express.urlencoded({ extended: true }));

// **Middleware untuk session, letakkan di sini**
app.use(session({
    secret: 'kelompok4',
    resave: false,
    saveUninitialized: true
}));

// Middleware untuk menambahkan user ke setiap tampilan
app.use((req, res, next) => {
    res.locals.user = req.session.user;  // Menyimpan user di res.locals
    next();
});

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


function isAdmin(req, res, next) {
    if (req.session.user && req.session.user.role === 'admin') {
        next();
    } else {
        res.status(403).send('Access denied. Admins only.');
    }
}

// Route for home page
app.get('/', (req, res) => {
    const query = 'SELECT title, poster FROM movies'; // Replace with your actual table name
    db.query(query, (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send("Error retrieving movies from database");
        } else {
            res.render('index', { title: 'Home', movies: results });
        }
    });
});


// Contoh rute login
app.get('/login', (req, res) => {
    res.render('login', { title: 'Login Page', user: req.session.user });
}); 


app.get('/daftar', (req,res) => res.render('daftar', {title : " Register Page"}))

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
// app.get('/schedule', (req, res) => {
//     const query = 'SELECT * FROM schedules'; // Replace with your actual schedule table name and query
//     db.query(query, (err, results) => {
//         if (err) {
//             console.error(err);
//             res.status(500).send("Error retrieving schedule from database");
//         } else {
//             // Pass the results to the schedule.ejs view
//             res.render('schedule', { title: 'Schedule', schedule: results });
//         }
//     });
// });

app.get('/schedule', (req, res) => {
    const { city } = req.query;

    // Query untuk mengambil data berdasarkan kota (jika ada)
    const sql = city
        ? 'SELECT * FROM theaters WHERE city = ?'
        : 'SELECT * FROM theaters';

    db.query(sql, city ? [city] : [], (err, results) => {
        if (err) {
            console.error('Error executing query:', err);
            return res.status(500).send('Database error');
        }

        res.render('schedule', { theaters: results, city });
    });
});


//register
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 8);

    db.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
        if (err) throw err;

        if (results.length > 0) {
            return res.render('daftar', { title: 'register Page', error: 'Username already exists. Please choose a different username.' });
        }

        db.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword,'user' ], (err) => {
            if (err) throw err;
            res.redirect('/login');
        });
    });
});

//login
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
        if (err) throw err;
        if (results.length > 0) {
            const user = results[0];
            const isMatch = await bcrypt.compare(password, user.password);

            if (isMatch) {
                req.session.user = user;
                
                if (user.role === 'admin') {
                    console.log('Admin logged in:', user.username);
                    return res.redirect('/data'); // Halaman khusus admin
                } else {
                    console.log('User logged in:', user.username);
                    return res.redirect('/'); // Halaman user biasa
                }
            } else {
                res.render('login', { title: 'Login Page', error: 'Invalid username or password' });
            }
        } else {
            res.render('login', { title: 'Login Page', error: 'User not found' });
        }
    });
});

// Dashboard untuk admin


//admin
// Konfigurasi penyimpanan `multer`
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/"); // Folder penyimpanan file
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });


// Route untuk menampilkan data film
app.get("/data", (req, res) => {
    const sql = "SELECT * FROM movies";
    db.query(sql, (err, results) => {
        if (err) throw err;
        res.render("data", { movies: results });
    });
});

// Route untuk menambah bioskop
app.get('/add_movie', (req, res) => {
    res.render('add_movie'); // Render form untuk menambah bioskop
});

// Route untuk menangani form submit
app.post("/tambah", upload.single("poster"), (req, res) => {
    const title = req.body.title;
    const description = req.body.description;
    const genre = req.body.genre;
    const duration = req.body.duration;
    const release_date = req.body.release_date;
    const rating = req.body.rating;
    const poster = req.file ? req.file.filename : null;

    const sql = "INSERT INTO movies (title, description, genre, duration, release_date, rating, poster) VALUES (?, ?, ?, ?, ?, ?, ?)";
    db.query(sql, [title, description, genre, duration, release_date, rating, poster], (err, result) => {
        if (err) throw err;
        console.log("Data film berhasil disimpan");
        res.json({ success: true, message: "Film berhasil ditambahkan!" });
    });
});

// Route untuk menampilkan halaman edit
app.get('/edit_film/:id', (req, res) => {
    const filmId = req.params.id;
    const query = 'SELECT id, title, description, genre, duration, release_date, rating, poster FROM movies WHERE id = ?';

    db.query(query, [filmId], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Failed to fetch film data');
        }
        if (result.length > 0) {
            const movie = result[0];  // Ambil data film yang pertama
            res.render('edit_film', { movie });  // Kirim data film ke halaman edit_film.ejs
        } else {
            res.status(404).send('Film not found');
        }
    });
});


// Route untuk meng-handle update data
app.post('/edit_film/:id', (req, res) => {
    const filmId = req.params.id;
    const { title, description, genre, duration, release_date, rating, poster } = req.body;

    const query = `
        UPDATE movies 
        SET title = ?, description = ?, genre = ?, duration = ?, release_date = ?, rating = ?, poster = ? 
        WHERE id = ?
    `;

    db.query(query, [title, description, genre, duration, release_date, rating, poster, filmId], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Failed to update film');
        }
        res.redirect('/data-film');
    });
});


// Rute untuk menghapus film berdasarkan id
app.post("/delete/:id", (req, res) => {
    const movieId = req.params.id;
    const sql = "DELETE FROM movies WHERE id = ?";
    
    db.query(sql, [movieId], (err, result) => {
        if (err) {
            console.error("Error deleting movie:", err);
            return res.status(500).json({ success: false, message: "Failed to delete movie" });
        }
        res.json({ success: true, message: "Movie deleted successfully" });
    });
});

// Route untuk menampilkan data bioskop
app.get('/data-bioskop', (req, res) => {
    const query = 'SELECT * FROM theaters';
    
    // Ambil data dari database
    db.query(query, (err, results) => {
    if (err) {
        console.error('Terjadi kesalahan saat mengambil data: ', err);
        return res.status(500).send('Internal Server Error');
    }

    // Mengirim data bioskop ke halaman EJS
    res.render('data-bioskop', {
        title: 'Dashboard',
        user: req.session.user,  // Anda bisa sesuaikan dengan data pengguna yang ada di session
        theaters: results        // Data bioskop yang diambil dari database
    });
    });
});

// Route untuk menambah bioskop
app.get('/add_bioskop', (req, res) => {
    res.render('add_bioskop'); // Render form untuk menambah bioskop
});

// Route untuk menangani pengiriman form dan memasukkan data ke database
app.post('/add_bioskop', (req, res) => {
    const { name, location, city, contact } = req.body;

    const query = `
        INSERT INTO theaters (name, location, city, contact) 
        VALUES (?, ?, ?, ?)
    `;

    db.query(query, [name, location, city, contact], (err, result) => {
        if (err) throw err;
        res.redirect('/data-bioskop'); // Redirect ke halaman daftar bioskop setelah sukses
    });
});

// Route untuk menampilkan data bioskop (misalnya untuk halaman data-bioskop)
app.get('/data-bioskop', (req, res) => {
    const query = 'SELECT * FROM theaters';
    db.query(query, (err, results) => {
        if (err) throw err;
        res.render('data_bioskop', { theaters: results });
    });
});

// Route untuk menampilkan form edit bioskop
app.get('/edit_bioskop/:id', (req, res) => {
    const theaterId = req.params.id;
    const query = 'SELECT * FROM theaters WHERE id = ?';
    
    db.query(query, [theaterId], (err, result) => {
        if (err) throw err;
        if (result.length > 0) {
            res.render('edit_bioskop', { theater: result[0] });
        } else {
            res.redirect('/data-bioskop');
        }
    });
});


// Route untuk menangani form edit bioskop
app.post('/edit_bioskop/:id', (req, res) => {
    const theaterId = req.params.id;
    const { name, location, city, contact } = req.body;

    const query = `
        UPDATE theaters 
        SET name = ?, location = ?, city = ?, contact = ? 
        WHERE id = ?
    `;

    db.query(query, [name, location, city, contact, theaterId], (err, result) => {
        if (err) throw err;
        res.redirect('/data-bioskop');
    });
});


// Route untuk menghapus bioskop
app.delete('/delete_bioskop/:id', (req, res) => {
    const theaterId = req.params.id;
    const query = 'DELETE FROM theaters WHERE id = ?';

    db.query(query, [theaterId], (err, result) => {
        if (err) throw err;
        console.log(`Bioskop dengan ID ${theaterId} telah dihapus`);
        res.json({ success: true });
    });
});



// Logout route
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send("Error logging out.");
        }
        res.redirect('/'); // Redirect ke halaman utama setelah logout
    });
});

// Start the server
app.listen(3000, () => console.log('Server running on http://localhost:3000'));
