using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;
using Microsoft.EntityFrameworkCore;
using MoviesAPI.DTOs;
using MoviesAPI.Entities;
using MoviesAPI.utilities;
using MoviesAPI.Utilities;

namespace MoviesAPI.Controllers;

[Route("api/genres")]
[ApiController]
[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Policy = "isadmin")]
public class GenresController : ControllerBase
{
    private readonly IOutputCacheStore outputCacheStore;
    private readonly ApplicationDbContext context;
    private const string CacheTag = "genres";

    public GenresController(IOutputCacheStore outputCacheStore, ApplicationDbContext context)
    {
        this.outputCacheStore = outputCacheStore;
        this.context = context;
    }

    [HttpGet]
    [OutputCache(Tags = [CacheTag], PolicyName = nameof(WithAuthorizeCachePolicy))]
    public async Task<List<GenreDTO>> Get([FromQuery] PaginationDTO pagination)
    {
        var queryable = context.Genres.AsNoTracking();
        await HttpContext.InsertPaginationParametersInHeader(queryable);
        return await queryable
            .OrderBy(genre => genre.Name)
            .Paginate(pagination)
            .Select(DtoMappings.GenreProjection)
            .ToListAsync();
    }

    [HttpGet("all")]
    [OutputCache(Tags = [CacheTag])]
    [AllowAnonymous]
    public async Task<List<GenreDTO>> Get()
    {
        return await context.Genres
            .AsNoTracking()
            .OrderBy(genre => genre.Name)
            .Select(DtoMappings.GenreProjection)
            .ToListAsync();
    }

    [HttpGet("{id:int}", Name = "GetGenreById")]
    [OutputCache(Tags = [CacheTag])]
    public async Task<ActionResult<GenreDTO>> Get(int id)
    {
        var genre = await context.Genres
            .AsNoTracking()
            .Where(genre => genre.Id == id)
            .Select(DtoMappings.GenreProjection)
            .FirstOrDefaultAsync();

        return genre is null ? NotFound() : genre;
    }

    [HttpPost]
    public async Task<CreatedAtRouteResult> Post([FromBody] GenreCreationDTO genreCreationDTO)
    {
        var genre = new Genre { Name = genreCreationDTO.Name };
        context.Add(genre);
        await context.SaveChangesAsync();
        await outputCacheStore.EvictByTagAsync(CacheTag, default);
        var genreDTO = new GenreDTO { Id = genre.Id, Name = genre.Name };
        return CreatedAtRoute("GetGenreById", new { id = genreDTO.Id }, genreDTO);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Put(int id, [FromBody] GenreCreationDTO genreCreationDTO)
    {
        var genre = await context.Genres.FindAsync(id);
        if (genre is null)
        {
            return NotFound();
        }

        genre.Name = genreCreationDTO.Name;
        await context.SaveChangesAsync();
        await outputCacheStore.EvictByTagAsync(CacheTag, default);
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deletedRecords = await context.Genres
            .Where(genre => genre.Id == id)
            .ExecuteDeleteAsync();

        if (deletedRecords == 0)
        {
            return NotFound();
        }

        await outputCacheStore.EvictByTagAsync(CacheTag, default);
        return NoContent();
    }
}
