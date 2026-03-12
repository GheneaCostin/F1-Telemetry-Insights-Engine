    using System.Text.Json;

    var builder = WebApplication.CreateBuilder(args);

    // 1. Configure CORS so your future TypeScript frontend can talk to this API
    builder.Services.AddCors(options =>
    {
        options.AddPolicy("AllowFrontend", policy =>
        {
            policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
        });
    });

    // 2. Register an HTTP Client to talk to your Python Engine
    builder.Services.AddHttpClient("PythonEngine", client =>
    {
        // This points to your Uvicorn server
        client.BaseAddress = new Uri("http://f1-backend-service:8001/");
        client.Timeout = TimeSpan.FromSeconds(300);
    });

    var app = builder.Build();
    app.UseCors("AllowFrontend");

    // Health Check for the C# Gateway
    app.MapGet("/", () => "C# Telemetry Gateway is Online.");

    // 3. The Reverse Proxy Route
    app.MapPost("/api/gateway/telemetry", async (IHttpClientFactory factory, HttpRequest request) =>
    {
        var client = factory.CreateClient("PythonEngine");
        
        // Read the incoming request from the React frontend
        using var streamReader = new StreamReader(request.Body);
        var requestBody = await streamReader.ReadToEndAsync();
        
        // Create the HTTP content to send to Python
        var content = new StringContent(requestBody, System.Text.Encoding.UTF8, "application/json");
        
        // Forward the request to Python
        var response = await client.PostAsync("/api/v1/telemetry", content);
        
        // Read Python's response and send it right back to the frontend
        var pythonData = await response.Content.ReadAsStringAsync();
        
        if (response.IsSuccessStatusCode)
        {
            return Results.Content(pythonData, "application/json");
        }
        
        return Results.Problem(detail: "Error communicating with Data Engine", statusCode: (int)response.StatusCode);
    });


    app.MapGet("/api/gateway/races/{year}", async (IHttpClientFactory factory, int year) =>
    {
        var client = factory.CreateClient("PythonEngine");
        
        // Ask Python for the races
        var response = await client.GetAsync($"/api/v1/races/{year}");
        var pythonData = await response.Content.ReadAsStringAsync();
        
        if (response.IsSuccessStatusCode)
        {
            return Results.Content(pythonData, "application/json");
        }
        
        return Results.Problem(detail: "Error fetching race calendar", statusCode: (int)response.StatusCode);
    });

    // NEW ROUTE: Fetch Drivers for a specific GP
    app.MapGet("/api/gateway/drivers/{year}/{gp}", async (IHttpClientFactory factory, int year, string gp) =>
    {
        var client = factory.CreateClient("PythonEngine");
        
        // Pass the request to Python
        var response = await client.GetAsync($"/api/v1/drivers/{year}/{gp}");
        var pythonData = await response.Content.ReadAsStringAsync();
        
        if (response.IsSuccessStatusCode)
        {
            return Results.Content(pythonData, "application/json");
        }
        
        return Results.Problem(detail: "Error fetching drivers", statusCode: (int)response.StatusCode);
    });

    // NEW ROUTE: Fetch Macro Session Data (Track Map & Team Stats)
    app.MapGet("/api/gateway/macro/{year}/{gp}", async (IHttpClientFactory factory, int year, string gp) =>
    {
        var client = factory.CreateClient("PythonEngine");
        
        // Pass the request to Python
        var response = await client.GetAsync($"/api/v1/macro/{year}/{gp}");
        var pythonData = await response.Content.ReadAsStringAsync();
        
        if (response.IsSuccessStatusCode)
        {
            return Results.Content(pythonData, "application/json");
        }
        
        return Results.Problem(detail: "Error fetching macro data", statusCode: (int)response.StatusCode);
    });

    app.Run("http://0.0.0.0:80");