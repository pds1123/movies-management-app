using System.ComponentModel.DataAnnotations;

namespace MoviesAPI.Entities;

public class Screening
{
    public int Id { get; set; }
    public int MovieId { get; set; }
    public int TheaterId { get; set; }
    public DateTimeOffset StartsAt { get; set; }

    [Range(1, 1000)]
    public int Capacity { get; set; }

    public ScreeningStatus Status { get; set; } = ScreeningStatus.Scheduled;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public Movie Movie { get; set; } = null!;
    public Theater Theater { get; set; } = null!;
    public List<Booking> Bookings { get; set; } = [];
}
