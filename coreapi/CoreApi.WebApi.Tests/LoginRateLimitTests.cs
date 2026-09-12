using CoreApi.WebApi.Common;
using Xunit;

namespace CoreApi.WebApi.Tests;

public class LoginRateLimitTests
{
    [Theory]
    [InlineData("{broken")]
    [InlineData("")]
    [InlineData("null")]
    [InlineData("[]")]
    [InlineData("42")]
    [InlineData("{\"username\":42}")]
    [InlineData("{\"username\":null}")]
    [InlineData("{\"username\":{}}")]
    [InlineData("{}")]
    public void Invalid_login_bodies_use_the_shared_bucket(string body)
    {
        Assert.Equal("default", LoginRateLimit.GetPartitionKey(body));
    }

    [Theory]
    [InlineData("{\"username\":\"Alice\"}")]
    [InlineData("{\"Username\":\"alice\"}")]
    [InlineData("{\"USERNAME\":\"ALICE\"}")]
    [InlineData("{\"username\":\"other\",\"Username\":\"alice\"}")]
    public void Username_casing_does_not_bypass_the_limit(string body)
    {
        Assert.Equal("ALICE", LoginRateLimit.GetPartitionKey(body));
    }

    [Fact]
    public void Canonically_equivalent_usernames_share_a_bucket()
    {
        Assert.Equal(
            LoginRateLimit.GetPartitionKey("{\"username\":\"caf\u00e9\"}"),
            LoginRateLimit.GetPartitionKey("{\"username\":\"cafe\u0301\"}")
        );
    }
}
