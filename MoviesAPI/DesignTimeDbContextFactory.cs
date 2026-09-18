using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace MoviesAPI;

public class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<ApplicationDbContext>
{
    public ApplicationDbContext CreateDbContext(string[] args)
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseSqlServer(
                "Server=localhost;Database=FrameCinemasDesignTime;User Id=design;Password=design-only;TrustServerCertificate=True",
                sqlServer => sqlServer.UseNetTopologySuite())
            .Options;

        return new ApplicationDbContext(options);
    }
}
