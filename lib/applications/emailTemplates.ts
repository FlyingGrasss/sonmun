import { humanizeKey } from "@/lib/applications/format";
import type { ApplicationType, EmailStatusKey } from "@/lib/applications/types";

export type EmailConference = {
  brandName: string;
  displayName: string;
  shortName: string;
  dates: string;
  location: { city: string; country: string };
  siteUrl: string;
  senderEmail: string;
};

export const DEFAULT_EMAIL_TEMPLATES: Record<EmailStatusKey, { subject: string; body: string }> = {
  accepted: {
    subject: "{{conferenceName}} Application Accepted",
    body: `Dear {{name}},

We are delighted to inform you that your {{applicationType}} application for {{conferenceName}} has been accepted.

{{assignment}}
Conference dates: {{dates}}
Location: {{location}}

Please keep an eye on your inbox for further instructions about the conference. If you have any questions, reply to this email.

We look forward to seeing you at {{conferenceName}}.

Best regards,
{{conferenceName}} Executive Team`,
  },
  waitlisted: {
    subject: "{{conferenceName}} Application Update",
    body: `Dear {{name}},

Thank you for applying to {{conferenceName}}. Your {{applicationType}} application has been placed on the waitlist.

If a place becomes available, we will contact you at this email address.

Best regards,
{{conferenceName}} Executive Team`,
  },
  denied: {
    subject: "{{conferenceName}} Application Update",
    body: `Dear {{name}},

Thank you for your interest in {{conferenceName}}. After careful review, we are unable to offer you a place in the {{applicationType}} team for this session.

We appreciate the time you invested in your application and wish you the best in your future conferences.

Best regards,
{{conferenceName}} Executive Team`,
  },
};

export const EMAIL_TEMPLATE_VARIABLES: Array<{ key: string; label: string; description: string }> = [
  { key: "name", label: "Name", description: "Applicant or school name" },
  { key: "email", label: "Email", description: "Recipient email address" },
  { key: "applicationType", label: "Application type", description: "Delegate, Chairboard, Press, Admin, or Delegation" },
  { key: "conferenceName", label: "Conference name", description: "Conference display name" },
  { key: "conferenceShortName", label: "Short name", description: "Short conference name" },
  { key: "committee", label: "Committee", description: "Assigned committee" },
  { key: "allocation", label: "Allocation", description: "Assigned allocation" },
  { key: "assignment", label: "Assignment", description: "Committee and allocation sentence" },
  { key: "school", label: "School", description: "School or organization" },
  { key: "status", label: "Status", description: "Accepted, Waitlisted, or Denied" },
  { key: "dates", label: "Dates", description: "Conference dates" },
  { key: "location", label: "Location", description: "Conference city and country" },
  { key: "siteUrl", label: "Site URL", description: "Conference website" },
];

const STATUS_LABELS: Record<EmailStatusKey, string> = {
  accepted: "Accepted",
  waitlisted: "Waitlisted",
  denied: "Denied",
};

export function renderTemplate(template: string, variables: Record<string, string>) {
  return template.replace(/\{\{\s*([A-Za-z0-9_]+)\s*\}\}/g, (_, key: string) =>
    Object.hasOwn(variables, key) ? variables[key] : ""
  );
}

export function extractTemplateVariables(template: string) {
  return [...new Set([...template.matchAll(/\{\{\s*([A-Za-z0-9_]+)\s*\}\}/g)].map((match) => match[1]))];
}

