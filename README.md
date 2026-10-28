# SONMUN conference site

This is a Next.js 16 conference site using Prisma, PostgreSQL, Google Sheets, and Resend.

## Conference setup

Conference-specific content is stored in [`config/conference.json`](C:/Desktop/sonmun/config/conference.json). For a new conference, update that file rather than searching the application source. It contains:

- conference name, dates, location, URL, SEO keywords, and organizer metadata
- the full color palette and asset paths
- enabled application types, card descriptions, and application images
- application labels, option lists, validation messages, committee choices, and separate `form.questions` sections for delegate, chair, delegation, press, and admin applications
- navigation, ordered `copy.letters.entries` content, footer, and page metadata copy

Committee and Executive Team content is database-backed and managed from `/admin`; it is intentionally not duplicated in JSON.

## Admin panel

After logging in at `/admin`, administrators can:

- create, edit, publish, order, and delete committees and Executive Team members
- edit conference names, dates, countdown start, hashtag, location, organizer details, and site URL
- edit each application card/form title and description
- enable or disable each application type; disabled types disappear from `/apply` and reject direct form/API requests
- edit the existing labels and prompts for every delegate, chair, delegation, press, and admin question
- set optional minimum word and character limits for questions; use `0` to leave a limit disabled
- add, edit, delete, and reorder multiple letters, each with its own title and content box

Conference settings are stored in the `ConferenceSettings` database table. If the table is unavailable, the site falls back to `config/conference.json`. Application questions are ordered arrays of explicit question objects with an `id`, label, type, required flag, placeholder, and dropdown options. In the admin panel, edit the visible question text directly, choose the answer type, enter dropdown options one per line, use the arrows to set order, and delete or add rows as needed. The generated Google Sheets header below each application group follows that same order. The required Muhteşem Yüzyıl rating appears after selecting `FKK: Muhteşem Yüzyıl` in delegate and chair applications.

## Applications & Mail Center

Open `/admin/applications` from the admin dashboard. The page stores applications in the database and keeps the Google Sheets append flow intact:

- **Import existing applications.** "Sync sheets" reads the five Google Sheets with the existing read-only service account, one application type at a time. Rows are matched by a stable source key, so re-running a sync is safe. Status, committee, allocation, notes, and email history are preserved; only imported fields are refreshed.
- **Review and decide.** Filter by type, status, email state, or search text. Set a status directly in the table, assign a committee and allocation, and keep internal notes in the detail view.
- **Send status emails.** The accepted, waitlisted, and denied templates are stored in the `EmailTemplate` table and are editable in the Mail Center. Variables such as `{{name}}`, `{{committee}}`, and `{{dates}}` are replaced per application. Emails use the sender address from Site Settings and are logged in `ApplicationEmailLog`.
- **Bulk sends.** Select rows or use "Send unsent" to send the current status email to every matching application that has a final status and has not received it yet. Sends are chunked with rate-limit spacing, and failed recipients can be retried.
- **Custom email.** Send a one-off message from an application detail view. Custom messages are logged but do not change the status-email state.
- **Export.** The CSV export includes workflow fields and email state; it deliberately excludes full application answers. A UTF-8 BOM keeps Turkish characters readable in spreadsheet tools.
- **Privacy.** Admin pages are `no-store` and `noindex`, the three new tables have RLS enabled, and the application list does not load full answers until a detail view is opened.

Delegation applications are stored as one application per school/contact email, with the delegate rows nested under `answers.delegates`. The sync warns when the sheet's declared delegate count differs from the number of rows and keeps every row.

Set `DISABLE_EMAIL_SENDING=true` to simulate status and custom sends locally. The Mail Center logs simulated sends without changing the application's last status-email timestamp. `RESEND_SECONDARY_API_KEY` and `RESEND_SECONDARY_FROM` are optional and are used only when the primary Resend account hits a quota or rate limit.

Apply the Prisma migration before deploying the Mail Center. The migration is additive: it creates `Application`, `EmailTemplate`, and `ApplicationEmailLog` and enables RLS. Do not use `prisma migrate reset` against the shared database.

> The live database also contains a pre-existing unused `verification_codes` table that is not in the migration history. `prisma migrate dev` may report drift because of it. Use `prisma migrate deploy` for additive migrations until that table is reconciled; never reset the shared database to clear the warning.

## Environment variables

Copy `.env.example` to `.env.local` and fill in the values. It documents every variable used by the app without including secrets. `NEXT_PUBLIC_SITE_URL` is the conference URL override; the default is the URL in `conference.json`. Set `GOOGLE_SITE_VERIFICATION` only when Google Search Console gives you a verification token for the deployment.

