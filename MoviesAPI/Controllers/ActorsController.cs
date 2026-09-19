using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;
using Microsoft.EntityFrameworkCore;
using MoviesAPI.DTOs;
using MoviesAPI.Services;
using MoviesAPI.utilities;
using MoviesAPI.Utilities;

namespace MoviesAPI.Controllers;

[Route("api/actors")]
[ApiController]
[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Policy = "isadmin")]
public class ActorsController : ControllerBase
{
    private readonly ApplicationDbContext context;
    private readonly IOutputCacheStore outputCacheStore;
    private readonly IFileStorage fileStorage;
    private const string CacheTag = "actors";
    private const string Container = "actors";

    public ActorsController(ApplicationDbContext context,
        IOutputCacheStore outputCacheStore, IFileStorage fileStorage)
    {
        this.context = context;
        this.outputCacheStore = outputCacheStore;
        this.fileStorage = fileStorage;
    }

    [HttpGet]
    [OutputCache(Tags = [CacheTag])]
    public async Task<List<ActorDTO>> Get([FromQuery] PaginationDTO pagination)
    {
        var queryable = context.Actors.AsNoTracking();
        await HttpContext.InsertPaginationParametersInHeader(queryable);
        return await queryable
            .OrderBy(actor => actor.Name)
            .Paginate(pagination)
            .Select(DtoMappings.ActorProjection)
            .ToListAsync();
    }

    [HttpGet("{id:int}", Name = "GetActorById")]
    [OutputCache(Tags = [CacheTag])]
    public async Task<ActionResult<ActorDTO>> Get(int id)
    {
        var actor = await context.Actors
            .AsNoTracking()
            .Where(actor => actor.Id == id)
            .Select(DtoMappings.ActorProjection)
            .FirstOrDefaultAsync();

        return actor is null ? NotFound() : actor;
    }

    [HttpGet("{name}")]
    public async Task<ActionResult<List<MovieActorDTO>>> Get(string name)
    {
        return await context.Actors
            .AsNoTracking()
            .Where(actor => actor.Name.Contains(name))
            .Select(DtoMappings.MovieActorProjection)
            .ToListAsync();
    }

    [HttpPost]
    public async Task<CreatedAtRouteResult> Post([FromForm] ActorCreationDTO actorCreationDTO)
    {
        var actor = actorCreationDTO.ToEntity();

        if (actorCreationDTO.Picture is not null)
        {
            actor.Picture = await fileStorage.Store(Container, actorCreationDTO.Picture);
        }

        context.Add(actor);
        await context.SaveChangesAsync();
        await outputCacheStore.EvictByTagAsync(CacheTag, default);
        return CreatedAtRoute("GetActorById", new { id = actor.Id }, actor.ToDto());
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Put(int id, [FromForm] ActorCreationDTO actorCreationDTO)
    {
        var actor = await context.Actors.FirstOrDefaultAsync(actor => actor.Id == id);
        if (actor is null)
        {
            return NotFound();
        }

        actor.Name = actorCreationDTO.Name;
        actor.DateOfBirth = actorCreationDTO.DateOfBirth;

        if (actorCreationDTO.Picture is not null)
        {
            actor.Picture = await fileStorage.Edit(actor.Picture, Container, actorCreationDTO.Picture);
        }

        await context.SaveChangesAsync();
        await outputCacheStore.EvictByTagAsync(CacheTag, default);
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var actor = await context.Actors.FirstOrDefaultAsync(actor => actor.Id == id);
        if (actor is null)
        {
            return NotFound();
        }

        context.Remove(actor);
        await context.SaveChangesAsync();
        await outputCacheStore.EvictByTagAsync(CacheTag, default);
        await fileStorage.Delete(actor.Picture, Container);
        return NoContent();
    }
}
