# Billing API Authentication

## API Key Types

### Live Keys (`bk_live_...`)
Used for production billing operations. Handle with extreme care.

### Test Keys (`bk_test_...`)
Used for sandbox/testing. No real charges are processed.

## Authentication
Include your API key in the Authorization header:
```
Authorization: Bearer bk_live_your_key_here
```

## API Key Rotation Process

### Automatic Rotation (Dashboard)
1. Navigate to Settings → API Keys
2. Click "Rotate Key" next to the key you want to rotate
3. A new key is immediately generated and displayed once
4. The old key enters a 1-hour grace period (still valid)
5. After the grace period, the old key is permanently revoked

### Important: Regional Propagation Delay
As of billing-service v4.0.3 (deployed January 14, 2024), API key activation uses **eventual consistency**:
- Key is immediately active in us-east-1 (primary)
- Other regions (eu-central-1, ap-southeast-1) receive the new key within 5-10 minutes
- During this window, requests from non-primary regions may fail with 401

**Best practice:** After rotating a key, wait 15 minutes before fully cutting over, especially if serving global traffic.

### Rotation Recovery
If you rotated a key and the new key isn't working:
1. Check if you're hitting a non-primary region endpoint
2. Wait 15 minutes and retry
3. If still failing after 15 minutes, contact support immediately — the old key grace period is 1 hour

## Programmatic Rotation (API)
```bash
POST /v1/api-keys/rotate
Authorization: Bearer bk_live_current_key

Response:
{
  "new_key": "bk_live_new_key_value",  // Shown only once
  "old_key_expires_at": "2024-01-14T12:00:00Z",
  "propagation_eta_seconds": 600
}
```

## Security Best Practices
1. Store API keys in environment variables, never in code
2. Rotate keys every 90 days
3. Use separate keys per environment (dev/staging/prod)
4. Revoke keys immediately if compromised
5. Enable key usage alerts in dashboard
