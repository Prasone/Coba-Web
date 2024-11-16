let currentIndex = 0;
const movieList = document.querySelector('.movie-list');
const movieItems = document.querySelectorAll('.movie-item'); // Pastikan .movie-item terdeteksi
const totalMovies = (movieItems.length/2)+2;

// Mengambil gap dari CSS untuk memastikan perhitungan tepat
const gap = parseInt(window.getComputedStyle(movieList).gap, 10); 
const itemWidth = movieItems[0].offsetWidth;

function slideMovies() {
    // Geser movie list berdasarkan index saat ini
    const offset = -(currentIndex * (itemWidth + gap)); // Perhitungan offset dengan memperhitungkan gap
    movieList.style.transform = `translateX(${offset}px)`; // Geser movie list ke kiri

    // Jika sudah di akhir, kembali ke awal
    currentIndex++;
    if (currentIndex >= totalMovies) {
        currentIndex = 0; // Reset ke awal
    }
}

// Panggil fungsi slide setiap 3 detik
setInterval(slideMovies, 3000);
