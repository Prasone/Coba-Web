const express = require('express');
const app = express();
const Movie = require('./Movie');
const Schedule = require('./models/Schedule');
const expressLayouts = require('express-ejs-layouts');

app.set('view engine', 'ejs');
app.use(expressLayouts);
app.use(express.static('public'));

// Route Home
app.get('/', (req, res) => {
    res.render('layout', { title: 'Home' });
});



// Route Schedule
app.get('/schedule', async (req, res) => {
    try {
        const schedule = await Schedule.findAll();
        res.render('schedule', { title: 'Schedule', schedule });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error retrieving schedule.");
    }
});

app.listen(3000, () => console.log('Server berjalan di http://localhost:3000'));
