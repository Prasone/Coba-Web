// Tampilkan notifikasi jika ada query string `success=true`
const params = new URLSearchParams(window.location.search);
if (params.get('success') === 'true') {
    const notif = document.getElementById('notif');
    if (notif) { // Pastikan elemen notif ada di DOM
        notif.textContent = 'Data berhasil ditambahkan!';
        notif.classList.remove('d-none');
    }
}