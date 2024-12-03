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
// Route for movies page
app.get('/movies', (req, res) => {
    const queryNowPlaying = 'SELECT * FROM movies'; // Query for movies that are currently playing
    const queryComingSoon = 'SELECT * FROM comingsoon'; // Query for movies coming soon
    
    db.query(queryNowPlaying, (err, nowPlayingMovies) => {
        if (err) {
            console.error(err);
            res.status(500).send("Error retrieving movies from database");
            return;
        }
        
        db.query(queryComingSoon, (err, comingSoonMovies) => {
            if (err) {
                console.error(err);
                res.status(500).send("Error retrieving coming soon movies from database");
                return;
            }
            
            res.render('movies', { 
                title: 'Movies',
                movies: nowPlayingMovies,
                comingSoonMovies: comingSoonMovies 
            });
        });
    });
});


// Route for schedule page
app.get('/schedule', (req, res) => {
    const city = req.query.city || 'All'; // Default city is All
    let query;
    let queryParams = [];

    if (city === 'All') {
        query = `SELECT * FROM theaters`;
    } else {
        query = `SELECT * FROM theaters WHERE city = ?`;
        queryParams = [city];
    }

    db.query(query, queryParams, (err, results) => {
        if (err) {
            console.error('Error executing query:', err);
            return res.status(500).send('Internal Server Error');
        }
        res.render('schedule', { theaters: results, city });
    });
});

// Route for schedule detail page
app.get('/schedule_detail', (req, res) => {
    const theaterName = req.query.theater;

    if (!theaterName) {
        return res.status(400).send('Theater name is required');
    }

    const query = `
        SELECT 
            movies.title AS movie_title, 
            movies.poster AS movie_poster, 
            movies.genre AS genre, 
            movies.duration AS duration, 
            schedules.date, 
            GROUP_CONCAT(DISTINCT schedules.time ORDER BY schedules.time) AS showtimes, 
            theaters.name AS theater_name 
        FROM schedules 
        JOIN theaters ON schedules.theater_id = theaters.id 
        JOIN movies ON schedules.movie_id = movies.id 
        WHERE theaters.name = ? 
        GROUP BY movies.id, schedules.date, theaters.name
        ORDER BY schedules.date ASC;
    `;

    db.query(query, [theaterName], (err, results) => {
        if (err) {
            console.error('Error executing query:', err);
            return res.status(500).send('Internal Server Error');
        }

        // Generate unique dates and format them
        const seenDates = new Set();
        const dates = results
            .map(schedule => {
                const date = new Date(schedule.date);
                // Format date as "dd MMMM" (e.g., "30 November")
                const formattedDate = date.toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'long'
                });
                const originalDate = date.toLocaleDateString('en-GB'); // Original format "dd/mm/yyyy"
                return { original: originalDate, formatted: formattedDate };
            })
            .filter(date => {
                if (seenDates.has(date.original)) {
                    return false; // Skip duplicate dates
                }
                seenDates.add(date.original);
                return true;
            })
            .sort((a, b) => {
                const dateA = new Date(a.original.split('/').reverse().join('-')); // Convert to "yyyy-mm-dd"
                const dateB = new Date(b.original.split('/').reverse().join('-'));
                return dateA - dateB;
            });

        res.render('schedule_detail', { theaterName, schedules: results, dates });
    });
});



