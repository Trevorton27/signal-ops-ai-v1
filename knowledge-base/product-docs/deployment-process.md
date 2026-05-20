# Deployment Process and CI/CD Integration

## GitHub Actions Integration

### Current Version: v3.2.0 (Breaking Change)

Version 3.2.0 introduced a **required** environment variable `SECRETS_MANAGER_KEY` that was previously optional. Workflows using v3.1.x or earlier that do not set this variable will fail at the "inject environment variables" step.

### Migration Guide from v3.1.x to v3.2.0

**Step 1:** Add `SECRETS_MANAGER_KEY` to your GitHub repository secrets:
```bash
# Get your Secrets Manager key from the dashboard:
# Settings → CI/CD Integration → Secrets Manager Key
```

**Step 2:** Update your workflow file:
```yaml
# .github/workflows/deploy.yml
- name: Deploy
  uses: your-platform/deploy-action@v3.2.0
  with:
    api_key: ${{ secrets.PLATFORM_API_KEY }}
    secrets_manager_key: ${{ secrets.SECRETS_MANAGER_KEY }}  # NEW in v3.2.0
    environment: production
```

**Step 3:** If you want to stay on v3.1.x temporarily (not recommended):
```yaml
uses: your-platform/deploy-action@v3.1.4  # Pin to last stable v3.1
```

### Environment Variable Injection
The deployment action injects environment variables from the platform's Secrets Manager into the build environment. This requires the `SECRETS_MANAGER_KEY` to authenticate with the Secrets Manager API.

### Changelog v3.2.0
- **Breaking:** `secrets_manager_key` input is now required
- **New:** Support for dynamic environment variable injection at deploy time
- **New:** Audit log for all injected secrets
- **Fix:** Environment variables with special characters no longer fail injection

## Deployment Environments

### Production
- Auto-deployed on merge to `main`
- Requires passing CI/CD checks
- Blue-green deployment with 5-minute health check window

### Staging
- Auto-deployed on merge to `develop`
- Mirrors production configuration
- Accessible at `staging.your-domain.com`

### Preview
- Auto-deployed for every pull request
- Uses test API keys automatically
- Accessible at `pr-{number}.preview.your-domain.com`

## Environment Variable Management
- Store secrets in the platform Secrets Manager (never in code)
- Use `{{ secrets.VAR_NAME }}` syntax in action workflows
- Environment variables are encrypted at rest and in transit
- Access is logged for compliance purposes
