using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;
using MoviesAPI.Validations;

namespace MoviesAPI.Tests;

public sealed class ImageFileAttributeTests
{
    [Fact]
    public void ValidJpeg_IsAccepted()
    {
        using var stream = new MemoryStream([0xFF, 0xD8, 0xFF]);
        var file = CreateFile(stream, "poster.jpg", "image/jpeg");

        var result = Validate(file);

        Assert.Equal(ValidationResult.Success, result);
    }

    [Fact]
    public void UnsupportedFileType_IsRejected()
    {
        using var stream = new MemoryStream("not an image"u8.ToArray());
        var file = CreateFile(stream, "poster.txt", "text/plain");

        var result = Validate(file);

        Assert.NotEqual(ValidationResult.Success, result);
    }

    [Fact]
    public void ImageLargerThanFiveMegabytes_IsRejected()
    {
        using var stream = new MemoryStream(new byte[(5 * 1024 * 1024) + 1]);
        var file = CreateFile(stream, "poster.jpg", "image/jpeg");

        var result = Validate(file);

        Assert.NotEqual(ValidationResult.Success, result);
    }

    private static FormFile CreateFile(Stream stream, string fileName, string contentType)
    {
        return new FormFile(stream, 0, stream.Length, "file", fileName)
        {
            Headers = new HeaderDictionary(),
            ContentType = contentType
        };
    }

    private static ValidationResult? Validate(IFormFile file)
    {
        var attribute = new ImageFileAttribute();
        return attribute.GetValidationResult(file, new ValidationContext(file));
    }
}
