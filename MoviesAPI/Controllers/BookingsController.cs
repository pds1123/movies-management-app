using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MoviesAPI.DTOs;
using MoviesAPI.Entities;
using System.Data;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;

namespace MoviesAPI.Controllers;

[ApiController]
[Route("api/bookings")]
[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
public class BookingsController(ApplicationDbContext context, UserManager<IdentityUser> userManager) : ControllerBase
{
    [HttpGet("mine")]
    public async Task<ActionResult<List<BookingDTO>>> Mine()
    {
        var userId = await GetUserId();
        if (userId is null)
        {
            return Unauthorized();
        }

        var bookings = await context.Bookings
            .AsNoTracking()
            .Include(booking => booking.Screening).ThenInclude(screening => screening.Movie)
            .Include(booking => booking.Screening).ThenInclude(screening => screening.Theater)
            .Where(booking => booking.UserId == userId)
            .OrderByDescending(booking => booking.Screening.StartsAt)
            .ToListAsync();

        return bookings.Select(ToDTO).ToList();
    }

    [HttpPost("screening/{screeningId:int}")]
    public async Task<ActionResult<BookingDTO>> Post(int screeningId)
    {
        var userId = await GetUserId();
        if (userId is null)
        {
            return Unauthorized();
        }

        var hasActiveMembership = await context.Memberships.AnyAsync(membership =>
            membership.UserId == userId && membership.Status == MembershipStatus.Active);
        if (!hasActiveMembership)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new ProblemDetails
            {
                Title = "An active FRAME CINEMAS membership is required to reserve a screening.",
                Status = StatusCodes.Status403Forbidden
            });
        }

        if (!context.Database.IsRelational())
        {
            return await CreateBooking(screeningId, userId, useTransaction: false);
        }

        var executionStrategy = context.Database.CreateExecutionStrategy();
        return await executionStrategy.ExecuteAsync(() =>
            CreateBooking(screeningId, userId, useTransaction: true));
    }

    private async Task<ActionResult<BookingDTO>> CreateBooking(
        int screeningId,
        string userId,
        bool useTransaction)
    {
        await using var transaction = useTransaction
            ? await context.Database.BeginTransactionAsync(IsolationLevel.Serializable)
            : null;

        var screening = await context.Screenings
            .Include(item => item.Bookings)
            .Include(item => item.Movie)
            .Include(item => item.Theater)
            .FirstOrDefaultAsync(item => item.Id == screeningId);

        if (screening is null)
        {
            return NotFound();
        }

        if (screening.Status != ScreeningStatus.Scheduled || screening.StartsAt <= DateTimeOffset.UtcNow)
        {
            return Conflict(new ProblemDetails
            {
                Title = "This screening is no longer available for reservations.",
                Status = StatusCodes.Status409Conflict
            });
        }

        var existingBooking = screening.Bookings.FirstOrDefault(booking => booking.UserId == userId);
        if (existingBooking is not null && existingBooking.Status != BookingStatus.Cancelled)
        {
            return Conflict(new ProblemDetails
            {
                Title = "You already have a reservation for this screening.",
                Status = StatusCodes.Status409Conflict
            });
        }

        var reservedSeats = screening.Bookings
            .Where(booking => booking.Status is BookingStatus.Confirmed or BookingStatus.CheckedIn)
            .Sum(booking => booking.TicketCount);

        if (reservedSeats + 1 > screening.Capacity)
        {
            return Conflict(new ProblemDetails
            {
                Title = "There are not enough places left for this reservation.",
                Status = StatusCodes.Status409Conflict
            });
        }

        var booking = existingBooking ?? new Booking
        {
            ScreeningId = screeningId,
            UserId = userId,
            ConfirmationCode = CreateConfirmationCode(),
            CheckInToken = Convert.ToHexString(RandomNumberGenerator.GetBytes(16))
        };

        booking.TicketCount = 1;
        booking.Status = BookingStatus.Confirmed;
        booking.CreatedAt = DateTimeOffset.UtcNow;
        booking.CheckedInAt = null;

        if (existingBooking is null)
        {
            context.Add(booking);
        }

        await context.SaveChangesAsync();
        if (transaction is not null)
        {
            await transaction.CommitAsync();
        }

        booking.Screening = screening;
        return CreatedAtAction(nameof(Get), new { id = booking.Id }, ToDTO(booking));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<BookingDTO>> Get(int id)
    {
        var userId = await GetUserId();
        if (userId is null)
        {
            return Unauthorized();
        }

        var isAdmin = User.HasClaim("isadmin", "true");
        var booking = await context.Bookings
            .AsNoTracking()
            .Include(item => item.Screening).ThenInclude(screening => screening.Movie)
            .Include(item => item.Screening).ThenInclude(screening => screening.Theater)
            .Where(item => item.Id == id && (isAdmin || item.UserId == userId))
            .FirstOrDefaultAsync();

        return booking is null ? NotFound() : ToDTO(booking);
    }

    [HttpDelete("{id:int}")]
    public async Task<ActionResult> Cancel(int id)
    {
        var userId = await GetUserId();
        if (userId is null)
        {
            return Unauthorized();
        }

        var booking = await context.Bookings
            .Include(item => item.Screening)
            .FirstOrDefaultAsync(item => item.Id == id && item.UserId == userId);

        if (booking is null)
        {
            return NotFound();
        }

        if (booking.Status != BookingStatus.Confirmed || booking.Screening.StartsAt <= DateTimeOffset.UtcNow)
        {
            return Conflict(new ProblemDetails
            {
                Title = "This reservation can no longer be cancelled.",
                Status = StatusCodes.Status409Conflict
            });
        }

        booking.Status = BookingStatus.Cancelled;
        await context.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("check-in/{token}")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Policy = "isadmin")]
    public async Task<ActionResult<BookingDTO>> CheckIn(string token)
    {
        var booking = await context.Bookings
            .Include(item => item.Screening).ThenInclude(screening => screening.Movie)
            .Include(item => item.Screening).ThenInclude(screening => screening.Theater)
            .FirstOrDefaultAsync(item => item.CheckInToken == token);

        if (booking is null)
        {
            return NotFound();
        }

        if (booking.Status != BookingStatus.Confirmed)
        {
            return Conflict(new ProblemDetails
            {
                Title = $"This reservation is {booking.Status.ToString().ToLowerInvariant()}.",
                Status = StatusCodes.Status409Conflict
            });
        }

        booking.Status = BookingStatus.CheckedIn;
        booking.CheckedInAt = DateTimeOffset.UtcNow;
        await context.SaveChangesAsync();
        return ToDTO(booking);
    }

    private async Task<string?> GetUserId()
    {
        var userId = User.FindFirstValue(JwtRegisteredClaimNames.Sub)
            ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!string.IsNullOrWhiteSpace(userId))
        {
            return userId;
        }

        var email = User.FindFirstValue("email") ?? User.FindFirstValue(ClaimTypes.Email);
        return string.IsNullOrWhiteSpace(email)
            ? null
            : (await userManager.FindByEmailAsync(email))?.Id;
    }

    private static string CreateConfirmationCode()
    {
        var value = Convert.ToHexString(RandomNumberGenerator.GetBytes(4));
        return $"FC-{value[..4]}-{value[4..]}";
    }

    private static BookingDTO ToDTO(Booking booking)
    {
        return new BookingDTO
        {
            Id = booking.Id,
            ScreeningId = booking.ScreeningId,
            MovieTitle = booking.Screening.Movie.Title,
            TheaterName = booking.Screening.Theater.Name,
            StartsAt = booking.Screening.StartsAt,
            TicketCount = booking.TicketCount,
            ConfirmationCode = booking.ConfirmationCode,
            CheckInToken = booking.CheckInToken,
            Status = booking.Status.ToString(),
            CreatedAt = booking.CreatedAt,
            CheckedInAt = booking.CheckedInAt
        };
    }
}
