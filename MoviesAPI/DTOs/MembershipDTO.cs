namespace MoviesAPI.DTOs;

public class MembershipDTO
{
    public string? MembershipNumber { get; set; }
    public required string Status { get; set; }
    public DateTimeOffset? JoinedAt { get; set; }
    public DateTimeOffset? UpdatedAt { get; set; }
}
