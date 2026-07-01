using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MoviesAPI.Migrations
{
    /// <inheritdoc />
    public partial class RenameTheaterTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_MoviesTheaters_Theater_TheaterId",
                table: "MoviesTheaters");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Theater",
                table: "Theater");

            migrationBuilder.RenameTable(
                name: "Theater",
                newName: "Theaters");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Theaters",
                table: "Theaters",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_MoviesTheaters_Theaters_TheaterId",
                table: "MoviesTheaters",
                column: "TheaterId",
                principalTable: "Theaters",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_MoviesTheaters_Theaters_TheaterId",
                table: "MoviesTheaters");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Theaters",
                table: "Theaters");

            migrationBuilder.RenameTable(
                name: "Theaters",
                newName: "Theater");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Theater",
                table: "Theater",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_MoviesTheaters_Theater_TheaterId",
                table: "MoviesTheaters",
                column: "TheaterId",
                principalTable: "Theater",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
