using System.Globalization;
using System.Threading.RateLimiting;
using CoreApi.WebApi.Common;
using CoreApi.WebApi.Infrastructure;
using CoreApi.WebApi.Models;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Server.Kestrel.Core;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Newtonsoft.Json;

var builder = WebApplication.CreateBuilder(args);

builder.Services.Configure<KestrelServerOptions>(options => options.AllowSynchronousIO = true);
builder
    .Services.AddControllers()
    .AddNewtonsoftJson(options =>
    {
        options.SerializerSettings.ReferenceLoopHandling = ReferenceLoopHandling.Ignore;
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// JWT Support in swagger
builder.Services.AddSwaggerGen(option =>
{
    option.SwaggerDoc("v1", new OpenApiInfo { Title = "Demo API", Version = "v1" });
    option.AddSecurityDefinition(
        "Bearer",
        new OpenApiSecurityScheme
        {
            In = ParameterLocation.Header,
            Description = "Please enter a valid token",
            Name = "Authorization",
            Type = SecuritySchemeType.Http,
            BearerFormat = "JWT",
            Scheme = "Bearer",
        }
    );
    option.AddSecurityRequirement(
        new OpenApiSecurityRequirement
        {
            {
                new OpenApiSecurityScheme
                {
                    Reference = new OpenApiReference
                    {
                        Type = ReferenceType.SecurityScheme,
                        Id = "Bearer",
                    },
                },
                new string[] { }
            },
        }
    );
});

// postgres
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"))
);

// JWT
builder
    .Services.AddIdentity<AppUser, IdentityRole>(options =>
    {
        options.Password.RequireDigit = false;
        options.Password.RequireLowercase = false;
        options.Password.RequireUppercase = false;
        options.Password.RequireNonAlphanumeric = false;
        options.Password.RequiredLength = 8;
    })
    .AddEntityFrameworkStores<ApplicationDbContext>();
builder
    .Services.AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme =
            options.DefaultChallengeScheme =
            options.DefaultForbidScheme =
            options.DefaultScheme =
            options.DefaultSignInScheme =
            options.DefaultSignOutScheme =
                JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidIssuer = builder.Configuration["JWT:Issuer"],
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidAudience = builder.Configuration["JWT:Audience"],
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(
                System.Text.Encoding.UTF8.GetBytes(builder.Configuration["JWT:SigningKey"])
            ),
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero,
        };
    });

// Rate limiter
builder.Services.AddRateLimiter(limiterOptions =>
{
    limiterOptions.OnRejected = async (context, cancellationToken) =>
    {
        if (context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter))
        {
            context.HttpContext.Response.Headers.RetryAfter = (
                (int)retryAfter.TotalSeconds
            ).ToString(NumberFormatInfo.InvariantInfo);
        }

        context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
        await context.HttpContext.Response.WriteAsync("Too many requests", cancellationToken);
    };
    limiterOptions.AddPolicy(
        "login-limiter",
        context =>
        {
            string partitionKey = "default";

            if (context.Request.HasJsonContentType())
            {
                context.Request.EnableBuffering();

                using var reader = new StreamReader(
                    context.Request.Body,
                    encoding: System.Text.Encoding.UTF8,
                    detectEncodingFromByteOrderMarks: false,
                    bufferSize: -1,
                    leaveOpen: true
                );
                var body = reader.ReadToEnd();
                context.Request.Body.Position = 0;

                try
                {
                    var jsonDoc = System.Text.Json.JsonDocument.Parse(body);
                    if (jsonDoc.RootElement.TryGetProperty("username", out var usernameElement))
                    {
                        partitionKey = usernameElement.GetString() ?? "default";
                    }
                }
                catch (JsonException) { }
            }

            Console.WriteLine($"Partition key is {partitionKey}");
            return RateLimitPartition.GetSlidingWindowLimiter(
                partitionKey,
                _ => new SlidingWindowRateLimiterOptions
                {
                    AutoReplenishment = true,
                    PermitLimit = 10,
                    Window = TimeSpan.FromSeconds(60),
                    SegmentsPerWindow = 6,
                }
            );
        }
    );
});

var app = builder.Build();

// Apply migrations and seed roles
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<ApplicationDbContext>();
        Console.WriteLine("Applying migrations...");
        context.Database.Migrate();
        Console.WriteLine("Migrations applied successfully");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"An error occurred while migrating the database\n{ex}");
        Environment.Exit(1);
    }

    try
    {
        var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();
        Console.WriteLine("Seeding roles...");
        var roles = new List<IdentityRole>
        {
            new IdentityRole
            {
                Name = RoleConstants.Admin,
                NormalizedName = RoleConstants.Admin.ToUpper(),
            },
            new IdentityRole
            {
                Name = RoleConstants.NewUser,
                NormalizedName = RoleConstants.NewUser.ToUpper(),
            },
            new IdentityRole
            {
                Name = RoleConstants.AcceptedUser,
                NormalizedName = RoleConstants.AcceptedUser.ToUpper(),
            },
        };
        foreach (var role in roles)
        {
            if (role.Name is null)
            {
                continue;
            }

            if (roleManager.FindByNameAsync(role.Name).Result == null)
            {
                roleManager.CreateAsync(role).Wait();
            }
        }

        Console.WriteLine("Roles seeded successfully");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"An error occurred while seeding roles\n{ex}");
        Environment.Exit(1);
    }
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
else if (app.Environment.IsProduction())
{
    //
}

app.UseRouting();
app.UseRateLimiter();

app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
