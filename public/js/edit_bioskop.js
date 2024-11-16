let deleteBtns = document.querySelectorAll('.delete-btn');
let deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));
let confirmDelete = document.getElementById('confirmDelete');
let deleteId = null;

deleteBtns.forEach(btn => {
    btn.addEventListener('click', function() {
        deleteId = btn.getAttribute('data-id');
        deleteModal.show();
    });
});

confirmDelete.addEventListener('click', function() {
    fetch(`/delete_bioskop/${deleteId}`, { method: 'DELETE' })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                window.location.reload();
            } else {
                alert('Failed to delete bioskop');
            }
        });
});