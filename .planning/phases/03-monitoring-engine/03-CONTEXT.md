# Phase 3: Monitoring Engine - Context

**Gathered:** 2026-01-26
**Status:** Ready for planning

<domain>
## Phase Boundary

System automatically discovers and processes Reddit opportunities for user's products. Polls configured subreddits, filters by keywords, classifies post intent via AI, and generates persona-driven draft replies. Telegram notifications and user actions on mentions are separate phases.

</domain>

<decisions>
## Implementation Decisions

### AI Classification
- Balanced strictness: clear signals with some interpretation, moderate volume
- Show confidence score as percentage (e.g., 85%, 72%)
- Low confidence posts still create mentions — marked with score, user can discard if irrelevant
- No separate review queue for edge cases

### Draft Reply Style
- Adaptive length: match the original post's length and depth
- Soft product mention: focus on solving the problem first, product mentioned naturally at end
- Single best draft per mention (user can regenerate via Telegram if not satisfied)
- Plain text only — no markdown, easy to copy anywhere

### Polling Behavior
- Poll every 15 minutes via Vercel cron
- Show "Last checked: X min ago" on dashboard/mentions page
- Silent retry for transient errors; notify user only if persistent (down 1+ hour)
- Skip private/banned subreddits silently — no errors shown to user

### Claude's Discretion
- Mention list/detail UI layout and design
- Exact classification prompt engineering
- Deduplication implementation approach
- Error notification channel (Telegram, in-app, or both)

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-monitoring-engine*
*Context gathered: 2026-01-26*
