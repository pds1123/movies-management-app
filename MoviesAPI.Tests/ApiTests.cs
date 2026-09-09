using System.Net;
using System.Net.Http.Json;
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
        var credentials = new { email = "missing@tests.invalid", password = "Wrong123!" };

        for (var attempt = 0; attempt < 10; attempt++)
        {
            var response = await client.PostAsJsonAsync("/api/users/login", credentials);
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        var limitedResponse = await client.PostAsJsonAsync("/api/users/login", credentials);
        Assert.Equal(HttpStatusCode.TooManyRequests, limitedResponse.StatusCode);
    }
}
