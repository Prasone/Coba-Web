const express = require("express");
const mysql = require("mysql");
const multer = require("multer");
const path = require("path");

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set("view engine", "ejs");
app.set("views", "views");
app.use('/uploads', express.static('uploads'));

// Inisialisasi koneksi ke db
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    database: "cinema", // Pastikan nama database benar
    password: ""
});

db.connect((err) => {
    if (err) throw err;
    console.log("Connected to MySQL");
});

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

// Route untuk menampilkan form
app.get("/", (req, res) => {
    res.render("admin");
});

// Route untuk menampilkan data film
app.get("/data", (req, res) => {
    const sql = "SELECT * FROM movies";
    db.query(sql, (err, results) => {
        if (err) throw err;
        res.render("data", { movies: results });
    });
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
app.get("/edit/:id", (req, res) => {
    const movieId = req.params.id;
    const sql = "SELECT * FROM movies WHERE id = ?";
    db.query(sql, [movieId], (err, results) => {
        if (err) throw err;
        res.render("edit", { movie: results[0] }); // Render halaman edit.ejs dengan data film yang akan di-edit
    });
});

// Route untuk meng-handle update data
app.post("/edit/:id", upload.single("poster"), (req, res) => {
    const movieId = req.params.id;
    const { title, description, genre, duration, release_date, rating } = req.body;
    let sql;
    let params;

    if (req.file) {
        // Jika ada file baru yang di-upload
        const poster = req.file.filename;
        sql = "UPDATE movies SET title = ?, description = ?, genre = ?, duration = ?, release_date = ?, rating = ?, poster = ? WHERE id = ?";
        params = [title, description, genre, duration, release_date, rating, poster, movieId];
    } else {
        // Jika tidak ada file baru yang di-upload
        sql = "UPDATE movies SET title = ?, description = ?, genre = ?, duration = ?, release_date = ?, rating = ? WHERE id = ?";
        params = [title, description, genre, duration, release_date, rating, movieId];
    }

    db.query(sql, params, (err, result) => {
        if (err) throw err;
        console.log("Data film berhasil diperbarui");
        res.redirect("/data"); // Redirect ke halaman data setelah update
    });
});


app.listen(8100, () => {
    console.log("Server Ready on http://localhost:8100");
});
