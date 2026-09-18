using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations;

namespace MoviesAPI.Entities;

public class Booking
{
    public int Id { get; set; }
    public int ScreeningId { get; set; }

    [Required]
    public required string UserId { get; set; }

    [Range(1, 10)]
    public int TicketCount { get; set; }

    [Required, StringLength(20)]
    public required string ConfirmationCode { get; set; }

    [Required, StringLength(64)]
    public required string CheckInToken { get; set; }

    public BookingStatus Status { get; set; } = BookingStatus.Confirmed;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? CheckedInAt { get; set; }
    public Screening Screening { get; set; } = null!;
    public IdentityUser User { get; set; } = null!;
}
