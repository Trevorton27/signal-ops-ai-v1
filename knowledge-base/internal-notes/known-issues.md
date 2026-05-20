# Known Issues — Internal Notes

## Active Issues

### RATE_LIMITER_BURST_DUPLICATE (Medium — v2.2.0)
- **Status:** Investigating, patch in development
- **Affected:** Free tier customers using burst requests
- **Symptom:** Rate limit hit at 200-300 requests instead of 1000
- **Root Cause:** Race condition in burst window counter — rapid requests within 100ms window counted 2-4x
- **Workaround:** Space requests >200ms apart; temporarily increase rate limit window
- **ETA:** v2.2.1 patch ~1-2 weeks

### WEBHOOK_HEADER_MIGRATION (Low — v3.1.2)
- **Status:** Expected, documentation update needed
- **Affected:** Customers who hard-coded `X-Webhook-Sig` header name
- **Symptom:** Webhook signature verification failing
- **Root Cause:** Header renamed to `X-Signature-256` in v3.1.2 for standard compliance
- **Workaround:** Update webhook handler to check `X-Signature-256`
- **ETA:** No code fix needed; customer update required

### BILLING_KEY_PROPAGATION_DELAY (Low — v4.0.3)
- **Status:** By design, improving
- **Affected:** Customers in non-primary regions (EU, APAC) who rotate keys
- **Symptom:** New API key returns 401 for 5-15 minutes after rotation
- **Root Cause:** Eventual consistency model for key distribution
- **Workaround:** Wait 15 minutes after rotation before cutting over
- **ETA:** Will improve to <1 minute propagation in Q2 2024

## Recently Resolved

### AUTH_EU_CERT_MISMATCH (Resolved 2024-01-14)
- Certificate rotation script failed silently in eu-west-1
- 450 users blocked from SAML SSO for 6.5 hours
- Fixed: Added propagation verification step to rotation script

### DB_REPLICA_LAG_US_EAST (Resolved 2024-01-15)
- Primary replica fell behind during high write load
- Read queries routed to lagging replica, causing timeouts
- Fixed: Promoted healthy replica, added lag monitoring alert

## Support Response Templates

### For rate limit issues on free tier:
"We've identified a known issue with our rate limiting system that may be incorrectly counting your requests. Our engineering team is actively working on a patch. In the meantime, [workaround]. We apologize for the inconvenience and will proactively notify you when the fix is deployed."

### For SAML/auth issues:
"Authentication failures in [region] are related to a recent certificate rotation. We [have fixed / are actively fixing] the certificate mismatch. [ETA or resolution]. Affected users will need to re-authenticate after the fix is applied."
