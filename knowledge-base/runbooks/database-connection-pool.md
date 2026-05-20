# Runbook: Database Connection Pool Management

## Overview
This runbook covers diagnosing and resolving database connection pool exhaustion, PgBouncer configuration, and connection limit issues.

## Quick Diagnosis

### Signs of Connection Pool Exhaustion
- Errors: "too many connections", "remaining connection slots are reserved", "connection pool exhausted"
- PgBouncer logs showing `cl_waiting` count > 0
- Application latency spikes correlating with connection wait time
- Queries succeeding but with high queue latency

### Check Current Pool Status
```sql
-- Check total connections vs limit
SELECT count(*) AS active, max_conn
FROM pg_stat_activity, pg_settings
WHERE name = 'max_connections'
GROUP BY max_conn;

-- Check connections per application
SELECT application_name, count(*)
FROM pg_stat_activity
GROUP BY application_name
ORDER BY count DESC;
```

## Root Cause: Insufficient Pool Size After Scale-Up

**Problem:** When application scales horizontally (more instances), total connections = instances × pool_size_per_instance. Default PgBouncer `DEFAULT_POOL_SIZE=25` was configured for 5 app instances; scaling to 20 instances multiplies connection demand by 4x.

**Calculation:**
```
Required connections = app_instances × connections_per_instance × safety_factor
Example: 20 instances × 5 connections × 1.5 = 150 connections needed
Default max_connections in Postgres = 100 → EXHAUSTED
```

**Resolution:**

**Option A — Reduce pool size per instance:**
```ini
# PgBouncer config
DEFAULT_POOL_SIZE = 5      # was 25
MAX_CLIENT_CONN = 1000     # client-facing limit
```

**Option B — Use transaction pooling mode:**
```ini
POOL_MODE = transaction    # more efficient than session mode
```

**Option C — Increase Postgres max_connections:**
```sql
ALTER SYSTEM SET max_connections = 300;
-- Requires restart: pg_ctlcluster restart
```

**Recommended:** Combine A + B for immediate relief. Request infrastructure to provision a read replica for read-heavy workloads.

## PgBouncer Configuration Best Practices

```ini
[pgbouncer]
pool_mode = transaction
max_client_conn = 10000
default_pool_size = 20
min_pool_size = 5
reserve_pool_size = 5
reserve_pool_timeout = 3
server_idle_timeout = 600
client_idle_timeout = 0
log_connections = 0
log_disconnections = 0
```

## Customer Guidance

For customers experiencing connection pool issues:
1. Advise to implement connection pooling at the application layer (not just PgBouncer)
2. Recommend using a connection pool library (pg-pool for Node.js, SQLAlchemy pool for Python)
3. Suggest keeping pool_size = (num_cores × 2) + 1 per instance
4. Enterprise plan customers get access to dedicated PgBouncer cluster configuration support

## Monitoring
Set alerts for:
- `pg_stat_activity.count > max_connections * 0.80` → Warning
- `pgbouncer.cl_waiting > 10` → Critical
