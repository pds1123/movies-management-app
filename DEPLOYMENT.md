# FRAME CINEMAS deployment configuration

This file lists the settings required by the application. Do not place real passwords, connection strings, or JWT keys in Git.

## Vercel frontend

Set the project root to `react-movies` and add this environment variable for Production and Preview:

```text
VITE_API_URL=https://your-api-host.azurewebsites.net/api
```

Redeploy the frontend after changing `VITE_API_URL`; Vite reads it at build time.

## Azure API

Configure these application settings in Azure App Service:

```text
ASPNETCORE_ENVIRONMENT=Production
AllowedOrigins=https://your-frontend.vercel.app
UseAzureFileStorage=true
UseHttpsRedirection=true
ApplyMigrations=true
ConnectionStrings__DefaultConnection=<Azure SQL connection string>
ConnectionStrings__AzureStorageConnection=<Azure Storage connection string>
jwtkey=<random secret of at least 32 bytes>
Jwt__Issuer=MoviesAPI
Jwt__Audience=MoviesClient
Jwt__ExpirationMinutes=480
BootstrapAdmin__Email=<initial administrator email>
BootstrapAdmin__Password=<initial administrator password>
```

Use the exact deployed Vercel origin in `AllowedOrigins`, without a trailing slash. Multiple origins can be separated with commas.

`ApplyMigrations=true` applies pending Entity Framework migrations when the API starts. For a single-instance MVP it can remain enabled. If migrations are later moved into a deployment pipeline, set it to `false`.

After the first administrator has been created successfully, remove `BootstrapAdmin__Email` and `BootstrapAdmin__Password` from App Service configuration. The account remains in Azure SQL.

## Checks after deployment

```text
GET https://your-api-host.azurewebsites.net/health/live
GET https://your-api-host.azurewebsites.net/health/ready
```

The live check confirms that the API process is running. The ready check confirms that the API can connect to its database.