app.get('/cinema', (req, res) => {
    const { city, search } = req.query;

    // Base SQL query
    let sql = 'SELECT * FROM theaters WHERE 1=1';
    const params = [];

    // Tambahkan filter berdasarkan kota (jika ada)
    if (city) {
        sql += ' AND city = ?';
        params.push(city);
    }

    // Tambahkan filter berdasarkan pencarian nama bioskop (jika ada)
    if (search) {
        sql += ' AND name LIKE ?';
        params.push(`%${search}%`);
    }

    // Eksekusi query
    db.query(sql, params, (err, results) => {
        if (err) {
            console.error('Error executing query:', err);
            return res.status(500).send('Database error');
        }

        // Render halaman dengan data yang difilter
        res.render('cinema', { theaters: results, city, search });
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

app.get("/dashboard", (req, res) => {
    const queries = {
      movies: "SELECT COUNT(*) AS count FROM movies",
      theaters: "SELECT COUNT(*) AS count FROM theaters",
      comingSoon: "SELECT COUNT(*) AS count FROM comingsoon",
      schedules: "SELECT COUNT(*) AS count FROM schedules"
    };
  
    db.query(queries.movies, (err, movieResults) => {
      if (err) throw err;
      db.query(queries.theaters, (err, theaterResults) => {
        if (err) throw err;
        db.query(queries.comingSoon, (err, comingSoonResults) => {
          if (err) throw err;
          db.query(queries.schedules, (err, scheduleResults) => {
            if (err) throw err;
  
            res.render("dashboard", {
              moviesCount: movieResults[0].count,
              theatersCount: theaterResults[0].count,
              comingSoonCount: comingSoonResults[0].count,
              schedulesCount: scheduleResults[0].count
            });
          });
        });
      });
    });
  });


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
        res.redirect('/data');
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
        if (err) {
            console.error('Gagal mengambil data comingsoon:', err);
            return res.status(500).send('Terjadi kesalahan saat mengambil data.');
        }
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

// Route untuk menampilkan form edit
app.get('/edit_comingsoon/:id', (req, res) => {
    const comingsoonId = req.params.id;
    const query = 'SELECT * FROM comingsoon WHERE id = ?';

    db.query(query, [comingsoonId], (err, results) => {
        if (err) throw err;
        if (results.length > 0) {
            res.render('edit_coming_soon', { movie: results[0] });
        } else {
            res.status(404).send('Data comingsoon tidak ditemukan');
        }
    });
});

// Route untuk memproses update data comingsoon
app.post('/edit_comingsoon/:id', (req, res) => {
    const comingsoonId = req.params.id;
    const { title, genre, release_date, poster } = req.body;

    const query = 'UPDATE comingsoon SET title = ?, genre = ?, release_date = ?, poster = ? WHERE id = ?';
    db.query(query, [title, genre, release_date, poster, comingsoonId], (err, result) => {
        if (err) throw err;
        console.log(`Data comingsoon dengan ID ${comingsoonId} telah diperbarui`);
        res.redirect('/coming_soon');
    });
});


// Route untuk menghapus comingsoon
app.post('/delete_comingsoon/:id', (req, res) => {
    const comingsoonId = req.params.id;  // Pastikan nama variabel sesuai
    const query = 'DELETE FROM comingsoon WHERE id = ?';

    db.query(query, [comingsoonId], (err, result) => {
        if (err) {
            console.error('Gagal menghapus data:', err);
            return res.status(500).send('Terjadi kesalahan saat menghapus data.');
        }
        console.log(`Data comingsoon dengan ID ${comingsoonId} telah dihapus`);
        res.redirect('/coming_soon');  // Kembali ke halaman daftar comingsoon setelah menghapus
    });
});


// Route untuk menampilkan data schedule
app.get('/data_schedules', (req, res) => {
    // Ambil parameter halaman dari query string, default ke halaman 1
    const page = parseInt(req.query.page) || 1;
    const limit = 15; // Batasi 15 data per halaman
    const offset = (page - 1) * limit;

    // Ambil parameter pencarian `movie_id`
    const searchMovieId = req.query.searchMovieId || '';

    // Query untuk menghitung total jumlah schedule
    let countQuery = `
        SELECT COUNT(*) AS total FROM schedules
        JOIN movies ON schedules.movie_id = movies.id
        JOIN theaters ON schedules.theater_id = theaters.id
    `;

    // Query untuk mengambil data schedule berdasarkan halaman dan pencarian
    let dataQuery = `
        SELECT schedules.id, schedules.movie_id, theater_id ,schedules.date, schedules.time,movies.title AS movie_title, theaters.name AS theater_name
        FROM schedules
        JOIN movies ON schedules.movie_id = movies.id
        JOIN theaters ON schedules.theater_id = theaters.id
    `;

    // Tambahkan kondisi pencarian jika ada `searchMovieId`
    if (searchMovieId) {
        countQuery += ` WHERE schedules.movie_id = '${searchMovieId}'`;
        dataQuery += ` WHERE schedules.movie_id = '${searchMovieId}'`;
    }

    // Tambahkan limit dan offset untuk pagination
    dataQuery += ` LIMIT ${limit} OFFSET ${offset}`;

    db.query(countQuery, (err, countResults) => {
        if (err) {
            console.error('Gagal menghitung data:', err);
            res.send('Terjadi kesalahan saat menghitung data.');
        } else {
            const totalSchedules = countResults[0].total;
            const totalPages = Math.ceil(totalSchedules / limit);

            // Query data berdasarkan pagination dan pencarian
            db.query(dataQuery, (err, results) => {
                if (err) {
                    console.error('Gagal mengambil data:', err);
                    res.send('Terjadi kesalahan saat mengambil data.');
                } else {
                    // Render data menggunakan template EJS dengan pagination info dan search query
                    res.render('data_schedule', {
                        schedules: results,
                        currentPage: page,
                        totalPages: totalPages,
                        offset: offset,
                        searchMovieId: searchMovieId
                    });
                }
            });
        }
    });
});

// Route untuk menampilkan form penambahan schedule
app.get('/add_schedule', (req, res) => {
    res.render('add_schedule');
});

// Route untuk menambahkan schedule ke database
app.post('/add_schedule', (req, res) => {
    const { movie_id, theater_id, date } = req.body;

    // Query untuk menambahkan data schedule ke database
    const insertQuery = 'INSERT INTO schedules (movie_id, theater_id, date) VALUES (?, ?, ?)';
    db.query(insertQuery, [movie_id, theater_id, date], (err, result) => {
    if (err) {
        console.error('Gagal menambahkan schedule:', err);
        res.send('Terjadi kesalahan saat menambahkan schedule.');
    } else {
        res.redirect('/add_schedule?success=true');
    }
    });
});

// Route untuk menghapus schedule
app.post('/delete_schedule/:id', (req, res) => {
    const theaterId = req.params.id;
    const query = 'DELETE FROM schedules WHERE id = ?';

    db.query(query, [theaterId], (err, result) => {
        if (err) throw err;
        console.log(`Data Schedule denga ID ${theaterId} telah dihapus`);
        res.redirect('/data_schedules');
    });
});

// Route untuk menampilkan form edit schedule
app.get('/edit_schedule/:id', (req, res) => {
    const scheduleId = req.params.id;

    // Query untuk mengambil data jadwal berdasarkan ID
    const query = `
        SELECT schedules.id, schedules.date, schedules.movie_id, schedules.theater_id, 
        movies.title AS movie_title, theaters.name AS theater_name
        FROM schedules
        JOIN movies ON schedules.movie_id = movies.id
        JOIN theaters ON schedules.theater_id = theaters.id
        WHERE schedules.id = ?
    `;
    
    db.query(query, [scheduleId], (err, results) => {
        if (err) {
            console.error('Gagal mengambil data schedule:', err);
            res.send('Terjadi kesalahan saat mengambil data.');
        } else {
            const schedule = results[0];
            
            // Render form edit dengan data yang ada
            res.render('edit_schedule', {
                schedule: schedule
            });
        }
    });
});

// Route untuk menangani pengeditan schedule
app.post('/edit_schedule/:id', (req, res) => {
    const scheduleId = req.params.id;
    const { movie_id, theater_id, date } = req.body;

    // Query untuk memperbarui jadwal berdasarkan ID
    const query = `
        UPDATE schedules
        SET movie_id = ?, theater_id = ?, date = ?
        WHERE id = ?
    `;
    
    db.query(query, [movie_id, theater_id, date, scheduleId], (err, results) => {
        if (err) {
            console.error('Gagal mengupdate schedule:', err);
            res.send('Terjadi kesalahan saat memperbarui data.');
        } else {
            res.redirect(`/data_schedules`);
        }
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
