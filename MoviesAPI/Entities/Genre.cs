using MoviesAPI.DTOs;
using MoviesAPI.Validations;
using System.ComponentModel.DataAnnotations;

namespace MoviesAPI.Entities
{
    public class Genre:IId
    {
        public int Id { get; set; }
        [Required(ErrorMessage ="You must fill the {0} field")]
        [StringLength(maximumLength:50)]
        [FirstLetterUppercase]
        public required string Name { get; set; }

        //[Range(minimum:18,maximum:120)]
        //public int Age { get; set; }

        //[CreditCard]
        //public string? CreditCard { get; set; }

        //[Url]
        //public string? WebPage { get; set; }
    }
}
