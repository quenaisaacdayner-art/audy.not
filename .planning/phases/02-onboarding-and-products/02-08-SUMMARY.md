---
phase: 02-onboarding-and-products
plan: 08
subsystem: product-management
tags: [crud, server-actions, alert-dialog, dynamic-routes]

dependency-graph:
  requires: ["02-01", "02-06"]
  provides: ["product-crud-pages", "product-list", "product-edit", "product-delete"]
  affects: ["02-09"]

tech-stack:
  added: [alert-dialog]
  patterns: [crud-pages, delete-confirmation, comma-separated-inputs]

key-files:
  created:
    - src/app/(protected)/products/page.tsx
    - src/app/(protected)/products/[id]/page.tsx
    - src/app/(protected)/products/[id]/delete-button.tsx
    - src/app/(protected)/products/[id]/edit/page.tsx
    - src/app/(protected)/products/[id]/edit/edit-form.tsx
    - src/components/ui/alert-dialog.tsx
  modified:
    - src/actions/products.ts

decisions:
  - id: delete-confirmation-dialog
    choice: "AlertDialog for delete confirmation"
    rationale: "Destructive actions require confirmation to prevent accidental data loss"
  - id: edit-form-pattern
    choice: "Reuse comma-separated input pattern from ProductStep"
    rationale: "Consistency with onboarding flow, familiar UI for users"
  - id: user-ownership-check
    choice: "All actions verify user owns product via user_id"
    rationale: "Defense in depth - RLS + server action checks"

metrics:
  duration: ~11 minutes
  completed: 2026-01-23
---

# Phase 02 Plan 08: Product CRUD Pages Summary

Product management pages for listing, viewing, editing, and deleting products with RLS-protected server actions.

## What Was Built

### Task 1: Product CRUD Server Actions
Extended `src/actions/products.ts` (+87 lines):
- `getProduct(id)` - Fetches single product by ID
  - Verifies user authentication
  - Checks user_id ownership
  - Returns null if not found or unauthorized
- `updateProduct(id, formData)` - Updates existing product
  - Zod validation with productFormSchema
  - Updates name, description, keywords, subreddits, updated_at
  - Revalidates /products and /products/[id] paths
- `deleteProduct(id)` - Deletes product
  - Verifies user owns product
  - Revalidates /products and /dashboard paths
  - Returns success/error result

### Task 2: Products List Page
Created `src/app/(protected)/products/page.tsx` (107 lines):
- Server component with auth check
- Fetches all user products via getUserProducts()
- Card-based list showing:
  - Product name (links to detail page)
  - URL hostname with external link icon
  - Description text
  - First 5 subreddits as badges (+N more if truncated)
- Edit button per product
- Empty state with "Add your first product" CTA
- "Add Product" button in header

### Task 3: Product Detail and Edit Pages
Created `src/app/(protected)/products/[id]/page.tsx` (100 lines):
- Server component with Next.js dynamic route
- Uses Promise<{ id: string }> params pattern for Next.js 16
- Displays full product info:
  - Name, URL, description
  - Keywords as secondary badges
  - Subreddits as outline badges
  - Created/updated timestamps
- Edit and Delete buttons in header
- Back to Products navigation

Created `src/app/(protected)/products/[id]/delete-button.tsx` (63 lines):
- Client component with AlertDialog confirmation
- Shows product name in dialog title
- Warning about permanent deletion
- Loading state while deleting
- Toast feedback on success/error
- Redirects to /products on success

Created `src/app/(protected)/products/[id]/edit/page.tsx` (45 lines):
- Server component loading product data
- Passes product to EditProductForm
- Back to Product navigation

Created `src/app/(protected)/products/[id]/edit/edit-form.tsx` (144 lines):
- Client component with react-hook-form
- Zod validation via zodResolver
- Form fields: name, description, keywords, subreddits
- Comma-separated inputs with badge display
- Remove badges by clicking X
- Save Changes / Cancel buttons
- Toast feedback and redirect on success

Added `src/components/ui/alert-dialog.tsx`:
- shadcn AlertDialog component for delete confirmation

## Commits

| Hash | Message | Files |
|------|---------|-------|
| 0a0a1f8 | feat(02-08): add product CRUD server actions | src/actions/products.ts |
| 48a7cab | feat(02-08): create products list page | src/app/(protected)/products/page.tsx |
| 0400951 | feat(02-08): create product detail and edit pages | 5 files |

## Verification Results

1. [x] src/app/(protected)/products/page.tsx lists all user products
2. [x] src/app/(protected)/products/[id]/page.tsx shows product details
3. [x] src/app/(protected)/products/[id]/edit/page.tsx allows editing product
4. [x] Delete confirmation dialog works
5. [x] All CRUD operations use RLS (user_id checks)
6. [x] `npm run build` passes

## Success Criteria Met

- [x] Products list shows all user products (PROD-02)
- [x] User can edit existing product (PROD-03)
- [x] User can delete product with confirmation (PROD-04)
- [x] All pages are protected (authenticated only)

## Deviations from Plan

None - plan executed exactly as written.

## Next Phase Readiness

### Blockers
None.

### Concerns
None - product CRUD is fully functional.

### Ready For
02-09: Settings Page - users can now manage products, next step is user settings and profile management.
