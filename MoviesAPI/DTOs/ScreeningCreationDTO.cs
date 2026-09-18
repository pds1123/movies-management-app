using System.ComponentModel.DataAnnotations;

namespace MoviesAPI.DTOs;

public class ScreeningCreationDTO
{
    [Range(1, int.MaxValue)]
    public int MovieId { get; set; }

    [Range(1, int.MaxValue)]
    public int TheaterId { get; set; }

    public DateTimeOffset StartsAt { get; set; }

    [Range(1, 1000)]
    public int Capacity { get; set; }
}
