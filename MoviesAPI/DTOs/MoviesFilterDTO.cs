using System.ComponentModel.DataAnnotations;

namespace MoviesAPI.DTOs
{
    public class MoviesFilterDTO
    {
        [Range(1, int.MaxValue)]
        public int Page { get; set; } = 1;
        [Range(1, 50)]
        public int RecordsPerPage { get; set; } = 10;
        internal PaginationDTO PaginationDTO
        {
            get { return new PaginationDTO() { Page = Page, RecordsPerPage = RecordsPerPage }; }
        }

        public string? Title { get; set; }
        public int GenreId { get; set; }
        public bool InTheaters { get; set; }
        public bool UpcomingReleases { get; set; }
    }
}
