import { Resend } from "resend";
import { shortHash } from "@/lib/applications/keys";
import { isValidEmail } from "@/lib/applications/validation";

export type ApplicationEmailSendResult =
  | { ok: true; resendId: string | null; simulated: boolean }
  | { ok: false; error: string; code?: string };

type SendInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
  from: string;
  replyTo?: string;
  idempotencyKey: string;
};

let primaryClient: Resend | null = null;
let secondaryClient: Resend | null = null;

function getPrimaryClient() {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return null;
  primaryClient ??= new Resend(key);
  return primaryClient;
}

function getSecondaryClient() {
  const key = process.env.RESEND_SECONDARY_API_KEY?.trim();
  const from = process.env.RESEND_SECONDARY_FROM?.trim();
  if (!key || !from) return null;
  secondaryClient ??= new Resend(key);
  return { client: secondaryClient, from };
}

function friendlyError(code: string) {
  switch (code) {
    case "daily_quota_exceeded":
    case "monthly_quota_exceeded":
      return "The Resend quota has been reached. Try again after the quota resets.";
    case "rate_limit_exceeded":
      return "The email provider is rate limiting requests. Wait a minute and try again.";
    case "invalid_from_address":
    case "invalid_access":
    case "restricted_api_key":
      return "The sender address or Resend domain is not verified.";
    case "validation_error":
    case "invalid_parameter":
    case "missing_required_field":
      return "The email provider rejected the message. Check the recipient address and template.";
    case "invalid_api_key":
    case "missing_api_key":
      return "Resend is not configured correctly.";
    default:
      return "The email could not be sent.";
  }
}

function shouldFallback(code: string) {
  return (
    code === "daily_quota_exceeded" ||
    code === "monthly_quota_exceeded" ||
    code === "rate_limit_exceeded"
  );
}

async function sendWithClient(client: Resend, input: SendInput) {
  try {
    const { data, error } = await client.emails.send(
      {
        from: input.from,
        to: [input.to],
        replyTo: input.replyTo,
        subject: input.subject,
        html: input.html,
        text: input.text,
      },
      { idempotencyKey: input.idempotencyKey }
    );

    if (error) {
      console.error("[applications:email]", { code: error.name });
      return { ok: false as const, error: friendlyError(error.name), code: error.name };
    }

    return { ok: true as const, resendId: data?.id ?? null };
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN";
    console.error("[applications:email]", { code: "exception", message: message.slice(0, 200) });
    return { ok: false as const, error: "The email could not be sent.", code: "exception" };
  }
}

export async function sendApplicationEmail(input: {
  applicationId: string;
  statusKey: string;
  to: string;
  subject: string;
  html: string;
  text: string;
  senderEmail: string;
  senderName: string;
  requestId: string;
}): Promise<ApplicationEmailSendResult> {
  if (!isValidEmail(input.to)) {
    return { ok: false, error: "The application has no valid email address.", code: "invalid_recipient" };
  }
  if (!isValidEmail(input.senderEmail)) {
    return { ok: false, error: "The configured sender address is invalid.", code: "invalid_sender" };
  }
  if (process.env.NODE_ENV === "production" && input.senderEmail === "onboarding@resend.dev") {
    return {
      ok: false,
      error: "The sender address is not configured. Set it in Site Settings before sending.",
      code: "invalid_sender",
    };
  }

  if (process.env.DISABLE_EMAIL_SENDING === "true") {
    console.info("[applications:email] simulation", {
      applicationId: input.applicationId,
      statusKey: input.statusKey,
    });
    return { ok: true, resendId: null, simulated: true };
  }

  const client = getPrimaryClient();
  if (!client) {
    return { ok: false, error: "RESEND_API_KEY is not configured.", code: "missing_api_key" };
  }

  const safeName = input.senderName.replace(/[<>"\r\n]/g, "").trim() || "SONMUN";
  const from = `${safeName} <${input.senderEmail}>`;
  const idempotencyKey = `sonmun-${shortHash(`${input.requestId}:${input.applicationId}:${input.statusKey}`)}`;
  const payload: SendInput = {
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
    from,
    replyTo: input.senderEmail,
    idempotencyKey,
  };

  const primary = await sendWithClient(client, payload);
  if (primary.ok) return { ...primary, simulated: false };

  if (primary.code && shouldFallback(primary.code)) {
    const secondary = getSecondaryClient();
    if (secondary) {
      const retry = await sendWithClient(secondary.client, {
        ...payload,
        from: secondary.from,
        idempotencyKey: `${idempotencyKey}-secondary`,
      });
      if (retry.ok) return { ...retry, simulated: false };
      return retry;
    }
  }

  return primary;
}
