# Phase 4: Telegram Notifications and Actions - Context

**Gathered:** 2026-01-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver mentions to users via Telegram and enable in-chat actions. When a new mention is created, user receives a notification with post details and draft reply. User can approve, regenerate, or discard directly from Telegram using inline buttons.

</domain>

<decisions>
## Implementation Decisions

### Regeneration behavior
- Send new message on regenerate (don't edit in place)
- Cap at 3 regeneration attempts per mention
- When limit reached, show message explaining the limit
- Approve/discard buttons remain available after hitting limit

### Timing and batching
- Send notifications immediately when mentions are discovered
- 1-2 second delay between messages when multiple mentions found in one cron run
- Quiet hours are user-configurable (setting added in Phase 5)
- Queue notifications during quiet hours, send all when quiet hours end

### Claude's Discretion
- Notification message format and layout
- Button labels and organization
- Whether to show attempt count on regenerated drafts
- Exact delay timing between batched messages

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches for Telegram bot UX.

</specifics>

<deferred>
## Deferred Ideas

- Quiet hours configuration UI — Phase 5 (Settings)
- Notification queue persistence for quiet hours — may need database table

</deferred>

---

*Phase: 04-telegram-actions*
*Context gathered: 2026-01-27*
