import { google } from "googleapis";
import { APPLICATION_TYPES, type ApplicationType } from "@/lib/applications/types";

export const SHEET_ENV_BY_TYPE: Record<ApplicationType, string> = {
  delegate: "GOOGLE_SHEET_ID_DELEGATE",
  chair: "GOOGLE_SHEET_ID_CHAIR",
  press: "GOOGLE_SHEET_ID_PRESS",
  admin: "GOOGLE_SHEET_ID_ADMIN",
  delegation: "GOOGLE_SHEET_ID_DELEGATION",
};

let cachedClient: ReturnType<typeof google.sheets> | null = null;

function getCredentials() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!raw) throw new Error("SHEET_NOT_CONFIGURED");
  try {
    const credentials = JSON.parse(raw) as { private_key?: string; client_email?: string };
    if (credentials.private_key) {
      credentials.private_key = credentials.private_key.replace(/\\n/g, "\n");
    }
    if (!credentials.client_email || !credentials.private_key) throw new Error("missing fields");
    return credentials;
  } catch {
    throw new Error("SHEET_CREDENTIALS_INVALID");
  }
}

function getSheetsClient() {
  if (cachedClient) return cachedClient;
  const auth = new google.auth.GoogleAuth({
    credentials: getCredentials(),
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  cachedClient = google.sheets({ version: "v4", auth });
  return cachedClient;
}

export function isSheetConfigured(type: ApplicationType) {
  return Boolean(process.env[SHEET_ENV_BY_TYPE[type]] && process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
}

export function configuredApplicationTypes() {
  return APPLICATION_TYPES.filter((type) => isSheetConfigured(type));
}

export async function fetchSheetRows(type: ApplicationType): Promise<string[][]> {
  const spreadsheetId = process.env[SHEET_ENV_BY_TYPE[type]];
  if (!spreadsheetId) throw new Error("SHEET_NOT_CONFIGURED");

  const sheets = getSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "Sayfa1!A:ZZ",
    valueRenderOption: "FORMATTED_VALUE",
  });

  return (response.data.values ?? []).map((row) => row.map((cell) => String(cell ?? "")));
}
