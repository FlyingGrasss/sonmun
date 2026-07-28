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

## Environment variables

Copy `.env.example` to `.env.local` and fill in the values. It documents every variable used by the app without including secrets. `NEXT_PUBLIC_SITE_URL` is the only conference URL override; the default is the URL in `conference.json`.

## Development

Install dependencies and run the development server with pnpm:

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

Prisma is generated automatically by `postinstall`. Vercel can use `pnpm build`; an explicit `pnpm prisma generate && pnpm build` is also valid.

Before deploying, set the database, Resend, Google Sheets, and admin authentication variables in the hosting provider. Never commit `.env.local`.

For local application API testing, set `DISABLE_EMAIL_SENDING=true`. The API stores the verification code and logs it locally instead of sending through Resend. Remove the flag or set it to `false` before testing real email delivery or deploying.

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
