# Runbook: Webhook Delivery and Retry Failures

## Overview
This runbook covers diagnosing webhook delivery failures, signature verification issues, and retry mechanism problems.

## Webhook Delivery Failure Diagnosis

### Check Webhook Delivery Logs
```bash
# Check recent delivery attempts for a customer
GET /internal/webhooks/{customerId}/delivery-log?limit=50

# Check specific webhook endpoint status
GET /internal/webhooks/{webhookId}/status
```

### Common Failure Modes

## 1. Signature Header Name Change (Breaking Change in v3.1.2)

**Impact:** Webhooks deployed after January 12, 2024 use the new header name.

**Old header (pre v3.1.2):** `X-Webhook-Sig`
**New header (v3.1.2+):** `X-Signature-256`

If customers are checking for `X-Webhook-Sig` and the dispatcher is now sending `X-Signature-256`, their signature verification will fail. **This is the most common cause of webhook failures after the v3.1.2 deployment.**

**Customer fix:**
```javascript
// Old code (broken)
const signature = req.headers['x-webhook-sig'];

// New code (correct)
const signature = req.headers['x-signature-256'];
```

**Verification algorithm:**
```javascript
const expectedSig = crypto
  .createHmac('sha256', webhookSecret)
  .update(JSON.stringify(req.body))
  .digest('hex');

const isValid = `sha256=${expectedSig}` === signature;
```

## 2. Customer Endpoint Returning 500

**Behavior:** Dispatcher marks delivery as failed. Retry schedule: 1min, 5min, 30min, 2hr, 24hr.

**If retries are not happening:**
- Check `WEBHOOK_RETRY_ENABLED=true` in dispatcher config
- Check if the endpoint has been flagged as "dead" (> 5 consecutive failures = endpoint suspended)

**To unsuspend a webhook endpoint:**
```
POST /internal/webhooks/{webhookId}/unsuspend
```

## 3. Timeout Issues

Default timeout per delivery attempt: 10 seconds. If customer endpoint is slow:
- Respond with 200 immediately, process asynchronously
- Use a queue/worker pattern on the customer side

## Retry Schedule Reference
| Attempt | Delay | Total Elapsed |
|---------|-------|---------------|
| 1 | Immediate | 0m |
| 2 | 1 minute | 1m |
| 3 | 5 minutes | 6m |
| 4 | 30 minutes | 36m |
| 5 | 2 hours | 2h 36m |
| Final | 24 hours | 26h 36m |

After 6 failed attempts, the webhook is marked as permanently failed and the endpoint is suspended.

## Customer Guidance for Verification
```javascript
// Complete webhook verification example
function verifyWebhook(req, secret) {
  const sig = req.headers['x-signature-256']; // Updated header name
  if (!sig) return false;

  const computed = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(req.body) // Use raw body, not parsed JSON
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(sig),
    Buffer.from(computed)
  );
}
```

## Escalation
- Customer losing > 100 events/hour → Immediate manual replay
- Endpoint suspended with active business impact → Override and unsuspend manually
