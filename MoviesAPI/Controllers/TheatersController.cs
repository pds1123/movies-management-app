using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;
using Microsoft.EntityFrameworkCore;
using MoviesAPI.DTOs;
using MoviesAPI.utilities;
using MoviesAPI.Utilities;
using NetTopologySuite.Geometries;

namespace MoviesAPI.Controllers;

[Route("api/theaters")]
[ApiController]
[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Policy = "isadmin")]
public class TheatersController : ControllerBase
{
    private readonly ApplicationDbContext context;
    private readonly IOutputCacheStore outputCacheStore;
    private readonly GeometryFactory geometryFactory;
    private const string CacheTag = "theaters";

    public TheatersController(ApplicationDbContext context,
        IOutputCacheStore outputCacheStore, GeometryFactory geometryFactory)
    {
        this.context = context;
        this.outputCacheStore = outputCacheStore;
        this.geometryFactory = geometryFactory;
    }

    [HttpGet]
    [OutputCache(Tags = [CacheTag])]
    public async Task<List<TheaterDTO>> Get([FromQuery] PaginationDTO pagination)
    {
        var queryable = context.Theaters.AsNoTracking();
        await HttpContext.InsertPaginationParametersInHeader(queryable);
        return await queryable
            .OrderBy(theater => theater.Name)
            .Paginate(pagination)
            .Select(DtoMappings.TheaterProjection)
            .ToListAsync();
    }

    [HttpGet("{id:int}", Name = "GetTheaterById")]
    [OutputCache(Tags = [CacheTag])]
    public async Task<ActionResult<TheaterDTO>> Get(int id)
    {
        var theater = await context.Theaters
            .AsNoTracking()
            .Where(theater => theater.Id == id)
            .Select(DtoMappings.TheaterProjection)
            .FirstOrDefaultAsync();

        return theater is null ? NotFound() : theater;
    }

    [HttpPost]
    public async Task<CreatedAtRouteResult> Post([FromBody] TheaterCreationDTO theaterCreationDTO)
    {
        var theater = theaterCreationDTO.ToEntity(geometryFactory);
        context.Add(theater);
        await context.SaveChangesAsync();
        await outputCacheStore.EvictByTagAsync(CacheTag, default);
        return CreatedAtRoute("GetTheaterById", new { id = theater.Id }, theater.ToDto());
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Put(int id, [FromBody] TheaterCreationDTO theaterCreationDTO)
    {
        var theater = await context.Theaters.FindAsync(id);
        if (theater is null)
        {
            return NotFound();
        }

        theater.Name = theaterCreationDTO.Name;
        theater.Location = geometryFactory.CreatePoint(
            new Coordinate(theaterCreationDTO.Longitude, theaterCreationDTO.Latitude));
        await context.SaveChangesAsync();
        await outputCacheStore.EvictByTagAsync(CacheTag, default);
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deletedRecords = await context.Theaters
            .Where(theater => theater.Id == id)
            .ExecuteDeleteAsync();

        if (deletedRecords == 0)
        {
            return NotFound();
        }

        await outputCacheStore.EvictByTagAsync(CacheTag, default);
        return NoContent();
    }
}
