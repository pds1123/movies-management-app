using System.ComponentModel.DataAnnotations;

namespace MoviesAPI.Validations;

[AttributeUsage(AttributeTargets.Property | AttributeTargets.Parameter)]
public sealed class ImageFileAttribute : ValidationAttribute
{
    private const long MaxFileSize = 5 * 1024 * 1024;
    private static readonly HashSet<string> AllowedExtensions =
        new(StringComparer.OrdinalIgnoreCase) { ".jpg", ".jpeg", ".png", ".webp" };
    private static readonly HashSet<string> AllowedContentTypes =
        new(StringComparer.OrdinalIgnoreCase) { "image/jpeg", "image/png", "image/webp" };

    protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
    {
        if (value is null)
        {
            return ValidationResult.Success;
        }

        if (value is not IFormFile file)
        {
            return new ValidationResult("The uploaded file is invalid.");
        }

        if (file.Length == 0)
        {
            return new ValidationResult("The image file is empty.");
        }

        if (file.Length > MaxFileSize)
        {
            return new ValidationResult("The image must be 5 MB or smaller.");
        }

        var extension = Path.GetExtension(file.FileName);
        if (!AllowedExtensions.Contains(extension) || !AllowedContentTypes.Contains(file.ContentType))
        {
            return new ValidationResult("Only JPG, PNG, and WebP images are allowed.");
        }

        return ValidationResult.Success;
    }
}
