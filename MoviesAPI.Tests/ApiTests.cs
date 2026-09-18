using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using MoviesAPI;
using MoviesAPI.Entities;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text.Json;

namespace MoviesAPI.Tests;

public sealed class ApiTests(MoviesApiFactory factory) : IClassFixture<MoviesApiFactory>
{
    private readonly HttpClient client = factory.CreateClient();

    [Fact]
    public async Task LandingPage_IsPublicAndReturnsBothCollections()
    {
        var response = await client.GetAsync("/api/movies/landing");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        using var body = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        Assert.Equal(JsonValueKind.Array, body.RootElement.GetProperty("inTheaters").ValueKind);
        Assert.Equal(JsonValueKind.Array, body.RootElement.GetProperty("upcomingReleases").ValueKind);
    }

    [Fact]
    public async Task ManagementEndpoint_RejectsAnonymousUsers()
    {
        var response = await client.GetAsync("/api/genres?page=1&recordsPerPage=5");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task MovieFilter_RejectsInvalidPagination()
    {
        var response = await client.GetAsync("/api/movies/filter?page=-1&recordsPerPage=5");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Theory]
    [InlineData("/health/live")]
    [InlineData("/health/ready")]
    public async Task HealthChecks_ReportHealthy(string endpoint)
    {
        var response = await client.GetAsync(endpoint);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task LoginEndpoint_IsRateLimited()
    {
        await using var isolatedFactory = new MoviesApiFactory();
        using var rateLimitClient = isolatedFactory.CreateClient();
        var credentials = new { email = "missing@tests.invalid", password = "Wrong123!" };

        for (var attempt = 0; attempt < 10; attempt++)
        {
            var response = await rateLimitClient.PostAsJsonAsync("/api/users/login", credentials);
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        var limitedResponse = await rateLimitClient.PostAsJsonAsync("/api/users/login", credentials);
        Assert.Equal(HttpStatusCode.TooManyRequests, limitedResponse.StatusCode);
    }

    [Fact]
    public async Task BookingFlow_CreatesCredentialAndReturnsItInMyBookings()
    {
        var userId = Guid.NewGuid().ToString();
        var email = $"booking-{Guid.NewGuid():N}@tests.invalid";
        var otherUserId = Guid.NewGuid().ToString();
        var otherEmail = $"other-{Guid.NewGuid():N}@tests.invalid";
        const string password = "BookingTest123!";
        int screeningId;
        int movieId;

        using (var scope = factory.Services.CreateScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var userManager = scope.ServiceProvider.GetRequiredService<UserManager<IdentityUser>>();
            var user = new IdentityUser
            {
                Id = userId,
                UserName = email,
                Email = email
            };
            var userResult = await userManager.CreateAsync(user, password);
            Assert.True(userResult.Succeeded);
            var claimResult = await userManager.AddClaimAsync(user, new Claim("isadmin", "true"));
            Assert.True(claimResult.Succeeded);

            var otherUser = new IdentityUser
            {
                Id = otherUserId,
                UserName = otherEmail,
                Email = otherEmail
            };
            var otherUserResult = await userManager.CreateAsync(otherUser, password);
            Assert.True(otherUserResult.Succeeded);

            var theater = new Theater
            {
                Name = "Test Cinema",
                Location = new NetTopologySuite.Geometries.Point(174.76, -36.85) { SRID = 4326 }
            };
            var movie = new Movie
            {
                Title = "Booking Test Film",
                ReleaseDate = DateTime.Today
            };
            context.AddRange(movie, theater);
            await context.SaveChangesAsync();
            context.MoviesTheaters.Add(new MovieTheater { MovieId = movie.Id, TheaterId = theater.Id });
            var screening = new Screening
            {
                MovieId = movie.Id,
                TheaterId = theater.Id,
                StartsAt = DateTimeOffset.UtcNow.AddDays(2),
                Capacity = 20
            };
            context.Add(screening);
            await context.SaveChangesAsync();
            screeningId = screening.Id;
            movieId = movie.Id;
        }

        using var authenticatedClient = factory.CreateClient();
        var loginResponse = await authenticatedClient.PostAsJsonAsync(
            "/api/users/login", new { email, password });
        Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);
        using var loginBody = JsonDocument.Parse(await loginResponse.Content.ReadAsStringAsync());
        authenticatedClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue(
            "Bearer", loginBody.RootElement.GetProperty("token").GetString());

        var createResponse = await authenticatedClient.PostAsJsonAsync(
            $"/api/bookings/screening/{screeningId}", new { ticketCount = 2, userId = otherUserId });

        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);
        var createResponseBody = await createResponse.Content.ReadAsStringAsync();
        using var createdBody = JsonDocument.Parse(createResponseBody);
        var bookingId = createdBody.RootElement.GetProperty("id").GetInt32();
        Assert.StartsWith("FC-", createdBody.RootElement.GetProperty("confirmationCode").GetString());
        Assert.Equal(1, createdBody.RootElement.GetProperty("ticketCount").GetInt32());

        using (var scope = factory.Services.CreateScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var storedBooking = await context.Bookings.FindAsync(bookingId);
            Assert.NotNull(storedBooking);
            Assert.Equal(userId, storedBooking.UserId);
        }

        using var otherUserClient = factory.CreateClient();
        var otherLoginResponse = await otherUserClient.PostAsJsonAsync(
            "/api/users/login", new { email = otherEmail, password });
        Assert.Equal(HttpStatusCode.OK, otherLoginResponse.StatusCode);
        using var otherLoginBody = JsonDocument.Parse(await otherLoginResponse.Content.ReadAsStringAsync());
        otherUserClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue(
            "Bearer", otherLoginBody.RootElement.GetProperty("token").GetString());

        Assert.Equal(HttpStatusCode.NotFound,
            (await otherUserClient.GetAsync($"/api/bookings/{bookingId}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound,
            (await otherUserClient.DeleteAsync($"/api/bookings/{bookingId}")).StatusCode);

        var mineResponse = await authenticatedClient.GetAsync("/api/bookings/mine");
        Assert.Equal(HttpStatusCode.OK, mineResponse.StatusCode);
        using var mineBody = JsonDocument.Parse(await mineResponse.Content.ReadAsStringAsync());
        Assert.Contains(mineBody.RootElement.EnumerateArray(), item =>
            item.GetProperty("screeningId").GetInt32() == screeningId);

        var cancelScreeningResponse = await authenticatedClient.DeleteAsync($"/api/screenings/{screeningId}");
        Assert.Equal(HttpStatusCode.NoContent, cancelScreeningResponse.StatusCode);

        var cancelledMineResponse = await authenticatedClient.GetAsync("/api/bookings/mine");
        using var cancelledMineBody = JsonDocument.Parse(await cancelledMineResponse.Content.ReadAsStringAsync());
        var cancelledBooking = cancelledMineBody.RootElement.EnumerateArray()
            .Single(item => item.GetProperty("screeningId").GetInt32() == screeningId);
        Assert.Equal("Cancelled", cancelledBooking.GetProperty("status").GetString());

        var deleteMovieResponse = await authenticatedClient.DeleteAsync($"/api/movies/{movieId}");
        Assert.Equal(HttpStatusCode.NoContent, deleteMovieResponse.StatusCode);

        using (var scope = factory.Services.CreateScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            Assert.False(await context.Movies.AnyAsync(item => item.Id == movieId));
            Assert.False(await context.Screenings.AnyAsync(item => item.Id == screeningId));
            Assert.False(await context.Bookings.AnyAsync(item => item.Id == bookingId));
        }
    }

}
