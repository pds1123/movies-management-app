using AutoMapper;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using MoviesAPI;
using MoviesAPI.Services;
using MoviesAPI.utilities;
using MoviesAPI.Utilities;
using NetTopologySuite;
using NetTopologySuite.Geometries;
using System.Text;
using System.Threading.RateLimiting;



var builder = WebApplication.CreateBuilder(args);
builder.Services.AddControllers();
builder.Services.AddProblemDetails();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
// Add services to the container.

var configuredOrigins = builder.Configuration.GetValue<string>("AllowedOrigins");

if (!builder.Environment.IsDevelopment() && string.IsNullOrWhiteSpace(configuredOrigins))
{
    throw new InvalidOperationException(
        "AllowedOrigins is required in production and must contain the deployed frontend URL.");
}

var allowedOrigins = configuredOrigins?
    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
    ?? ["http://localhost:5173", "http://127.0.0.1:5173"];

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(optionsCORS =>
    {
        optionsCORS.WithOrigins(allowedOrigins).AllowAnyMethod().AllowAnyHeader()
        .WithExposedHeaders("total-records-count");
    });
});

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy("auth", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 10,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0,
                AutoReplenishment = true
            }));
});

builder.Services.AddHttpContextAccessor();
builder.Services.Configure<FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 6 * 1024 * 1024;
});

var useInMemoryDatabase = builder.Environment.IsDevelopment()
    && builder.Configuration.GetValue<bool>("UseInMemoryDatabase");

var defaultConnection = builder.Configuration.GetConnectionString("DefaultConnection");

if (!useInMemoryDatabase && string.IsNullOrWhiteSpace(defaultConnection))
{
    throw new InvalidOperationException(
        "ConnectionStrings:DefaultConnection is required when the in-memory database is disabled.");
}

builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    if (useInMemoryDatabase)
    {
        options.UseInMemoryDatabase("MoviesAPI-Development");
    }
    else
    {
        options.UseSqlServer(defaultConnection!,
            sqlServer =>
            {
                sqlServer.UseNetTopologySuite();
                sqlServer.EnableRetryOnFailure(5, TimeSpan.FromSeconds(10), null);
            });
    }
});

builder.Services.AddSingleton<GeometryFactory>(NtsGeometryServices.Instance.CreateGeometryFactory(srid:4326));

builder.Services.AddSingleton(provider => new MapperConfiguration(config =>
{
    var geometryFactory = provider.GetRequiredService<GeometryFactory>();
    config.AddProfile(new AutoMapperProfiles(geometryFactory));
}, provider.GetRequiredService<ILoggerFactory>()).CreateMapper());

var useAzureFileStorage = builder.Configuration.GetValue<bool>("UseAzureFileStorage");

if (useAzureFileStorage
    && string.IsNullOrWhiteSpace(builder.Configuration.GetConnectionString("AzureStorageConnection")))
{
    throw new InvalidOperationException(
        "ConnectionStrings:AzureStorageConnection is required when Azure file storage is enabled.");
}

if (useAzureFileStorage)
{
    builder.Services.AddTransient<IFileStorage, AzureFileStorage>();
}
else
{
    builder.Services.AddTransient<IFileStorage, LocalFileStorage>();
}
builder.Services.AddTransient<IUsersService, UsersService>();

builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
});

builder.Services.AddHealthChecks()
    .AddCheck("self", () => Microsoft.Extensions.Diagnostics.HealthChecks.HealthCheckResult.Healthy(),
        tags: ["live"])
    .AddCheck<DatabaseHealthCheck>("database", tags: ["ready"]);


//builder.Services.AddAutoMapper(typeof(Program));

builder.Services.AddIdentityCore<IdentityUser>(options =>
    {
        options.User.RequireUniqueEmail = true;
        options.Lockout.AllowedForNewUsers = true;
        options.Lockout.MaxFailedAccessAttempts = 5;
        options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
    })
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddDefaultTokenProviders();

builder.Services.AddScoped<UserManager<IdentityUser>>();
builder.Services.AddScoped<SignInManager<IdentityUser>>();

var jwtKey = builder.Configuration["jwtkey"];
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "MoviesAPI";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "MoviesClient";
var jwtExpirationMinutes = builder.Configuration.GetValue("Jwt:ExpirationMinutes", 480);

if (string.IsNullOrWhiteSpace(jwtKey) || Encoding.UTF8.GetByteCount(jwtKey) < 32)
{
    throw new InvalidOperationException("jwtkey must be configured with at least 32 bytes.");
}

if (jwtExpirationMinutes is < 15 or > 1440)
{
    throw new InvalidOperationException("Jwt:ExpirationMinutes must be between 15 and 1440.");
}

builder.Services.AddAuthentication().AddJwtBearer(opciones =>
{
    opciones.MapInboundClaims = false;

    opciones.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidIssuer = jwtIssuer,
        ValidateAudience = true,
        ValidAudience = jwtAudience,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ClockSkew = TimeSpan.Zero
    };

});

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("isadmin", policy => policy.RequireClaim("isadmin"));
});

builder.Services.AddOutputCache(options =>
{
    options.DefaultExpirationTimeSpan = TimeSpan.FromSeconds(60);
    options.AddPolicy(nameof(WithAuthorizeCachePolicy), WithAuthorizeCachePolicy.Instance);
});



var app = builder.Build();

if (useInMemoryDatabase)
{
    await LocalDevelopmentDataSeeder.SeedAsync(app.Services, app.Configuration);
}
else if (builder.Configuration.GetValue<bool>("ApplyMigrations"))
{
    using var scope = app.Services.CreateScope();
    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    await context.Database.MigrateAsync();
    await BootstrapAdminSeeder.SeedAsync(scope.ServiceProvider, app.Configuration);
}
else
{
    using var scope = app.Services.CreateScope();
    await BootstrapAdminSeeder.SeedAsync(scope.ServiceProvider, app.Configuration);
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
else
{
    app.UseExceptionHandler();
    app.UseHsts();
}

app.UseForwardedHeaders();

if (builder.Configuration.GetValue("UseHttpsRedirection", true))
{
    app.UseHttpsRedirection();
}

app.UseCors();

app.UseRateLimiter();

app.UseOutputCache();

app.UseStaticFiles();

app.UseAuthentication();
app.UseAuthorization();

app.MapHealthChecks("/health");
app.MapHealthChecks("/health/live", new HealthCheckOptions
{
    Predicate = registration => registration.Tags.Contains("live")
});
app.MapHealthChecks("/health/ready", new HealthCheckOptions
{
    Predicate = registration => registration.Tags.Contains("ready")
});
app.MapControllers();

app.Run();

public partial class Program;
