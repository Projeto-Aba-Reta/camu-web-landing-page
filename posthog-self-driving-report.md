# PostHog Self-driving setup report

## Summary

PostHog Self-driving is configured for this web commerce project. Session Replay and Error Tracking were already enabled, Support was enabled, and native health, error, and support ticket signal sources were enabled.

Fresh scout and Replay Vision configurations are picked up within about 30 minutes. Findings will begin appearing in the [Self-driving inbox](https://us.posthog.com/project/592665/inbox) as data arrives.

## AI data processing

Approved by the organization-level setup gate.

## GitHub

The PostHog GitHub App was already connected before this setup, as confirmed by the setup context. GitHub Issues was not selected as a Self-driving responder during this run.

## Products enabled

| Product | Result | Notes |
|---|---|---|
| Session Replay | Already enabled | Browser-side `posthog.init(...)` could not be located during the targeted scan, so an override check was not verified. |
| Error Tracking | Already enabled | Browser-side initialization override check was not verified. |
| Support (Conversations) | Enabled | Tickets require an inbound email, inbox, or Slack channel before any support data arrives. |

## Signal sources

| Signal source | Action | Details |
|---|---|---|
| `signals_scout` / `cross_source_issue` | Already enabled by platform default | No opt-out config was created. |
| `health_checks` / `health_issue` | Enabled | Source config `01a068b3-3966-7d4a-a049-8bf8c7203ebb`. |
| `error_tracking` / `issue_created` | Enabled | Source config `01a068b3-39d9-7187-bb0a-9e44f6d075b8`. |
| `error_tracking` / `issue_reopened` | Enabled | Source config `01a068b3-3c42-7cab-8e6f-40852558ec44`. |
| `error_tracking` / `issue_spiking` | Enabled | Source config `01a068b3-3b14-7cd4-94ca-f84f47728b6d`. |
| `conversations` / `ticket` | Enabled | Source config `01a068b3-3973-7b38-bd67-7c0c7f144593`; dormant until a support channel is connected. |
| Session replay source row | Deliberately skipped | Replay observations reach the inbox through Replay Vision scanners, not a legacy source row. |

## Connected tools

No connected-tool responder was selected. No external data-warehouse sources or dormant responders were created in this run.

## Scout troop

**Budget:** 100 runs/day enforced; 0 used and 100 remaining at setup time.

> Scouts are in early access. Each project gets up to 100 scout runs a day. Contact team-self-driving@posthog.com if you need more.

### Active scouts (7)

| Scout | Why enabled |
|---|---|
| `signals-scout-general` | Cross-product patterns and otherwise-uncovered surfaces. |
| `signals-scout-product-analytics` | Tracks funnel and engagement-flow regressions for the established commerce events. |
| `signals-scout-web-analytics` | Tracks traffic, attribution, landing-page health, and bounce behavior for the storefront. |
| `signals-scout-revenue-analytics` | Tracks payment and revenue-capture health for the commerce flow. |
| `signals-scout-ai-observability` | Covers the application’s Google generative-AI image-generation surface. |
| `signals-scout-health-checks` | Covers PostHog setup and instrumentation health. |
| `signals-scout-pet-miniature-journey` | Custom scout for the high-value pet-miniature customer journey. |

### Disabled built-in scouts (21)

| Scout | Reason |
|---|---|
| `signals-scout-anomaly-detection` | No profile evidence of established saved-dashboard coverage; kept selective. |
| `signals-scout-apm` | No tracing or APM surface was identified. |
| `signals-scout-conversations` | Support has no connected inbound channel yet; the ticket source covers future tickets. |
| `signals-scout-csp-violations` | No CSP reporting configuration was identified. |
| `signals-scout-customer-analytics` | No B2B account-analytics surface was identified. |
| `signals-scout-data-pipelines` | No CDP destination, batch export, or workflow surface was identified. |
| `signals-scout-data-warehouse` | No applicable connected external warehouse source was selected. |
| `signals-scout-error-tracking` | Covered by the native Error Tracking signal sources. |
| `signals-scout-experiments` | No active experiment evidence was identified. |
| `signals-scout-feature-flags` | No active feature-flag usage was identified in the repository scan. |
| `signals-scout-inbox-validation` | No resolved Self-driving reports exist yet to validate. |
| `signals-scout-insight-alerts` | No configured insight-alert evidence was available. |
| `signals-scout-logs` | No active PostHog logs surface was identified. |
| `signals-scout-mcp-tool-calls` | No project MCP telemetry surface was identified. |
| `signals-scout-observability-gaps` | Kept off to retain room below the ten-scout quality ceiling. |
| `signals-scout-replay-vision` | No accumulated scanner observations yet; remains separate from the scanner route. |
| `signals-scout-session-replay` | Covered by the two Replay Vision scanners below. |
| `signals-scout-skills-store` | Skills-store hygiene is not an active product surface for this repository. |
| `signals-scout-surveys` | No surveys exist and surveys are not enabled. |
| `signals-scout-tasks` | No PostHog Tasks usage was identified. |
| `signals-scout-web-vitals` | No dedicated Core Web Vitals usage evidence was available. |

## Custom scouts

### Created

| Scout | Surface | Discriminator | Why it adds coverage |
|---|---|---|---|
| `signals-scout-pet-miniature-journey` | Custom pet-miniature flow from intake through preview approval and payment | Healthy upstream demand combined with a sustained downstream stage loss versus complete-day baseline | It explicitly watches this domain workflow’s heartbeat, stage lag, and downstream continuity. It complements—rather than replaces—the broader product and web analytics scouts. |

The scout uses aggregate evidence only and excludes names, contact details, addresses, payment identifiers, uploaded images, and raw customer payloads. If it proves noisy, set `emit: false` on its Self-driving configuration to switch it to dry-run.

**Considered but not separately created:** generic checkout conversion monitoring (already covered by revenue and product analytics); visual replay issues (covered by Replay Vision); and error bursts (covered by native Error Tracking).

## Replay Vision scanners

A scanner is an LLM that watches individual session recordings on a schedule and pushes clear defects into the inbox. Replay Vision is the only setup component here that spends Replay Vision quota; findings arrive at half weight and require independent corroboration before promotion into a report.

No recordings were present during setup, so both scanners are armed and will start working when recordings arrive. The organization had 2,500 credits remaining, with a 2,500-credit monthly limit. Both current estimates are zero observations and zero monthly credits because there are no matching recordings yet.

| Brief | Scanner | Status | Scope | Sampling rate | Estimated monthly spend |
|---|---|---|---|---:|---:|
| Breakage monitor | `Camu checkout breakage` | Created | Sessions visiting `/checkout`, the purchase completion flow where shipping details and payment continuation occur | 0.5 | 0 credits (0 observations) |
| Frustration monitor | `Camu storefront frustration` | Created | Sessions containing `$rageclick` only; no URL filter was added | 1.0 | 0 credits (0 observations) |

## Files modified or created

| File | Change |
|---|---|
| `posthog-self-driving-report.md` | Created this setup report. |
| `.claude/skills/replay-vision-scanners-core/` | Installed shared scanner mechanics for this setup session. |
| `.claude/skills/replay-vision-scanner-broken-experiences/` | Installed the prescribed breakage-monitor brief. |
| `.claude/skills/replay-vision-scanner-user-frustration/` | Installed the prescribed frustration-monitor brief. |

No application source files, environment files, tokens, or other secrets were modified.

## Follow-ups

- [ ] Connect an inbound Support channel (email, inbox, or Slack) in PostHog so enabled ticket handling can receive data.
- [ ] Verify the browser `posthog.init(...)` location and ensure it does not set `disable_session_recording: true` or `capture_exceptions: false`. The targeted repository scan found `posthog-js` capture calls but no initialization call.
- [ ] Validate that production events for the pet-miniature journey are arriving. Event-schema read access was not available to this setup session, and the project profile was not built yet.
- [ ] Generate real browser traffic and recordings; re-check Replay Vision estimates after recordings exist, particularly before increasing either scanner’s scope or sampling rate.

## What happens next

The scout coordinator picks up fresh configurations within about 30 minutes. Scout runs draw from the configured daily budget, and qualifying findings cluster into reports in the [Self-driving inbox](https://us.posthog.com/project/592665/inbox); immediately actionable reports can begin coding tasks.
