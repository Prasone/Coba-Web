// Menampilkan form edit dengan data yang sudah ada
function editMovie(id) {
    const movies = JSON.parse(document.getElementById('moviesData').value); // Mendapatkan data film dari elemen tersembunyi
    const movie = movies.find(m => m._id === id);
    document.getElementById('editMovieId').value = movie._id;
    document.getElementById('editTitle').value = movie.title;
    document.getElementById('editDescription').value = movie.description;
    document.getElementById('editDuration').value = movie.duration;
    document.getElementById('editGenre').value = movie.genre;
    document.getElementById('editReleaseDate').value = movie.release_date;

    document.getElementById('editForm').style.display = 'block';
}

// Menyimpan perubahan ke server
function saveChanges() {
    const movieId = document.getElementById('editMovieId').value;
    const updatedMovie = {
        title: document.getElementById('editTitle').value,
        description: document.getElementById('editDescription').value,
        duration: document.getElementById('editDuration').value,
        genre: document.getElementById('editGenre').value,
        release_date: document.getElementById('editReleaseDate').value
    };

    fetch(`/api/movies/${movieId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedMovie)
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
        window.location.reload(); // Reload halaman untuk memperbarui data
    })
    .catch(error => console.error('Error:', error));
}
