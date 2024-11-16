// JavaScript untuk menangani submit form tanpa reload halaman
document.getElementById("uploadForm").addEventListener("submit", function(event) {
    event.preventDefault(); // Mencegah form melakukan refresh halaman secara default
    
    const formData = new FormData(this);

    // Mengirim data dengan fetch
    fetch("/tambah", {
        method: "POST",
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Tampilkan notifikasi sukses
            const notif = document.getElementById("notif");
            notif.classList.remove("d-none");
            notif.textContent = data.message;

            // // Mengarahkan ke halaman data.ejs setelah beberapa detik
            // setTimeout(() => {
            //     window.location.href = "/data";
            // }, 2000); // Waktu delay 2 detik sebelum halaman diarahkan
        }
    })
    .catch(error => console.error("Error:", error));
});
