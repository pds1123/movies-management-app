using MoviesAPI.DTOs;
using MoviesAPI.Entities;
using NetTopologySuite.Geometries;
using System.Linq.Expressions;

namespace MoviesAPI.Utilities;

public static class DtoMappings
{
    public static readonly Expression<Func<Genre, GenreDTO>> GenreProjection = genre => new GenreDTO
    {
        Id = genre.Id,
        Name = genre.Name
    };

    public static readonly Expression<Func<Actor, ActorDTO>> ActorProjection = actor => new ActorDTO
    {
        Id = actor.Id,
        Name = actor.Name,
        DateOfBirth = actor.DateOfBirth,
        Picture = actor.Picture
    };

    public static readonly Expression<Func<Actor, MovieActorDTO>> MovieActorProjection = actor => new MovieActorDTO
    {
        Id = actor.Id,
        Name = actor.Name,
        Picture = actor.Picture,
        Character = string.Empty
    };

    public static readonly Expression<Func<Theater, TheaterDTO>> TheaterProjection = theater => new TheaterDTO
    {
        Id = theater.Id,
        Name = theater.Name,
        Latitude = theater.Location.Y,
        Longitude = theater.Location.X
    };

    public static readonly Expression<Func<Movie, MovieDTO>> MovieProjection = movie => new MovieDTO
    {
        Id = movie.Id,
        Title = movie.Title,
        Trailer = movie.Trailer,
        ReleaseDate = movie.ReleaseDate,
        Poster = movie.Poster
    };

    public static readonly Expression<Func<Movie, MovieDetailsDTO>> MovieDetailsProjection = movie =>
        new MovieDetailsDTO
        {
            Id = movie.Id,
            Title = movie.Title,
            Trailer = movie.Trailer,
            ReleaseDate = movie.ReleaseDate,
            Poster = movie.Poster,
            Genres = movie.MoviesGenres.Select(movieGenre => new GenreDTO
            {
                Id = movieGenre.GenreId,
                Name = movieGenre.Genre.Name
            }).ToList(),
            Theaters = movie.MoviesTheaters.Select(movieTheater => new TheaterDTO
            {
                Id = movieTheater.TheaterId,
                Name = movieTheater.Theater.Name,
                Latitude = movieTheater.Theater.Location.Y,
                Longitude = movieTheater.Theater.Location.X
            }).ToList(),
            Actors = movie.MoviesActors.OrderBy(movieActor => movieActor.Order)
                .Select(movieActor => new MovieActorDTO
                {
                    Id = movieActor.ActorId,
                    Name = movieActor.Actor.Name,
                    Picture = movieActor.Actor.Picture,
                    Character = movieActor.Character
                }).ToList()
        };

    public static Actor ToEntity(this ActorCreationDTO dto) => new()
    {
        Name = dto.Name,
        DateOfBirth = dto.DateOfBirth
    };

    public static ActorDTO ToDto(this Actor actor) => new()
    {
        Id = actor.Id,
        Name = actor.Name,
        DateOfBirth = actor.DateOfBirth,
        Picture = actor.Picture
    };

    public static Theater ToEntity(this TheaterCreationDTO dto, GeometryFactory geometryFactory) => new()
    {
        Name = dto.Name,
        Location = geometryFactory.CreatePoint(new Coordinate(dto.Longitude, dto.Latitude))
    };

    public static TheaterDTO ToDto(this Theater theater) => new()
    {
        Id = theater.Id,
        Name = theater.Name,
        Latitude = theater.Location.Y,
        Longitude = theater.Location.X
    };

    public static Movie ToEntity(this MovieCreationDTO dto)
    {
        var movie = new Movie
        {
            Title = dto.Title,
            Trailer = dto.Trailer,
            ReleaseDate = dto.ReleaseDate
        };

        movie.ReplaceRelationships(dto);
        return movie;
    }

    public static void ApplyTo(this MovieCreationDTO dto, Movie movie)
    {
        movie.Title = dto.Title;
        movie.Trailer = dto.Trailer;
        movie.ReleaseDate = dto.ReleaseDate;
        movie.ReplaceRelationships(dto);
    }

    public static MovieDTO ToDto(this Movie movie) => new()
    {
        Id = movie.Id,
        Title = movie.Title,
        Trailer = movie.Trailer,
        ReleaseDate = movie.ReleaseDate,
        Poster = movie.Poster
    };

    private static void ReplaceRelationships(this Movie movie, MovieCreationDTO dto)
    {
        var genreIds = dto.GenresIds.Distinct().ToHashSet();
        movie.MoviesGenres.RemoveAll(item => !genreIds.Contains(item.GenreId));
        movie.MoviesGenres.AddRange(genreIds
            .Where(genreId => movie.MoviesGenres.All(item => item.GenreId != genreId))
            .Select(genreId => new MovieGenre { GenreId = genreId }));

        var theaterIds = dto.TheatersIds.Distinct().ToHashSet();
        movie.MoviesTheaters.RemoveAll(item => !theaterIds.Contains(item.TheaterId));
        movie.MoviesTheaters.AddRange(theaterIds
            .Where(theaterId => movie.MoviesTheaters.All(item => item.TheaterId != theaterId))
            .Select(theaterId => new MovieTheater { TheaterId = theaterId }));

        var actors = dto.Actors
            .GroupBy(actor => actor.Id)
            .Select(group => group.First())
            .ToList();
        var actorIds = actors.Select(actor => actor.Id).ToHashSet();
        movie.MoviesActors.RemoveAll(item => !actorIds.Contains(item.ActorId));

        for (var index = 0; index < actors.Count; index++)
        {
            var actorInput = actors[index];
            var movieActor = movie.MoviesActors.FirstOrDefault(item => item.ActorId == actorInput.Id);
            if (movieActor is null)
            {
                movieActor = new MovieActor { ActorId = actorInput.Id, Character = actorInput.Character };
                movie.MoviesActors.Add(movieActor);
            }

            movieActor.Character = actorInput.Character;
            movieActor.Order = index;
        }
    }
}
