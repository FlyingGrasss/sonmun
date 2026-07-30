# SONMUN conference site

This is a Next.js 16 conference site using Prisma, PostgreSQL, Google Sheets, and Resend.

## Conference setup

Conference-specific content is stored in [`config/conference.json`](C:/Desktop/sonmun/config/conference.json). For a new conference, update that file rather than searching the application source. It contains:

- conference name, dates, location, URL, SEO keywords, and organizer metadata
- the full color palette and asset paths
- enabled application types, card descriptions, and application images
- application labels, option lists, validation messages, committee choices, and separate `form.questions` sections for delegate, chair, delegation, press, and admin applications
- navigation, ordered `copy.letters.entries` content, footer, and page metadata copy

Committee and Secretariat content is database-backed and managed from `/admin`; it is intentionally not duplicated in JSON.

## Admin panel

After logging in at `/admin`, administrators can:

- create, edit, publish, order, and delete committees and Secretariat members
- edit conference names, dates, countdown start, hashtag, location, organizer details, and site URL
- edit each application card/form title and description
- enable or disable each application type; disabled types disappear from `/apply` and reject direct form/API requests
- edit the existing labels and prompts for every delegate, chair, delegation, press, and admin question
- set optional minimum word and character limits for questions; use `0` to leave a limit disabled
- add, edit, delete, and reorder multiple letters, each with its own title and content box

Conference settings are stored in the `ConferenceSettings` database table. If the table is unavailable, the site falls back to `config/conference.json`. Application questions are ordered arrays of explicit question objects with an `id`, label, type, required flag, placeholder, and dropdown options. In the admin panel, edit the visible question text directly, choose the answer type, enter dropdown options one per line, use the arrows to set order, and delete or add rows as needed. The generated Google Sheets header below each application group follows that same order. The required Muhteşem Yüzyıl rating appears after selecting `FKK: Muhteşem Yüzyıl` in delegate and chair applications.

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

For local application API testing, set `DISABLE_EMAIL_SENDING=true`. The API stores the verification code and logs it locally instead of sending through Resend. Remove the flag or set it to `false` before testing real email delivery or deploying.

After logging in at `/admin`, committees and Secretariat members, conference settings, application availability, form rules, application questions, and the letters page are managed from the same dashboard. Questions can be edited, added, or deleted per application type. The bottom of the Application Questions section also provides ordered, tab-separated Google Sheets headers ready to paste into cell `A1`. The image fields can upload PNG, JPG, WebP, and GIF files up to 10 MB directly to Vercel Blob; set `BLOB_STORE_ID` and `BLOB_READ_WRITE_TOKEN` in `.env.local` and your deployment environment.

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
School or Organization / Delegate Full Name	Number of Delegates / Birth Date	Advisor/Delegation Email / National ID	Gender	1. Committee Choice	2. Committee Choice	3. Committee Choice	English Level	Dietary Preferences	Delegate Email	Delegate Phone	Grade/Level	Previous Experiences	Motivation Letter	Anything you would like to add?
```

### Press

```text
Full Name	Email Address	Phone Number	National ID	Birth Date	Gender	School Name	Grade/Level	Previous Experiences	Motivation Letter	Camera Model	Dietary Preferences	Anything you would like to add?
```

### Admin

```text
Full Name	Email Address	Phone Number	National ID	Birth Date	Gender	School Name	Grade/Level	Previous Experiences	All committees exited for lunch or dessert at the same time, causing severe crowding in the dining area. What strategy should you and your team follow to prevent congestion in the hallways and corridors?	In a regular committee, a delegate asks you to pass a note while a motion is being raised or during a voting procedure. What would you do?	In your opinion, what should committee admins expect from floor/running admins?	Motivation Letter	Dietary Preferences	Anything you would like to add?
```
