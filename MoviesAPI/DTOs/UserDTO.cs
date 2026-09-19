namespace MoviesAPI.DTOs
{
    public class UserDTO
    {
        public required string Id { get; set; }
        public required string Email { get; set; }
        public string? MembershipNumber { get; set; }
        public required string MembershipStatus { get; set; }
    }
}
