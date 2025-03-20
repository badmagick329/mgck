using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CoreApi.WebApi.Migrations
{
    /// <inheritdoc />
    public partial class OriginPathField : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "OriginPath",
                table: "FeedbackComments",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "OriginPath",
                table: "FeedbackComments");
        }
    }
}
