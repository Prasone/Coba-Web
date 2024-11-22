document.addEventListener('DOMContentLoaded', function () {
    // Tampilkan notifikasi jika ada query string `success=true`
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
        const notif = document.getElementById('notif');
        if (notif) { // Pastikan elemen notif ada di DOM
            notif.textContent = 'Bioskop berhasil ditambahkan!';
            notif.classList.remove('d-none');
        }
    }

    // Menghapus bioskop
    let deleteBtns = document.querySelectorAll('.delete-btn');
    let deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));
    let confirmDelete = document.getElementById('confirmDelete');
    let deleteId = null;

    deleteBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            deleteId = btn.getAttribute('data-id');
            deleteModal.show();
        });
    });

    deleteBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            const deleteId = btn.getAttribute('data-id');
            if (confirm('Apakah Anda yakin ingin menghapus bioskop ini?')) {
                fetch(`/delete_bioskop/${deleteId}`, { method: 'DELETE' })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            window.location.reload();
                        } else {
                            alert('Failed to delete bioskop');
                        }
                    })
                    .catch(err => console.error(err));
            }
        });
    });
});
