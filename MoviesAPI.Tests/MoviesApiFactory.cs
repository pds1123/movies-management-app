using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;

namespace MoviesAPI.Tests;

public sealed class MoviesApiFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");
        builder.ConfigureAppConfiguration((_, configuration) =>
        {
            configuration.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["UseInMemoryDatabase"] = "true",
                ["UseHttpsRedirection"] = "false",
                ["AllowedOrigins"] = "http://localhost:5173",
                ["UseAzureFileStorage"] = "false",
                ["jwtkey"] = "movies-api-tests-use-a-dedicated-signing-key-2026",
                ["Jwt:Issuer"] = "MoviesAPI.Tests",
                ["Jwt:Audience"] = "MoviesClient.Tests",
                ["Jwt:ExpirationMinutes"] = "30"
            });
        });
    }
}
