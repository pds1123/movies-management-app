using MoviesAPI.DTOs;
using MoviesAPI.Entities;
using MoviesAPI.Utilities;

namespace MoviesAPI.Tests;

public sealed class DtoMappingsTests
{
    [Fact]
    public void MovieCreationMapping_CreatesRelationshipsInSubmittedOrder()
    {
        var input = new MovieCreationDTO
        {
            Title = "Mapped film",
            Trailer = "https://www.youtube.com/watch?v=test",
            ReleaseDate = new DateTime(2026, 9, 20),
            GenresIds = [3, 5],
            TheatersIds = [7],
            Actors =
            [
                new ActorMovieCreationDTO { Id = 11, Character = "Lead" },
                new ActorMovieCreationDTO { Id = 13, Character = "Friend" }
            ]
        };

        var movie = input.ToEntity();

        Assert.Equal(input.Title, movie.Title);
        Assert.Equal([3, 5], movie.MoviesGenres.Select(item => item.GenreId).Order());
        Assert.Equal([7], movie.MoviesTheaters.Select(item => item.TheaterId).Order());
        Assert.Equal([11, 13], movie.MoviesActors.Select(item => item.ActorId));
        Assert.Equal([0, 1], movie.MoviesActors.Select(item => item.Order));
    }

    [Fact]
    public void MovieUpdateMapping_PreservesPosterAndReplacesRelationships()
    {
        var movie = new Movie
        {
            Title = "Original",
            ReleaseDate = DateTime.Today,
            Poster = "existing-poster.jpg",
            MoviesGenres = [new MovieGenre { GenreId = 1 }],
            MoviesTheaters = [new MovieTheater { TheaterId = 2 }],
            MoviesActors = [new MovieActor { ActorId = 3, Character = "Original", Order = 0 }]
        };
        var input = new MovieCreationDTO
        {
            Title = "Updated",
            ReleaseDate = DateTime.Today.AddDays(1),
            GenresIds = [1, 4],
            TheatersIds = [2, 5],
            Actors =
            [
                new ActorMovieCreationDTO { Id = 3, Character = "Returning" },
                new ActorMovieCreationDTO { Id = 6, Character = "Updated" }
            ]
        };

        input.ApplyTo(movie);

        Assert.Equal("Updated", movie.Title);
        Assert.Equal("existing-poster.jpg", movie.Poster);
        Assert.Equal([1, 4], movie.MoviesGenres.Select(item => item.GenreId).Order());
        Assert.Equal([2, 5], movie.MoviesTheaters.Select(item => item.TheaterId).Order());
        Assert.Equal([3, 6], movie.MoviesActors.Select(item => item.ActorId));
        Assert.Equal(["Returning", "Updated"], movie.MoviesActors.Select(item => item.Character));
        Assert.Equal([0, 1], movie.MoviesActors.Select(item => item.Order));
    }
}
