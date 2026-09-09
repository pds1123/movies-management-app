using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace MoviesAPI.Services;

public sealed class DatabaseHealthCheck(IServiceScopeFactory scopeFactory) : IHealthCheck
{
    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        try
        {
            using var scope = scopeFactory.CreateScope();
            var database = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var canConnect = await database.Database.CanConnectAsync(cancellationToken);

            return canConnect
                ? HealthCheckResult.Healthy()
                : HealthCheckResult.Unhealthy("The database is unavailable.");
        }
        catch (Exception exception)
        {
            return HealthCheckResult.Unhealthy("The database health check failed.", exception);
        }
    }
}
