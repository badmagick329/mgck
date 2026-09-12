using System.Text.Json;

namespace CoreApi.WebApi.Common;

public static class LoginRateLimit
{
    /// <summary>Use one bucket per case-insensitive username; leave invalid bodies to model binding.</summary>
    public static string GetPartitionKey(string body)
    {
        try
        {
            using var document = JsonDocument.Parse(body);
            var partitionKey = "default";
            if (document.RootElement.ValueKind == JsonValueKind.Object)
            {
                foreach (var property in document.RootElement.EnumerateObject())
                {
                    if (property.Name.Equals("username", StringComparison.OrdinalIgnoreCase))
                    {
                        partitionKey = property.Value.ValueKind == JsonValueKind.String
                            ? property.Value.GetString()!.Normalize().ToUpperInvariant()
                            : "default";
                    }
                }
            }
            return partitionKey;
        }
        catch (JsonException) { }

        return "default";
    }
}