## Development

Install dependencies and run the development server with pnpm:

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

Prisma is generated as part of `pnpm build`. After changing `prisma/schema.prisma`, you can regenerate it manually with `pnpm prisma:generate`.

Before deploying, set the database, Resend, Google Sheets, and admin authentication variables in the hosting provider. Never commit `.env.local`.

Set the Resend sender address from `/admin` under Site Settings. New installations default to `onboarding@resend.dev`; replace it with an address on a domain verified in Resend before production email delivery.

For local application API testing, set `DISABLE_EMAIL_SENDING=true`. The API stores the verification code and logs it locally instead of sending through Resend. Remove the flag or set it to `false` before testing real email delivery or deploying.

After logging in at `/admin`, committees and Executive Team members, conference settings, application availability, form rules, application questions, and the letters page are managed from the same dashboard. Questions can be edited, added, or deleted per application type. The bottom of the Application Questions section also provides ordered, tab-separated Google Sheets headers ready to paste into cell `A1`. The image fields can upload PNG, JPG, WebP, and GIF files up to 10 MB directly to Vercel Blob; set `BLOB_STORE_ID` and `BLOB_READ_WRITE_TOKEN` in `.env.local` and your deployment environment.

## Google Sheets headers

The application API writes columns in fixed orders. To create a sheet header quickly, copy one complete tab-separated line below and paste it into cell `A1` in the matching Google Sheet. Google Sheets will distribute the values across columns automatically.

### Delegate

```text
Full Name	Email Address	Phone Number	National ID	Birth Date	Gender	School Name	Grade/Level	English Level	1. Committee Choice	2. Committee Choice	3. Committee Choice	Muhteşem Yüzyıl bilginizi 10 üzerinden nasıl değerlendirirsiniz?	Previous Experiences	Motivation Letter	Dietary Preferences	Anything you would like to add?
```

### Chair

```text
Full Name	Email Address	Phone Number	National ID	Birth Date	Gender	School Name	Grade/Level	1. Committee Choice	2. Committee Choice	3. Committee Choice	Muhteşem Yüzyıl bilginizi 10 üzerinden nasıl değerlendirirsiniz?	Previous Experiences	Motivation Letter	References	If your application for the chairboard is not approved, would you like to participate as a delegate?	Some of your delegates on the committee are saying that another delegate is using AI. What would you do in that situation?	Your delegates on the committee are beginning to disregard your authority and overstep the boundaries of respect. What would you do in this situation?	(For General Assembly and Special Committees) The second day of the conference has ended, but not enough topics have been discussed for the resolution paper, and your committee may fail. What would you do in that case?	(For General Assembly and Special Committees) Two delegates are including personal matters outside of the committee's agenda item during a debate. What would you do in that case?	(For Special and Crisis Committees) You are aware that one of your delegates is dissatisfied with the cabinet and wants to switch to a rival cabinet by writing a top secret directive. What action would you take as the chairboard in this situation?	(For Special and Crisis Committees) You overheard two delegates from different cabinets sharing important information with each other during lunch break, such as troop numbers and war plans. What would you do in that situation?	(For Crisis Committees) Explain the crisis procedure in detail, as if you were explaining it to a first timer delegate, and write down step-by-step how the first session will be processed.	Dietary Preferences	Anything you would like to add?
```

### Delegation

Delegation submissions write one summary row and then one row per delegate. The slash in this header separates the summary-row value from the delegate-row value for columns that share the same position. Paste this single line into `A1`.

```text
School or Organization / Delegate Full Name	Number of Delegates / Birth Date	Advisor/Delegation Email / National ID	Gender	1. Committee Choice	2. Committee Choice	3. Committee Choice	English Level	Dietary Preferences	Delegate Email	Delegate Phone	Grade/Level	Previous Experiences	Motivation Letter	References	Anything you would like to add?
```

### Press

```text
Full Name	Email Address	Phone Number	National ID	Birth Date	Gender	School Name	Grade/Level	Previous Experiences	Motivation Letter	Camera Model	Dietary Preferences	Anything you would like to add?
```

### Admin

```text
Full Name	Email Address	Phone Number	National ID	Birth Date	Gender	School Name	Grade/Level	Previous Experiences	All committees exited for lunch or dessert at the same time, causing severe crowding in the dining area. What strategy should you and your team follow to prevent congestion in the hallways and corridors?	In a regular committee, a delegate asks you to pass a note while a motion is being raised or during a voting procedure. What would you do?	In your opinion, what should committee admins expect from floor/running admins?	Motivation Letter	Dietary Preferences	Anything you would like to add?
```
