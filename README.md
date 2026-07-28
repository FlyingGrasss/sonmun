# SONMUN conference site

This is a Next.js 16 conference site using Prisma, PostgreSQL, Google Sheets, and Resend.

## Conference setup

Conference-specific content is stored in [`config/conference.json`](C:/Desktop/sonmun/config/conference.json). For a new conference, update that file rather than searching the application source. It contains:

- conference name, dates, location, URL, SEO keywords, and organizer metadata
- the full color palette and asset paths
- enabled application types, card descriptions, and application images
- application labels, option lists, validation messages, committee choices, and separate `form.questions` sections for delegate, chair, delegation, press, and admin applications
- navigation, letters, footer, and page metadata copy

Committee and Secretariat content is database-backed and managed from `/admin`; it is intentionally not duplicated in JSON.

## Admin panel

After logging in at `/admin`, administrators can:

- create, edit, publish, order, and delete committees and Secretariat members
- edit conference names, dates, countdown start, hashtag, location, organizer details, and site URL
- edit each application card/form title and description
- enable or disable each application type; disabled types disappear from `/apply` and reject direct form/API requests
- edit the existing labels and prompts for every delegate, chair, delegation, press, and admin question
- edit the Letters page title, opening, and paragraphs

Conference settings are stored in the `ConferenceSettings` database table. If the table is unavailable, the site falls back to `config/conference.json`. Editing question wording does not add new form fields; new fields still require a code/API change.

## Environment variables

Copy `.env.example` to `.env.local` and fill in the values. It documents every variable used by the app without including secrets. `NEXT_PUBLIC_SITE_URL` is the only conference URL override; the default is the URL in `conference.json`.

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
Full Name	E-mail	Phone	National ID	Birth Date	Gender	School	Grade	English Level	1. Committee	2. Committee	3. Committee	Experience	Motivation Letter	Dietary Preferences	Anything you would like to add?
```

### Chair

```text
Full Name	E-mail	Phone	National ID	Birth Date	Gender	School	Grade	English Level	1. Committee	2. Committee	3. Committee	Experience	References	Motivation Letter	GA Resolution Papers Question	Crisis Directive Question	Regular Committee Motions Question	Dietary Preferences	Anything you would like to add?
```

### Delegation

Delegation submissions write one summary row and then one row per delegate. The slash in this header separates the summary-row value from the delegate-row value for columns that share the same position. Paste this single line into `A1`.

```text
School Name / Delegate Full Name	Delegate Count / Birth Date	Advisor/delegation E-mail / National ID	Gender	1. Committee	2. Committee	3. Committee	English Level	Dietary Preferences	E-mail	Phone Number	Grade	Experience	Motivation Letter	Anything you would like to add?
```

### Press

```text
Full Name	E-mail	Phone	National ID	Birth Date	Gender	School	Grade	Experience	Motivation Letter	Camera Model	Dietary Preferences	Anything you would like to add?
```

### Admin

```text
Full Name	E-mail	Phone	National ID	Birth Date	Gender	School	Grade	Experience	Motivation Letter	Dietary Preferences	Anything you would like to add?
```
