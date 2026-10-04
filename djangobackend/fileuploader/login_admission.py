from functools import lru_cache
from hashlib import sha256
from ipaddress import ip_address
import json

from django.conf import settings
from redis import Redis
from redis.backoff import NoBackoff
from redis.exceptions import RedisError
from redis.retry import Retry

# One atomic admission across workers: rejected requests do not create fresh
# username buckets or spend another client's allowance. No username-only lock
# permits an attacker to deny a victim login from a different client.
ADMISSION_SCRIPT = """
for i, key in ipairs(KEYS) do
    if tonumber(redis.call('GET', key) or '0') >= tonumber(ARGV[i]) then
        return 0
    end
end
for i, key in ipairs(KEYS) do
    if redis.call('INCR', key) == 1 then
        redis.call('EXPIRE', key, 60)
    end
end
return 1
"""


@lru_cache(maxsize=4)
def redis_client(url: str):
    return Redis.from_url(
        url,
        socket_connect_timeout=1,
        socket_timeout=1,
        retry=Retry(NoBackoff(), 0),
        max_connections=8,
    )


def admit_login(request, username: str) -> int | None:
    # The app has no published port in Dokploy; Traefik is its ingress. Do not
    # fall back to a caller-provided first XFF or X-Real-IP when the peer is bad.
    peer = request.headers.get("X-Forwarded-For", "").split(",")[-1].strip()
    if "%" in peer:
        return 503
    try:
        client = str(ip_address(peer))
    except ValueError:
        return 503

    url = settings.REDIS_URL
    if not url:
        return 503
    client_key = sha256(client.encode()).hexdigest()
    pair_key = sha256(json.dumps(
        [client, username.casefold()], ensure_ascii=True
    ).encode()).hexdigest()
    try:
        admitted = redis_client(url).eval(
            ADMISSION_SCRIPT, 3,
            f"files:login:client:{client_key}",
            f"files:login:pair:{pair_key}",
            "files:login:aggregate", 10, 5, 60,
        )
    except (RedisError, ValueError):
        # Password hashing is unavailable while shared admission is unavailable.
        # Do not log connection URLs or attempt credentials.
        return 503
    return None if admitted == 1 else 429
