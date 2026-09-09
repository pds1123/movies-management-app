using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using MoviesAPI.Validations;

namespace MoviesAPI.DTOs
{
    public class ActorCreationDTO
    {
        [Required]
        [StringLength(150)]
        public required string Name { get; set; }
        public DateTime DateOfBirth { get; set; }
        [ImageFile]
        public IFormFile? Picture { get; set; }
    }
}
