# Runbook: Diagnosing Production 500 Errors

## Overview
This runbook covers systematic diagnosis of HTTP 500 Internal Server Error responses from our API services.

## Immediate Triage (0-5 minutes)

1. **Check incident dashboard** — Is there an active incident? If yes, follow the incident runbook.
2. **Verify error rate** — Is this 100% error rate or intermittent (< 50%)? Intermittent errors suggest upstream dependency issues.
3. **Check deployment log** — Was there a recent deployment in the last 2 hours? Roll back if error rate > 5%.

## Common Root Causes

### 1. Database Query Timeouts
**Symptoms:** Errors correlate with database-heavy operations (order processing, reporting queries). Trace spans show long DB wait times.

**Diagnosis:**
```bash
# Check active slow queries
SELECT pid, now() - query_start AS duration, query
FROM pg_stat_activity
WHERE state = 'active' AND now() - query_start > interval '5 seconds';

# Check connection pool utilization
SELECT count(*), state FROM pg_stat_activity GROUP BY state;
```

**Resolution:**
- Kill long-running queries exceeding 30 seconds
- Add missing indexes on filtered columns
- Increase query timeout threshold in application config
- Scale read replicas if read-heavy workload

### 2. Connection Pool Exhaustion
**Symptoms:** "too many connections" error, requests queuing, PgBouncer timeout errors.

**Resolution:** See [database-connection-pool runbook](./database-connection-pool.md).

### 3. Upstream Service Timeout
**Symptoms:** Gateway timeout (504) on specific endpoints. Downstream service not responding.

**Resolution:**
- Check downstream service health endpoint
- Increase circuit breaker threshold temporarily
- Enable fallback response if endpoint is non-critical

### 4. Memory/OOM Issues
**Symptoms:** Process crashes, OOM killer logs, sudden error spike.

**Resolution:**
- Restart affected pods
- Add resource limits
- Profile memory usage

## Escalation Criteria
- Error rate > 10% for more than 5 minutes → Page on-call engineer
- Any customer-facing 500 rate > 1% for enterprise customers → Immediate escalation
- Data integrity errors detected → Stop all writes, escalate immediately

## Post-Incident
- File incident report within 24 hours
- Update this runbook with new patterns discovered
