// Function to filter schedules based on selected date
function filterSchedules(date) {
    const movies = document.querySelectorAll('#movies-list .movie');
    movies.forEach(movie => {
        const movieDate = movie.getAttribute('data-date');
        // Ensure both dates are in the same format for comparison
        if (movieDate === date) {
            movie.style.display = 'block';
        } else {
            movie.style.display = 'none';
        }
    });

    // Update active class on date selectors
    const dateSelectors = document.querySelectorAll('.date-selector div');
    dateSelectors.forEach(selector => {
        // Remove 'active' class from all selectors
        selector.classList.remove('active');
    });

    // Find and set the clicked date as active
    const clickedDate = Array.from(dateSelectors).find(selector => {
        // Compare the original date format with the clicked date
        const selectorDate = selector.getAttribute('onclick').match(/'(.*?)'/)[1];
        return selectorDate === date;
    });

    // Add 'active' class to the clicked selector if found
    if (clickedDate) {
        clickedDate.classList.add('active');
    }
}


// Set default filter to the first date on page load
document.addEventListener('DOMContentLoaded', () => {
    const firstDate = document.querySelector('.date-selector div');
    if (firstDate) {
        firstDate.click();
    }
});
