using System.ComponentModel.DataAnnotations;

namespace MoviesAPI.DTOs
{
    public class PaginationDTO
    {
        [Range(1, int.MaxValue)]
        public int Page { get; set; } = 1;

        private int recordsPerPage = 10;
        private int maximumAmountOfRecordsPerPage = 50;

        public int RecordsPerPage 
        { 
            get { return recordsPerPage; }
            set
            {
                recordsPerPage = Math.Clamp(value, 1, maximumAmountOfRecordsPerPage);
            } 
        }
    }
}
