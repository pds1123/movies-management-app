namespace MoviesAPI.DTOs;

public class BookingDTO
{
    public int Id { get; set; }
    public int ScreeningId { get; set; }
    public string MovieTitle { get; set; } = string.Empty;
    public string TheaterName { get; set; } = string.Empty;
    public DateTimeOffset StartsAt { get; set; }
    public int TicketCount { get; set; }
    public string ConfirmationCode { get; set; } = string.Empty;
    public string CheckInToken { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? CheckedInAt { get; set; }
}
