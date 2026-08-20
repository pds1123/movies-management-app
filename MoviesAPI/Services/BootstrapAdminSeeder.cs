using Microsoft.AspNetCore.Identity;
using System.Security.Claims;

namespace MoviesAPI.Services;

public static class BootstrapAdminSeeder
{
    public static async Task SeedAsync(IServiceProvider services, IConfiguration configuration)
    {
        var email = configuration["BootstrapAdmin:Email"];
        var password = configuration["BootstrapAdmin:Password"];

        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
        {
            return;
        }

        var userManager = services.GetRequiredService<UserManager<IdentityUser>>();
        var admin = await userManager.FindByEmailAsync(email);

        if (admin is null)
        {
            admin = new IdentityUser
            {
                UserName = email,
                Email = email,
                EmailConfirmed = true
            };

            var result = await userManager.CreateAsync(admin, password);
            if (!result.Succeeded)
            {
                var errors = string.Join(", ", result.Errors.Select(error => error.Description));
                throw new InvalidOperationException($"Unable to create the bootstrap admin user: {errors}");
            }
        }

        var claims = await userManager.GetClaimsAsync(admin);
        if (!claims.Any(claim => claim.Type == "isadmin"))
        {
            await userManager.AddClaimAsync(admin, new Claim("isadmin", "true"));
        }
    }
}
