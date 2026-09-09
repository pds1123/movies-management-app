using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;

namespace MoviesAPI.Services
{
    public class AzureFileStorage : IFileStorage
    {
        private readonly string connectionString;

        public AzureFileStorage(IConfiguration configuration) 
        {
            connectionString = configuration.GetConnectionString("AzureStorageConnection")!;
        }
        
        public async Task Delete(string? route, string container)
        {
            if (string.IsNullOrEmpty(route)) 
            {
                return;
            }

            var client = new BlobContainerClient(connectionString, container);
            await client.CreateIfNotExistsAsync(PublicAccessType.Blob);
            var fileName = Path.GetFileName(route);
            var blob = client.GetBlobClient(fileName);
            await blob.DeleteIfExistsAsync();
        }
        public async Task<string> Store(string container, IFormFile file)
        {
            var client = new BlobContainerClient(connectionString, container);
            await client.CreateIfNotExistsAsync(PublicAccessType.Blob);

            var extension = Path.GetExtension(file.FileName);
            var fileName = $"{Guid.NewGuid()}{extension}";
            var blob = client.GetBlobClient(fileName);
            var options = new BlobUploadOptions
            {
                HttpHeaders = new BlobHttpHeaders { ContentType = file.ContentType }
            };

            await using var input = file.OpenReadStream();
            await blob.UploadAsync(input, options);
            return blob.Uri.ToString();

        }
    }
}
