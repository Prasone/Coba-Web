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
    const queryMovies = 'SELECT id, poster FROM movies';
    const queryComingSoon = 'SELECT * FROM comingsoon';

    // Mengambil data dari tabel 'movies'
    db.query(queryMovies, (err, movies) => {
        if (err) {
            console.error(err);
            res.status(500).send("Error retrieving movies from database");
            return;
        }

        // Mengambil data dari tabel 'comingsoon'
        db.query(queryComingSoon, (err, comingSoon) => {
            if (err) {
                console.error(err);
                res.status(500).send("Error retrieving coming soon movies from database");
                return;
            }

            // Render halaman index dengan data dari 'movies' dan 'comingsoon'
            res.render('index', {
                movies: movies,
                comingSoon: comingSoon
            });
        });
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

// app.get('/schedule', (req,res) => res.render('schedule', {title : " Schedule Page"}))
app.get('/schedule', (req, res) => {
    const query = `
      SELECT 
        movies.id AS movie_id, 
        movies.title, 
        movies.genre, 
        movies.duration, 
        movies.poster,
        schedules.date
      FROM 
        movies
      JOIN 
        schedules 
      ON 
        movies.id = schedules.movie_id
      WHERE 
        movies.release_date <= CURDATE()
      ORDER BY 
        movies.id, schedules.date
    `;
  
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error executing query:', err);
            res.status(500).send('Internal Server Error');
            return;
        }

        // Kelompokkan data berdasarkan film
        const movies = results.reduce((acc, row) => {
            const movie = acc.find(m => m.id === row.movie_id);
            const dateObj = new Date(row.date);
            const weekday = dateObj.toLocaleDateString('en-US', { weekday: 'short' }); // Nama hari
            const day = dateObj.getDate(); // Tanggal
            
            if (movie) {
                const formattedDate = { weekday, day };
                if (!movie.dates.find(d => d.weekday === weekday && d.day === day)) {
                    movie.dates.push(formattedDate);
                }
            } else {
                acc.push({
                    id: row.movie_id,
                    title: row.title,
                    genre: row.genre,
                    duration: row.duration,
                    poster: row.poster,
                    dates: [{ weekday, day }]
                });
            }
            return acc;
        }, []);

        res.render('schedule', { movies });
    });
});

app.get('/schedule_film/:id', (req, res) => {
    const movieId = req.params.id;
    const movieQuery = `SELECT * FROM movies WHERE id = ?`;
    const scheduleQuery = `
        SELECT schedules.date, theaters.name AS theater_name, theaters.id AS theater_id, theaters.city
        FROM schedules
        JOIN theaters ON schedules.theater_id = theaters.id
        WHERE schedules.movie_id = ?
        ORDER BY schedules.date ASC, theaters.name ASC
    `;

    db.query(movieQuery, [movieId], (err, movieResult) => {
        if (err) throw err;

        // Jika film tidak ditemukan, tampilkan error
        if (!movieResult.length) {
            return res.status(404).send('Movie not found');
        }

        const movieData = movieResult[0];

        db.query(scheduleQuery, [movieId], (err, scheduleResults) => {
            if (err) throw err;

            const groupedSchedules = scheduleResults.reduce((acc, schedule) => {
                const date = schedule.date;
                if (!acc[date]) acc[date] = [];
                acc[date].push(schedule);
                return acc;
            }, {});

            res.render('schedule_film', { 
                movie: movieData,
                schedules: groupedSchedules 
            });
        });
    });
});


app.get('/cinema', (req, res) => {
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

        res.render('cinema', { theaters: results, city });
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
        INSERT INTO theaters (name, location, city, contact) VALUES (?, ?, ?, ?)
    `;

    db.query(query, [name, location, city, contact], (err, result) => {
        if (err) throw err;
        res.redirect('/add_bioskop?success=true'); // Redirect dengan query string
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

// GET route to render the edit form
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

// POST route to handle form submission and update the database
app.post('/edit/:id', (req, res) => {
    const theaterId = req.params.id;
    const { name, location, city, contact } = req.body;

    const query = 'UPDATE theaters SET name = ?, location = ?, city = ?, contact = ? WHERE id = ?';
    const values = [name, location, city, contact, theaterId];

    db.query(query, values, (err, result) => {
        if (err) {
            console.error('Error updating theater:', err);
            res.status(500).send('Internal Server Error');
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
app.post('/delete_bioskop/:id', (req, res) => {
    const theaterId = req.params.id;
    const query = 'DELETE FROM theaters WHERE id = ?';

    db.query(query, [theaterId], (err, result) => {
        if (err) throw err;
        console.log(`Bioskop dengan ID ${theaterId} telah dihapus`);
        res.redirect('/data-bioskop');
    });
});


app.get("/coming_soon", (req, res) => {
    const query = "SELECT * FROM comingsoon";
    db.query(query, (err, results) => {
      if (err) throw err;
      res.render("coming_soon", { comingsoon: results });
    });
  });
  
  // Add Movie Form
  app.get("/add_coming_soon", (req, res) => {
    res.render("add_coming_soon");
  });
  
  // Add Movie - Handle POST Request
app.post('/add_coming_soon', upload.single("poster"), (req, res) => {
    const { title, genre, release_date } = req.body;
    const poster = req.file ? req.file.filename : null;

    const query = "INSERT INTO comingsoon (title, genre, release_date, poster) VALUES (?, ?, ?, ?)";
    db.query(query, [title, genre, release_date, poster], (err) => {
      if (err) throw err;
      res.redirect("/add_coming_soon?success=true");
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
app.listen(8000, () => console.log('Server running on http://localhost:8000'));
