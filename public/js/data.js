document.querySelectorAll(".delete-btn").forEach(button => {
    button.addEventListener("click", function() {
        const movieId = this.getAttribute("data-id");
        deleteMovie(movieId);
    });
});

function deleteMovie(id) {
    if (confirm("Are you sure you want to delete this movie?")) {
        fetch(`/delete/${id}`, {
            method: "POST",
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert(data.message);
                location.reload();
            } else {
                alert("Failed to delete movie.");
            }
        })
        .catch(error => console.error("Error:", error));
    }
}
