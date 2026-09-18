namespace MoviesAPI.DTOs;

public class ScreeningDTO
{
    public int Id { get; set; }
    public int MovieId { get; set; }
    public string MovieTitle { get; set; } = string.Empty;
    public int TheaterId { get; set; }
    public string TheaterName { get; set; } = string.Empty;
    public DateTimeOffset StartsAt { get; set; }
    public int Capacity { get; set; }
    public int AvailableSeats { get; set; }
    public string Status { get; set; } = string.Empty;
}
