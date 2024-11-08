// Route Movies
app.get('/movies', async (req, res) => {
    try {
        const movies = await Movie.findAll();
        res.render('movies', { title: 'Movies', movies });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error retrieving movies.");
    }
});