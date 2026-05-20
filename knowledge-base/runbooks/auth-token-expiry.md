# Runbook: Auth Token and Certificate Expiry Issues

## Overview
This runbook covers SAML SSO failures, JWT validation errors, and API key authentication issues related to token/certificate lifecycle management.

## SAML SSO Failures

### Symptom: "SAML assertion signature validation failed"

**Immediate Check:**
1. Compare the certificate fingerprint in the SAML response against what's configured in the SP metadata
2. Check if a certificate rotation was performed recently (check deployment log)
3. Verify the correct IdP metadata URL is configured

**Common Causes:**

**A. Certificate rotation with propagation delay:**
During planned certificate rotations, there is typically a 15-60 minute window where old IdP sessions may use the previous certificate. Resolution: Wait for propagation or force re-authentication.

**B. Regional certificate mismatch:**
Our auth service clusters are deployed per-region. If a certificate rotation fails in one region (e.g., eu-west-1) while succeeding in others, users in that region will fail authentication.

**Diagnosis:**
```bash
# Verify certificate across regions
curl -s https://auth.us-east-1.example.com/saml/metadata | grep X509Certificate
curl -s https://auth.eu-west-1.example.com/saml/metadata | grep X509Certificate
# Certificates should match - if they differ, regional rotation failed
```

**Resolution for regional mismatch:**
1. Identify the region with the stale certificate
2. Manually trigger certificate update for that region:
   ```bash
   kubectl rollout restart deployment/auth-service -n auth --context=eu-west-1
   ```
3. Verify propagation (allow 5-10 minutes)
4. Test authentication for affected users

### Symptom: JWT token signed with deprecated key

**Cause:** Key rotation occurred and the old key was retired before all sessions expired.

**Resolution:**
1. Enable key overlap mode (new key active + old key still valid for verification)
2. Set overlap window to 24 hours minimum
3. Force token refresh for affected users

## API Key Rotation Issues

### New Key Not Working Immediately After Rotation

**Expected Behavior:** API key propagation to all regions takes 5-10 minutes.

**Workaround for Customer:**
- The old key remains valid for 1 hour after rotation (grace period)
- If both keys fail, escalate immediately

**Diagnosis:**
```
Check key propagation status:
GET /internal/api-keys/{keyId}/propagation-status
```

**Resolution:** If propagation is stuck > 15 minutes, manually trigger sync:
```bash
./scripts/sync-api-keys.sh --key-id=<keyId> --region=<region>
```

## Escalation Criteria
- Any enterprise customer unable to authenticate > 15 minutes → Immediate escalation
- Certificate mismatch across regions → Platform team on-call page
- API key propagation stuck > 30 minutes → Engineering escalation