export function buildTemplateVariables(input: {
  fullName: string;
  email: string;
  applicationType: ApplicationType;
  applicationTitle?: string;
  school: string | null;
  givenCommittee: string | null;
  allocation: string | null;
  status: EmailStatusKey | "custom";
  conference: EmailConference;
}) {
  const committee = input.givenCommittee?.trim() || "";
  const allocation = input.allocation?.trim() || "";
  const assignmentParts: string[] = [];
  if (committee) assignmentParts.push(`Assigned committee: ${committee}`);
  if (allocation) assignmentParts.push(`Allocation: ${allocation}`);

  return {
    name: input.fullName || "Participant",
    email: input.email,
    applicationType: input.applicationTitle || humanizeKey(input.applicationType),
    conferenceName: input.conference.displayName || input.conference.brandName,
    conferenceShortName: input.conference.shortName || input.conference.brandName,
    committee: committee || "Not assigned yet",
    allocation,
    assignment: assignmentParts.join("\n"),
    school: input.school?.trim() || "",
    status: input.status === "custom" ? "Custom" : STATUS_LABELS[input.status],
    dates: input.conference.dates,
    location: [input.conference.location.city, input.conference.location.country].filter(Boolean).join(", "),
    siteUrl: input.conference.siteUrl,
  } satisfies Record<string, string>;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function bodyToHtml(body: string) {
  return body
    .replace(/\r\n?/g, "\n")
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map(
      (paragraph) =>
        `<p style="margin:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.7;color:#3c3733;">${escapeHtml(paragraph).replace(/\n/g, "<br>")}</p>`
    )
    .join("");
}

export function renderEmailHtml(input: {
  body: string;
  conference: EmailConference;
  eyebrow?: string;
}) {
  const { conference } = input;
  const brand = conference.brandName.replace(/\s+/g, " ").trim() || "SONMUN";
  const displayName = conference.displayName.trim() || brand;
  const location = [conference.location.city, conference.location.country].filter(Boolean).join(", ");
  const footerMeta = [displayName, conference.dates, location].filter(Boolean).join(" · ");
  const siteUrl = conference.siteUrl.replace(/\/$/, "");
  const logo = `${siteUrl}/icon.png`;
  const preheader = input.body.replace(/\s+/g, " ").trim().slice(0, 140);
  const eyebrow = (input.eyebrow || "Application update").toUpperCase();

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${escapeHtml(displayName)}</title>
</head>
<body style="margin:0;padding:0;background-color:#f6f1ed;color:#272422;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f6f1ed">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:580px;background-color:#fffdfb;border:1px solid #d8c9bd;border-radius:16px;overflow:hidden;">
        <tr>
          <td bgcolor="#5A3D34" style="padding:22px 30px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td width="44" style="padding-right:12px;">
                  <img src="${escapeHtml(logo)}" width="44" height="44" alt="${escapeHtml(brand)}" style="display:block;width:44px;height:44px;border-radius:50%;border:1px solid rgba(255,255,255,.18);">
                </td>
                <td style="font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;letter-spacing:2px;color:#F1E0C5;">${escapeHtml(displayName)}</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:34px 30px 26px;">
            <p style="margin:0 0 12px;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;letter-spacing:2.4px;color:#C77B56;">${escapeHtml(eyebrow)}</p>
            ${bodyToHtml(input.body)}
          </td>
        </tr>
        <tr>
          <td bgcolor="#faf7f4" style="padding:18px 30px;border-top:1px solid #e5ddd7;">
            <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:#6d625c;">${escapeHtml(footerMeta)}</p>
            <p style="margin:6px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:#6d625c;"><a href="${escapeHtml(siteUrl)}" style="color:#C77B56;text-decoration:none;">${escapeHtml(siteUrl.replace(/^https?:\/\//, ""))}</a></p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

export function renderEmailText(input: { body: string; conference: EmailConference }) {
  const { conference } = input;
  const displayName = conference.displayName.trim() || conference.brandName;
  const location = [conference.location.city, conference.location.country].filter(Boolean).join(", ");
  const footer = [displayName, conference.dates, location].filter(Boolean).join(" · ");
  return [input.body.trim(), "", footer, conference.siteUrl].join("\n");
}

export type ApplicationEmailTarget = {
  id: string;
  fullName: string;
  email: string;
  applicationType: ApplicationType;
  school: string | null;
  givenCommittee: string | null;
  allocation: string | null;
};

export function buildStatusEmail(input: {
  application: ApplicationEmailTarget;
  statusKey: EmailStatusKey;
  template: { subject: string; body: string };
  conference: EmailConference;
  applicationTitle?: string;
}) {
  const variables = buildTemplateVariables({
    ...input.application,
    applicationTitle: input.applicationTitle,
    status: input.statusKey,
    conference: input.conference,
  });
  const subject =
    renderTemplate(input.template.subject, variables).replace(/[\r\n]+/g, " ").trim() ||
    `${input.conference.displayName} application update`;
  const body = renderTemplate(input.template.body, variables).trim();

  return {
    subject,
    html: renderEmailHtml({ body, conference: input.conference, eyebrow: STATUS_LABELS[input.statusKey] }),
    text: renderEmailText({ body, conference: input.conference }),
  };
}

export function buildCustomEmail(input: {
  application: ApplicationEmailTarget;
  subject: string;
  body: string;
  conference: EmailConference;
  applicationTitle?: string;
}) {
  const variables = buildTemplateVariables({
    ...input.application,
    applicationTitle: input.applicationTitle,
    status: "custom",
    conference: input.conference,
  });
  const subject =
    renderTemplate(input.subject, variables).replace(/[\r\n]+/g, " ").trim() ||
    `${input.conference.displayName} message`;
  const body = renderTemplate(input.body, variables).trim();

  return {
    subject,
    html: renderEmailHtml({ body, conference: input.conference, eyebrow: "Message" }),
    text: renderEmailText({ body, conference: input.conference }),
  };
}
