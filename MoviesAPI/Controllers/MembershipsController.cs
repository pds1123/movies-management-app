using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;
using Microsoft.EntityFrameworkCore;
using MoviesAPI.DTOs;
using MoviesAPI.Entities;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;

namespace MoviesAPI.Controllers;

[ApiController]
[Route("api/memberships")]
[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
public class MembershipsController(
    ApplicationDbContext context,
    UserManager<IdentityUser> userManager,
    IOutputCacheStore outputCacheStore)
    : ControllerBase
{
    [HttpGet("mine")]
    public async Task<ActionResult<MembershipDTO>> Mine()
    {
        var userId = await GetUserId();
        if (userId is null)
        {
            return Unauthorized();
        }

        var membership = await context.Memberships
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.UserId == userId);

        return membership is null
            ? new MembershipDTO { Status = "Non-member" }
            : ToDTO(membership);
    }

    [HttpPost("activate")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Policy = "isadmin")]
    public async Task<ActionResult<MembershipDTO>> Activate(EditClaimDTO editDTO)
    {
        var user = await userManager.FindByEmailAsync(editDTO.Email);
        if (user is null)
        {
            return NotFound();
        }

        var membership = await context.Memberships
            .FirstOrDefaultAsync(item => item.UserId == user.Id);

        if (membership is null)
        {
            membership = new Membership
            {
                UserId = user.Id,
                MembershipNumber = await CreateMembershipNumber(),
                Status = MembershipStatus.Active
            };
            context.Add(membership);
        }
        else
        {
            membership.Status = MembershipStatus.Active;
            membership.UpdatedAt = DateTimeOffset.UtcNow;
        }

        await context.SaveChangesAsync();
        await outputCacheStore.EvictByTagAsync("users", default);
        return ToDTO(membership);
    }

    [HttpPost("cancel")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Policy = "isadmin")]
    public async Task<ActionResult<MembershipDTO>> Cancel(EditClaimDTO editDTO)
    {
        var user = await userManager.FindByEmailAsync(editDTO.Email);
        if (user is null)
        {
            return NotFound();
        }

        var membership = await context.Memberships
            .FirstOrDefaultAsync(item => item.UserId == user.Id);
        if (membership is null)
        {
            return NotFound(new ProblemDetails
            {
                Title = "This user does not have a membership.",
                Status = StatusCodes.Status404NotFound
            });
        }

        membership.Status = MembershipStatus.Cancelled;
        membership.UpdatedAt = DateTimeOffset.UtcNow;
        await context.SaveChangesAsync();
        await outputCacheStore.EvictByTagAsync("users", default);
        return ToDTO(membership);
    }

    private async Task<string> CreateMembershipNumber()
    {
        string number;
        do
        {
            number = $"FC-{Convert.ToHexString(RandomNumberGenerator.GetBytes(3))}";
        }
        while (await context.Memberships.AnyAsync(item => item.MembershipNumber == number));

        return number;
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

    private static MembershipDTO ToDTO(Membership membership)
    {
        return new MembershipDTO
        {
            MembershipNumber = membership.MembershipNumber,
            Status = membership.Status.ToString(),
            JoinedAt = membership.JoinedAt,
            UpdatedAt = membership.UpdatedAt
        };
    }
}
