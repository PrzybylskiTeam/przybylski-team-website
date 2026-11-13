# Przybylski Team website — proposed November revision

This is a continuation of the November 11 preview, not a new brand direction. The review branch must not be used as the Pages publishing source before Nathan approves the design and launch scope.

## Files and updates

- `index.html`: homepage, using the three newer portraits recovered from the November preview.
- `properties.html`: active and pending filters; `sold.html`: selected closed transactions.
- `property.html?id=...`: property details, generated from a record at runtime.
- `reviews.html`: short, attributed client excerpts and original platform links.
- `contact.html`: call, text, email and an explicitly labeled email-draft composer. It does not send a message from the website.
- `assets/css/styles.css`: brand tokens and responsive design. Navy #0b203c, deep red #841c30, cream #f8f6f1, gold #cfb16b.
- `assets/js/app.js`: menus, filters, safe rendering and email drafts. No trackers or external JavaScript dependencies.
- `data/properties.json`, `data/reviews.json`, `data/site.json`: content and integration status. Property and review updates do not require rebuilding the design.
- `docs/AUDIT-2026-11-13.md`: existing setup, source evidence, unresolved checks and launch proposal.
- `scripts/check.py`: local content and internal-link validation.
- `scripts/preview.py`: produces a portable, self-contained HTML preview from the current files.

## Preview and validation

Use Python 3: `python -m http.server 8766 --bind 127.0.0.1` from this directory; open http://127.0.0.1:8766. Or generate the portable preview with `python scripts/preview.py PATH_TO_PREVIEW.html`. Only use the HTTP version to test real file fetching. Run `python scripts/check.py` and `node --check assets/js/app.js` before proposing a change.

## Content process

For a property update, verify current price, status, details and represented side in the authorized MLS/brokerage source. Record the exact source URL, verification date, relevant MLS number and attribution. Obtain the required seller/brokerage authority and media rights before publishing. Use `published: false` for drafts; `marketingApproved: true` enables a verified record. That flag is a display gate, not proof of permission. Public facts checked in this preview still need an MLS and broker review before launch.

Keep land categorized as `vacant_land`; never convert lot area into interior square footage. Use `soldPrice` only for a verified closed amount and identify buyer/seller representation. Remove stale active/pending records when availability cannot be confirmed. After seven days without verification, the interface changes their label to “Confirm availability”; this is a warning, not a refresh or automated status check.

For photos, use team-owned or expressly licensed assets. Set `photoPermission: true` only after documenting permission. Listing photos are intentionally absent in this revision; links lead to the original listing. The legacy repository's business-card photo is not used by these pages. Team portraits are separate files so crops can change without editing every page.

For reviews, verify the exact wording and reviewer on the source platform. Use only a short, accurately attributed excerpt, or obtain permission for longer text. Record `verifiedAt`, `link`, `excerpt`, `reuseBasis` and the approval decision. Do not fabricate star ratings or add aggregate review schema. Current Google/Zillow snippets are manual excerpts, not API results. Facebook is withheld pending resolution of conflicting page IDs.

Practical upkeep: check active/pending records before each marketing update and at least weekly while listings are advertised; check closed transactions monthly; review platform links, contact details and review wording monthly. These are proposed operating intervals, not scheduled automations. Log each change and source in the pull request. If uncertain, hide the record and ask the team.

## Integrations

No listing or review feed is connected or tested. Preferred next step: ask the brokerage/GEBOR for an authorized IDX/vendor option compatible with this static site and its attribution, refresh and photo-use rules. Use only an approved provider/API; do not build Zillow, Facebook or Google scraping jobs. Google review widgets/API options need terms, attribution and account access reviewed before selection; do not assume one provider supports all three platforms.

GitHub Pages is static hosting and cannot process contact submissions itself. The current composer only creates a `mailto:` link. To add delivery, select a brokerage-approved hosted form or CRM endpoint, review privacy/consent wording, then test a uniquely labeled submission through to the destination inbox/CRM, including reply routing and failure handling. Do not label delivery “working” until receipt is confirmed. No provider account, subscription or new credential was created.

The legacy `admin/` configuration uses `git-gateway`, but a gateway/identity service is not established. It is not a verified editing system. Maintain JSON through reviewed GitHub changes for now; do not store tokens in browser JavaScript. The proposed branch replaces the exposed legacy admin page with an honest notice.

## Publication and rollback

Canonical remote: https://github.com/PrzybylskiTeam/przybylski-team-website. The live main branch was inspected at `2f04f2578fb181b7833dcd15bf29d48f85c173fd`; do not overwrite later user work. Recheck the head and Pages publishing source before merging. Work on a separate review branch; merge only after Nathan sees and approves the proposal. Do not enable auto-merge.

The current DNS already targets GitHub Pages. No DNS change is proposed. Preserve `CNAME` and every existing DNS/email record. Confirm Pages branch/folder, domain verification, HTTPS enforcement and the successful build in the signed-in settings before launch. The audit records the public DNS snapshot; it is not a complete GoDaddy zone export.

Launch needs a deliberate patch to remove `noindex,nofollow` and the preview label, add canonical metadata/sitemap for the approved domain, verify required brokerage/MLS disclosures, and pass the final content review. Do not remove preview indicators while launch is still pending.

After an approved merge, check HTTPS on the apex and www, all pages, actual content JSON and images, mobile menu, outbound profile links and the contact path. Confirm any connected form receipt. Revert the launch merge if necessary; the old baseline is recoverable but currently shows a README, so a rollback restores that known degraded state. Fix forward only with an approved, reviewed change.
