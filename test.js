// Route untuk menangani form submit
app.post("/add_bioskop", (req, res) => {
    const { name, location, city, contact } = req.body;

    const sql = "INSERT INTO theaters (name, location, city, contact) VALUES (?, ?, ?, ?)";
    db.query(sql, [name, location, city, contact], (err, result) => {
        if (err) throw err;
        console.log("Data film berhasil disimpan");
        res.json({ success: true, message: "Film berhasil ditambahkan!" });
    });
});