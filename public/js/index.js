// --- MOVIE SLIDER LOGIC ---
let movieIndex = 0; // Variabel untuk index film
const movieList = document.querySelector('.movie-list');
const movieItems = document.querySelectorAll('.movie-item'); // Pastikan .movie-item terdeteksi
const totalMovies = Math.ceil(movieItems.length / 3); // Total group film
const gap = parseInt(window.getComputedStyle(movieList).gap, 10); // Gap antar item
const itemWidth = movieItems[0].offsetWidth; // Lebar satu item

function slideMovies() {
    // Geser movie list berdasarkan index saat ini
    const offset = -(movieIndex * (itemWidth + gap)); // Perhitungan offset
    movieList.style.transform = `translateX(${offset}px)`; // Geser movie list ke kiri

    // Jika sudah di akhir, kembali ke awal
    movieIndex++;
    if (movieIndex >= totalMovies) {
        movieIndex = 0; // Reset ke awal
    }
}

// Panggil fungsi slide setiap 3 detik
setInterval(slideMovies, 3000);

// --- BANNER SLIDER LOGIC ---
let bannerIndex = 0; // Index slide aktif
const slides = document.querySelector('.slides');
const totalSlides = document.querySelectorAll('.slide').length; // Total slide

function showSlide(index) {
    // Cek batas index (loop kembali ke awal atau akhir)
    if (index >= totalSlides) {
        bannerIndex = 0; // Kembali ke slide pertama
    } else if (index < 0) {
        bannerIndex = totalSlides - 1; // Kembali ke slide terakhir
    } else {
        bannerIndex = index;
    }

    // Geser slide sesuai index
    slides.style.transform = `translateX(-${bannerIndex * 100}%)`;
}

function nextSlide() {
    showSlide(bannerIndex + 1);
}

function prevSlide() {
    showSlide(bannerIndex - 1);
}

// Geser otomatis setiap 5 detik
setInterval(() => {
    nextSlide();
}, 5000);
