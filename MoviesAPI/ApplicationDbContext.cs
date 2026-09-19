using MoviesAPI.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;

namespace MoviesAPI
{
    public class ApplicationDbContext : IdentityDbContext
    {
        public ApplicationDbContext(DbContextOptions options) : base(options)
        {

        }
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<MovieGenre>().HasKey(e => new { e.GenreId, e.MovieId });
            modelBuilder.Entity<MovieTheater>().HasKey(e => new { e.TheaterId, e.MovieId });
            modelBuilder.Entity<MovieActor>().HasKey(e => new { e.ActorId, e.MovieId });

            modelBuilder.Entity<Screening>()
                .HasOne(screening => screening.Movie)
                .WithMany(movie => movie.Screenings)
                .HasForeignKey(screening => screening.MovieId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Screening>()
                .HasOne(screening => screening.Theater)
                .WithMany(theater => theater.Screenings)
                .HasForeignKey(screening => screening.TheaterId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Booking>()
                .HasOne(booking => booking.Screening)
                .WithMany(screening => screening.Bookings)
                .HasForeignKey(booking => booking.ScreeningId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Booking>()
                .HasOne(booking => booking.User)
                .WithMany()
                .HasForeignKey(booking => booking.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Booking>()
                .HasIndex(booking => new { booking.ScreeningId, booking.UserId })
                .IsUnique();

            modelBuilder.Entity<Booking>()
                .HasIndex(booking => booking.ConfirmationCode)
                .IsUnique();

            modelBuilder.Entity<Booking>()
                .HasIndex(booking => booking.CheckInToken)
                .IsUnique();

            modelBuilder.Entity<Membership>()
                .HasOne(membership => membership.User)
                .WithMany()
                .HasForeignKey(membership => membership.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Membership>()
                .HasIndex(membership => membership.UserId)
                .IsUnique();

            modelBuilder.Entity<Membership>()
                .HasIndex(membership => membership.MembershipNumber)
                .IsUnique();
        }

        public DbSet<Genre> Genres { get; set; }
        public DbSet<Actor> Actors { get; set; }
        public DbSet<Theater> Theaters { get; set; }
        public DbSet<Movie> Movies { get; set; }
        public DbSet<MovieGenre> MoviesGenres { get; set; }
        public DbSet<MovieTheater> MoviesTheaters { get; set; }
        public DbSet<MovieActor> MoviesActors { get; set; }
        public DbSet<Rating> MovieRatings { get; set; }
        public DbSet<Screening> Screenings { get; set; }
        public DbSet<Booking> Bookings { get; set; }
        public DbSet<Membership> Memberships { get; set; }
    }
}
