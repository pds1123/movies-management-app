using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations;

namespace MoviesAPI.Entities;

public class Membership
{
    public int Id { get; set; }

    [Required]
    public required string UserId { get; set; }

    [Required, StringLength(20)]
    public required string MembershipNumber { get; set; }

    public MembershipStatus Status { get; set; } = MembershipStatus.Active;
    public DateTimeOffset JoinedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    public IdentityUser User { get; set; } = null!;
}
