---
status: complete
phase: 02-onboarding-and-products
source: 02-01-SUMMARY.md, 02-02-SUMMARY.md, 02-03-SUMMARY.md, 02-04-SUMMARY.md, 02-05-SUMMARY.md, 02-06-SUMMARY.md, 02-07-SUMMARY.md, 02-08-SUMMARY.md
started: 2026-01-23T14:00:00Z
updated: 2026-01-23T16:00:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Onboarding Stepper Display (New Order)
expected: Go to /onboarding — Stepper shows "Passo 1 de 3" with Produto active. URL input visible.
result: pass

### 2. Product URL Input
expected: On Step 1, there's a URL input field with a "Generate" button (sparkle icon). Other form fields not visible yet.
result: pass

### 3. Product AI Generation
expected: Enter a valid SaaS URL (e.g., https://notion.so) and click Generate. Loading skeletons appear, then form fields populate with AI-generated name, description, keywords, and subreddits.
result: pass

### 4. Product Form Manual Edit
expected: After generation, you can edit any field. Keywords and subreddits show as badges. Clicking X removes badge. Typing comma-separated values adds new badges.
result: pass

### 5. Product Form Submission
expected: Click "Save Product" with all fields filled. Stepper advances to Step 2 of 3 (Telegram).
result: pass

### 6. Telegram Step Display
expected: On Step 2, you see a QR code, a deep link button, and a "Check Connection" button. There's also a "Skip for now" option.
result: pass

### 7. Skip Telegram Step
expected: Click "Skip for now" — Stepper advances to Step 3 of 3 (Persona step).
result: pass

### 8. Persona Form Fields
expected: Persona form shows 4 fields: Expertise (textarea), Tone (dropdown), Phrases to Avoid (textarea), Target Audience (textarea).
result: pass

### 9. Persona Form Submission
expected: Fill required fields and click Complete Setup. Onboarding completes and redirects to /dashboard.
result: pass

### 10. Onboarding Resume
expected: Log out, log back in, go to /onboarding. Redirects to /dashboard (onboarding complete).
result: pass

### 11. Products List Page
expected: Go to /products. See list of your products as cards with name, URL, description snippet, and subreddit badges.
result: pass

### 12. Product Detail Page
expected: Click on a product name. See full detail page with name, URL, description, keywords, subreddits, timestamps.
result: pass

### 13. Edit Product Page
expected: On product detail, click "Edit". See edit form with all fields pre-filled (badges for keywords/subreddits).
result: pass

### 14. Update Product
expected: Change description, click "Save Changes". Success toast, redirected to detail page with updated info.
result: pass

### 15. Delete Product Confirmation
expected: On product detail, click "Delete". AlertDialog appears asking "Are you sure?" with product name.
result: pass

### 16. Delete Product Execution
expected: In delete dialog, click "Delete" to confirm. Product deleted, success toast, redirected to /products.
result: pass

## Summary

total: 16
passed: 16
issues: 0
pending: 0
skipped: 0

## Gaps

[none]
