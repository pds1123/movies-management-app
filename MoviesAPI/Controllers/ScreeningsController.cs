using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MoviesAPI.DTOs;
using MoviesAPI.Entities;

namespace MoviesAPI.Controllers;

[ApiController]
[Route("api/screenings")]
public class ScreeningsController(ApplicationDbContext context) : ControllerBase
{
    [HttpGet("movie/{movieId:int}")]
    [AllowAnonymous]
    public async Task<ActionResult<List<ScreeningDTO>>> GetForMovie(int movieId)
    {
        var screenings = await context.Screenings
            .AsNoTracking()
            .Include(screening => screening.Movie)
            .Include(screening => screening.Theater)
            .Include(screening => screening.Bookings)
            .Where(screening => screening.MovieId == movieId
                && screening.Status == ScreeningStatus.Scheduled
                && screening.StartsAt > DateTimeOffset.UtcNow)
            .OrderBy(screening => screening.StartsAt)
            .ToListAsync();

        return screenings.Select(ToDTO).ToList();
    }

    [HttpGet("{id:int}")]
    [AllowAnonymous]
    public async Task<ActionResult<ScreeningDTO>> Get(int id)
    {
        var screening = await context.Screenings
            .AsNoTracking()
            .Include(item => item.Movie)
            .Include(item => item.Theater)
            .Include(item => item.Bookings)
            .FirstOrDefaultAsync(item => item.Id == id);

        return screening is null ? NotFound() : ToDTO(screening);
    }

    [HttpPost]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Policy = "isadmin")]
    public async Task<ActionResult<ScreeningDTO>> Post(ScreeningCreationDTO creationDTO)
    {
        var validationError = await ValidateScreening(creationDTO);
        if (validationError is not null)
        {
            return BadRequest(validationError);
        }

        var screening = new Screening
        {
            MovieId = creationDTO.MovieId,
            TheaterId = creationDTO.TheaterId,
            StartsAt = creationDTO.StartsAt.ToUniversalTime(),
            Capacity = creationDTO.Capacity
        };

        context.Add(screening);
        await context.SaveChangesAsync();

        var result = await GetScreeningDTO(screening.Id);
        return CreatedAtAction(nameof(Get), new { id = screening.Id }, result);
    }

    [HttpPut("{id:int}")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Policy = "isadmin")]
    public async Task<ActionResult> Put(int id, ScreeningCreationDTO creationDTO)
    {
        var screening = await context.Screenings
            .Include(item => item.Bookings)
            .FirstOrDefaultAsync(item => item.Id == id);

        if (screening is null)
        {
            return NotFound();
        }

        var validationError = await ValidateScreening(creationDTO);
        if (validationError is not null)
        {
            return BadRequest(validationError);
        }

        var reservedSeats = screening.Bookings
            .Where(booking => booking.Status is BookingStatus.Confirmed or BookingStatus.CheckedIn)
            .Sum(booking => booking.TicketCount);

        if (creationDTO.Capacity < reservedSeats)
        {
            return Conflict(new ProblemDetails
            {
                Title = "Capacity cannot be lower than the number of reserved seats.",
                Status = StatusCodes.Status409Conflict
            });
        }

        screening.MovieId = creationDTO.MovieId;
        screening.TheaterId = creationDTO.TheaterId;
        screening.StartsAt = creationDTO.StartsAt.ToUniversalTime();
        screening.Capacity = creationDTO.Capacity;
        await context.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("{id:int}")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Policy = "isadmin")]
    public async Task<ActionResult> Cancel(int id)
    {
        var screening = await context.Screenings
            .Include(item => item.Bookings)
            .FirstOrDefaultAsync(item => item.Id == id);
        if (screening is null)
        {
            return NotFound();
        }

        screening.Status = ScreeningStatus.Cancelled;
        foreach (var booking in screening.Bookings.Where(item => item.Status == BookingStatus.Confirmed))
        {
            booking.Status = BookingStatus.Cancelled;
        }

        await context.SaveChangesAsync();
        return NoContent();
    }

    private async Task<ProblemDetails?> ValidateScreening(ScreeningCreationDTO creationDTO)
    {
        if (creationDTO.StartsAt <= DateTimeOffset.UtcNow)
        {
            return new ProblemDetails
            {
                Title = "The screening must start in the future.",
                Status = StatusCodes.Status400BadRequest
            };
        }

        var movieExists = await context.Movies.AnyAsync(movie => movie.Id == creationDTO.MovieId);
        var theaterExists = await context.Theaters.AnyAsync(theater => theater.Id == creationDTO.TheaterId);
        if (!movieExists || !theaterExists)
        {
            return new ProblemDetails
            {
                Title = "The selected movie or theater does not exist.",
                Status = StatusCodes.Status400BadRequest
            };
        }

        var movieIsAtTheater = await context.MoviesTheaters.AnyAsync(link =>
            link.MovieId == creationDTO.MovieId && link.TheaterId == creationDTO.TheaterId);

        if (!movieIsAtTheater)
        {
            return new ProblemDetails
            {
                Title = "The selected theater is not assigned to this movie.",
                Status = StatusCodes.Status400BadRequest
            };
        }

        return null;
    }

    private async Task<ScreeningDTO> GetScreeningDTO(int id)
    {
        var screening = await context.Screenings
            .AsNoTracking()
            .Include(screening => screening.Movie)
            .Include(screening => screening.Theater)
            .Include(screening => screening.Bookings)
            .Where(screening => screening.Id == id)
            .SingleAsync();

        return ToDTO(screening);
    }

    private static ScreeningDTO ToDTO(Screening screening)
    {
        var reservedSeats = screening.Bookings
            .Where(booking => booking.Status == BookingStatus.Confirmed
                || booking.Status == BookingStatus.CheckedIn)
            .Sum(booking => booking.TicketCount);

        return new ScreeningDTO
        {
            Id = screening.Id,
            MovieId = screening.MovieId,
            MovieTitle = screening.Movie.Title,
            TheaterId = screening.TheaterId,
            TheaterName = screening.Theater.Name,
            StartsAt = screening.StartsAt,
            Capacity = screening.Capacity,
            AvailableSeats = Math.Max(0, screening.Capacity - reservedSeats),
            Status = screening.Status.ToString()
        };
    }
}
