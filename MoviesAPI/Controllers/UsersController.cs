using AutoMapper;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.IdentityModel.Tokens;
using MoviesAPI.DTOs;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace MoviesAPI.Controllers
{
    [ApiController]
    [Route("api/users")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Policy = "isadmin")]
    public class UsersController : CustomBaseController
    {
        private readonly UserManager<IdentityUser> userManager;
        private readonly SignInManager<IdentityUser> signInManager;
        private readonly IConfiguration configuration;
        private readonly ApplicationDbContext context;
        private readonly IOutputCacheStore outputCacheStore;
        private readonly IMapper mapper;
        private const string cacheTag = "users";

        public UsersController(UserManager<IdentityUser> userManager, SignInManager<IdentityUser> signInManager,
            IConfiguration configuration, ApplicationDbContext context, IOutputCacheStore outputCacheStore,
            IMapper mapper)
            : base(context, mapper, outputCacheStore, cacheTag)
        {
            this.userManager = userManager;
            this.signInManager = signInManager;
            this.configuration = configuration;
            this.context = context;
            this.outputCacheStore = outputCacheStore;
            this.mapper = mapper;
        }

        [HttpGet("usersList")]
        [OutputCache(Tags = [cacheTag])]
        public async Task<ActionResult<List<UserDTO>>> GetUsers([FromQuery] PaginationDTO paginationDTO)
        {
            return await Get<IdentityUser, UserDTO>(paginationDTO, orderBy: u => u.Email!);
        }

        [HttpPost("register")]
        [AllowAnonymous]
        [EnableRateLimiting("auth")]
        public async Task<ActionResult<AuthenticationResponseDTO>> Register(UserCredentialsDTO userCredentialsDTO)
        {
            var user = new IdentityUser
            {
                UserName = userCredentialsDTO.Email,
                Email = userCredentialsDTO.Email
            };

            var result = await userManager.CreateAsync(user, userCredentialsDTO.Password);

            if (result.Succeeded)
            {
                await outputCacheStore.EvictByTagAsync(cacheTag, default);
                return await BuildToken(user);
            }
            else
            {
                return BadRequest(result.Errors);
            }
        }

        [HttpPost("login")]
        [AllowAnonymous]
        [EnableRateLimiting("auth")]
        public async Task<ActionResult<AuthenticationResponseDTO>> Login(UserCredentialsDTO userCredentialsDTO)
        {
            var user = await userManager.FindByEmailAsync(userCredentialsDTO.Email);

            if (user is null)
            {
                var errors = BuildIncorrectLoginErrorMessage();
                return BadRequest(errors);
            }

            var result = await signInManager.CheckPasswordSignInAsync(user,
                userCredentialsDTO.Password, lockoutOnFailure: true);

            if (result.Succeeded)
            {
                return await BuildToken(user);
            }
            else
            {
                var errors = BuildIncorrectLoginErrorMessage();
                return BadRequest(errors);
            }
        }

        [HttpPost("makeadmin")]
        public async Task<IActionResult> MakeAdmin(EditClaimDTO editClaimDTO)
        {
            var user = await userManager.FindByEmailAsync(editClaimDTO.Email);

            if (user is null)
            {
                return NotFound();
            }

            var claims = await userManager.GetClaimsAsync(user);
            if (!claims.Any(claim => claim.Type == "isadmin"))
            {
                await userManager.AddClaimAsync(user, new Claim("isadmin", "true"));
            }

            return NoContent();
        }

        [HttpPost("removeadmin")]
        public async Task<IActionResult> RemoveAdmin(EditClaimDTO editClaimDTO)
        {
            var currentUserEmail = User.FindFirstValue("email");
            if (string.Equals(currentUserEmail, editClaimDTO.Email, StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest(new ProblemDetails
                {
                    Title = "You cannot remove your own administrator access.",
                    Status = StatusCodes.Status400BadRequest
                });
            }

            var user = await userManager.FindByEmailAsync(editClaimDTO.Email);

            if (user is null)
            {
                return NotFound();
            }

            var adminClaims = (await userManager.GetClaimsAsync(user))
                .Where(claim => claim.Type == "isadmin")
                .ToList();

            if (adminClaims.Count > 0)
            {
                await userManager.RemoveClaimsAsync(user, adminClaims);
            }

            return NoContent();
        }

        private IEnumerable<IdentityError> BuildIncorrectLoginErrorMessage()
        {
            var identityError = new IdentityError() { Description = "Incorrect login" };
            var errors = new List<IdentityError>();
            errors.Add(identityError);
            return errors;
        }

        private async Task<AuthenticationResponseDTO> BuildToken(IdentityUser user)
        {
            var claims = new List<Claim>
            {
                new Claim("email", user.Email!)
            };

            var claimsDB = await userManager.GetClaimsAsync(user);

            claims.AddRange(claimsDB);

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(configuration["jwtkey"]!));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var expirationMinutes = configuration.GetValue("Jwt:ExpirationMinutes", 480);
            var expiration = DateTime.UtcNow.AddMinutes(expirationMinutes);
            var issuer = configuration["Jwt:Issuer"] ?? "MoviesAPI";
            var audience = configuration["Jwt:Audience"] ?? "MoviesClient";

            var securityToken = new JwtSecurityToken(issuer: issuer, audience: audience, claims: claims,
                expires: expiration, signingCredentials: creds);

            var token = new JwtSecurityTokenHandler().WriteToken(securityToken);

            return new AuthenticationResponseDTO
            {
                Token = token,
                Expiration = expiration
            };
        }
    }
}
