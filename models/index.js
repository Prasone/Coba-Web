const Movie = require('.Movie.js');
const Schedule = require('./Schedule');

// Sinkronisasi model dengan database
sequelize.sync()
    .then(() => console.log('Model berhasil disinkronisasi dengan database.'))
    .catch(err => console.error('Gagal sinkronisasi model:', err));
