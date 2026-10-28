export type ApplicationExportRow = {
  id: string;
  applicationType: string;
  fullName: string;
  email: string;
  phone: string | null;
  school: string | null;
  status: string;
  givenCommittee: string | null;
  allocation: string | null;
  notes: string | null;
  appliedAt: Date | null;
  lastEmailSentAt: Date | null;
  lastEmailStatus: string | null;
  statusEmailSent: boolean;
  createdAt: Date;
};

const HEADERS = [
  "ID",
  "Type",
  "Full Name",
  "Email",
  "Phone",
  "School",
  "Status",
  "Committee",
  "Allocation",
  "Notes",
  "Applied At",
  "Last Status Email",
  "Last Email Status",
  "Status Email Sent",
  "Created At",
];

function safeCell(value: string | number | boolean | null | undefined) {
  if (value === null || value === undefined) return "";
  let text = String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  if (/[",\n\r]/.test(text)) text = `"${text.replace(/"/g, '""')}"`;
  return text;
}

function dateCell(value: Date | null) {
  return value ? value.toISOString() : "";
}

export function applicationsToCsv(rows: ApplicationExportRow[]) {
  const lines = [HEADERS.join(",")];
  for (const row of rows) {
    lines.push(
      [
        row.id,
        row.applicationType,
        row.fullName,
        row.email,
        row.phone,
        row.school,
        row.status,
        row.givenCommittee,
        row.allocation,
        row.notes,
        dateCell(row.appliedAt),
        dateCell(row.lastEmailSentAt),
        row.lastEmailStatus,
        row.statusEmailSent ? "yes" : "no",
        dateCell(row.createdAt),
      ]
        .map(safeCell)
        .join(",")
    );
  }
  return lines.join("\n");
}
