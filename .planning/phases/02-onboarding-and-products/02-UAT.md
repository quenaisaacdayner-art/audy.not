---
status: testing
phase: 02-onboarding-and-products
source: 02-01-SUMMARY.md, 02-02-SUMMARY.md, 02-03-SUMMARY.md, 02-04-SUMMARY.md, 02-05-SUMMARY.md, 02-06-SUMMARY.md, 02-07-SUMMARY.md, 02-08-SUMMARY.md
started: 2026-01-23T14:00:00Z
updated: 2026-01-23T15:30:00Z
---

## Current Test

number: 1
name: Onboarding Stepper Display (New Order)
expected: |
  Go to /onboarding (logged in, fresh user without product).
  Stepper shows "Passo 1 de 3" with Step 1 (Produto) active.
  Product form with URL input is visible.
awaiting: user response

## Tests

### 1. Onboarding Stepper Display (New Order)
expected: Go to /onboarding — Stepper shows "Passo 1 de 3" with Produto active. URL input visible.
result: pass

### 2. Product URL Input
expected: On Step 1, there's a URL input field with a "Generate" button (sparkle icon). Other form fields not visible yet.
result: [pending]

### 3. Product AI Generation
expected: Enter a valid SaaS URL (e.g., https://notion.so) and click Generate. Loading skeletons appear, then form fields populate with AI-generated name, description, keywords, and subreddits.
result: [pending]

### 4. Product Form Manual Edit
expected: After generation, you can edit any field. Keywords and subreddits show as badges. Clicking X removes badge. Typing comma-separated values adds new badges.
result: [pending]

### 5. Product Form Submission
expected: Click "Save Product" with all fields filled. Stepper advances to Step 2 of 3 (Telegram).
result: [pending]

### 6. Telegram Step Display
expected: On Step 2, you see a QR code, a deep link button, and a "Check Connection" button. There's also a "Skip for now" option.
result: [pending]

### 7. Skip Telegram Step
expected: Click "Skip for now" — Stepper advances to Step 3 of 3 (Persona step).
result: [pending]

### 8. Persona Form Fields
expected: Persona form shows 4 fields: Expertise (textarea), Tone (dropdown), Phrases to Avoid (textarea), Target Audience (textarea).
result: [pending]

### 9. Persona Form Submission
expected: Fill required fields and click Continue. Onboarding completes and redirects to /dashboard.
result: [pending]

### 10. Onboarding Resume
expected: Log out, log back in, go to /onboarding. Resumes from where you left off (skips completed steps).
result: [pending]

### 11. Products List Page
expected: Go to /products. See list of your products as cards with name, URL, description snippet, and subreddit badges.
result: [pending]

### 12. Product Detail Page
expected: Click on a product name. See full detail page with name, URL, description, keywords, subreddits, timestamps.
result: [pending]

### 13. Edit Product Page
expected: On product detail, click "Edit". See edit form with all fields pre-filled (badges for keywords/subreddits).
result: [pending]

### 14. Update Product
expected: Change description, click "Save Changes". Success toast, redirected to detail page with updated info.
result: [pending]

### 15. Delete Product Confirmation
expected: On product detail, click "Delete". AlertDialog appears asking "Are you sure?" with product name.
result: [pending]

### 16. Delete Product Execution
expected: In delete dialog, click "Delete" to confirm. Product deleted, success toast, redirected to /products.
result: [pending]

## Summary

total: 16
passed: 1
issues: 0
pending: 15
skipped: 0

## Gaps

[none yet]
