using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;
using Microsoft.EntityFrameworkCore;
using MoviesAPI.DTOs;
using MoviesAPI.Entities;
using MoviesAPI.utilities;
using MoviesAPI.Utilities;
using System.Threading.Tasks;

namespace MoviesAPI.Controllers
{
    [Route("api/genres")]
    [ApiController]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Policy = "isadmin")]
    public class GenresController: CustomBaseController
    {
        
        //dependency injection
        private readonly IOutputCacheStore outputCacheStore;
        private readonly ApplicationDbContext context;
        private readonly IMapper mapper;
        private const string cacheTag = "genres";
        public GenresController (IOutputCacheStore outputCacheStore, ApplicationDbContext context, 
            IMapper mapper)
            :base(context,mapper,outputCacheStore,cacheTag)
        {
            this.outputCacheStore= outputCacheStore;
            this.context = context;
            this.mapper = mapper;
        }



        [HttpGet] //  api/genres
        [OutputCache(Tags = ["genres"], PolicyName = nameof(WithAuthorizeCachePolicy))]
        public async Task<List<GenreDTO>> Get([FromQuery] PaginationDTO pagination)
        {
            /*
            //return await context.Genres.ToListAsync();
            //return await context.Genres.ProjectTo<GenreDTO>(mapper.ConfigurationProvider).ToListAsync();
            var queryable = context.Genres;
            await HttpContext.InsertPaginationParametersInHeader(queryable);
            //return await context.Genres.ProjectTo<GenreDTO>(mapper.ConfigurationProvider).ToListAsync();
            return await queryable
                 .OrderBy(g => g.Name)
                 .Paginate(pagination)
                 .ProjectTo<GenreDTO>(mapper.ConfigurationProvider)
                 .ToListAsync();
            */
            return await Get<Genre, GenreDTO>(pagination, orderBy: g => g.Name);
        }

        [HttpGet("all")] //  api/genres
        [OutputCache(Tags = ["genres"])]
        [AllowAnonymous]
        public async Task<List<GenreDTO>> Get()
        {
            return await Get<Genre, GenreDTO>(orderBy: g => g.Name);
        }

        [HttpGet("{id:int}", Name ="GetGenreById")] //  api/genres/500
        [OutputCache(Tags = [cacheTag])]
        public async Task<ActionResult<GenreDTO>> Get(int id)
        {
            /*
            var genre = await context.Genres
                        .ProjectTo<GenreDTO>(mapper.ConfigurationProvider)
                        .FirstOrDefaultAsync(g => g.Id == id);
            if(genre is  null)
            {
                return NotFound();
            }
            return genre;*/
            return await Get<Genre, GenreDTO>(id);

        }

        [HttpGet("{name}")] //  api/genres/comedy?id=7
        [OutputCache(Tags = [cacheTag])]
        public async Task<ActionResult<Genre>> Get(string name, [FromQuery] int id)
        {
            return new Genre {Id=id, Name = name };

        }


        [HttpPost]
        public async Task< CreatedAtRouteResult> Post([FromBody] GenreCreationDTO genreCreationDTO)
        {
            /*
            //var genre = new Genre { Name = GenreCreationDTO.Name };
            var genre = mapper.Map<Genre>(genreCreationDTO);
            context.Add(genre);
            await context.SaveChangesAsync();
            await outputCacheStore.EvictByTagAsync(cacheTag, default);
            var genreDTO = mapper.Map<GenreDTO>(genre);
            return CreatedAtRoute("GetGenreById", new { id = genreDTO.Id }, genreDTO);*/

            return await Post<GenreCreationDTO, Genre, GenreDTO>(genreCreationDTO, routeName: "GetGenreById");
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Put(int id, [FromBody] GenreCreationDTO genreCreationDTO)
        {
            /*
            var genreExists = await context.Genres.AnyAsync(g=> g.Id == id);

            if(!genreExists)
            {
                return NotFound();
            }

            var genre = mapper.Map<Genre>(genreCreationDTO);
            genre.Id = id;

            context.Update(genre);
            await context.SaveChangesAsync();
            await outputCacheStore.EvictByTagAsync(cacheTag, default);

            return NoContent();*/
            return await Put<GenreCreationDTO, Genre>(id, genreCreationDTO);


        }

        [HttpDelete("{id:int}")]
        public  async Task<IActionResult> Delete(int id)
        {
            /*
            var deleteRecords = await context.Genres.Where(g => g.Id == id).ExecuteDeleteAsync();

            if(deleteRecords==0)
            {
                return NotFound();
            }

            await outputCacheStore.EvictByTagAsync(cacheTag, default);
            return NoContent();*/
            return await Delete<Genre>(id);
        }
    }
}
