# Phase 2: Onboarding and Products - Context

**Gathered:** 2026-01-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Users complete onboarding by connecting Telegram, configuring persona, and adding their first product. Products can be auto-generated from URL (via Firecrawl + OpenAI) or manually edited if scraping fails. Onboarding is complete when user has persona configured and at least one product added. Telegram connection is optional.

</domain>

<decisions>
## Implementation Decisions

### Onboarding Flow
- Fixed step order: Persona → Telegram → Product
- Stepper bar at top showing current position (Step 1 of 3)
- Telegram step is optional — can skip and connect later from settings
- Persona and Product steps are required
- If user abandons mid-flow, resume at exact step on next login (preserve partial data)

### Telegram Connection UX
- Present QR code for mobile users to scan, plus fallback deep link button for desktop
- Manual refresh: user clicks "Check connection" button after starting the bot (no real-time websocket)
- On connection failure: show error message with option to skip (since Telegram is optional)
- Welcome message in Telegram: detailed onboarding explaining what notifications look like and how action buttons work

### Product Auto-generation
- URL is required to start adding a product
- Show inline skeleton loading — form fields appear as skeletons and fill in as data arrives
- AI-generated fields (name, description, keywords, subreddits) are pre-filled and editable inline
- If scraping fails or is partial: both toast notification AND inline hints on affected fields
- User can edit any field regardless of whether it was auto-filled or not

### Persona Configuration
- Four fields: expertise area, tone, phrases to avoid, target audience
- Tone field: dropdown with presets (Professional, Casual, Friendly, Technical, Witty) plus "Custom" option that reveals text field
- Placeholder examples in each field showing sample input (no helper text below)

### Claude's Discretion
- Whether to pre-fill default persona values for new users
- Exact tone preset options
- Stepper bar visual design
- Error message wording for failed connections
- Skeleton loading animation style

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

*Phase: 02-onboarding-and-products*
*Context gathered: 2026-01-21*
