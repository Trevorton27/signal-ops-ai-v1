# API Rate Limits

## Rate Limit Tiers

| Plan | Requests/Hour | Burst (per second) | Concurrent Connections |
|------|--------------|---------------------|------------------------|
| Free | 1,000 | 10 | 5 |
| Pro | 10,000 | 100 | 50 |
| Enterprise | Unlimited* | 1,000 | Unlimited* |

*Enterprise limits are subject to fair use policy. Contact sales for dedicated capacity.

## Response Headers
Every API response includes rate limit headers:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 847
X-RateLimit-Reset: 1705327200
X-RateLimit-Window: 3600
```

## When You Hit a Rate Limit
```
HTTP 429 Too Many Requests
{
  "error": "rate_limit_exceeded",
  "limit": 1000,
  "remaining": 0,
  "reset_at": "2024-01-15T15:00:00Z",
  "retry_after": 1847
}
```

## Known Issue: Burst Counter Race Condition (v2.2.0)
A bug introduced in rate-limiter v2.2.0 (deployed January 13, 2024) causes burst requests (multiple requests within 100ms) to be counted 2-4x their actual count. This affects free tier customers disproportionately as their burst window is narrower.

**Workaround:** Space requests at least 200ms apart to avoid burst counting.
**Fix:** Patch expected in v2.2.1, ETA 1-2 weeks.

## Best Practices
1. Implement exponential backoff when receiving 429 responses
2. Cache responses where data doesn't change frequently
3. Use batch endpoints where available (reduces per-item request count)
4. Implement a client-side rate limiter to stay within limits proactively

## Upgrading Plans
To upgrade from Free to Pro or Enterprise, visit billing settings or contact support.
