import { Resend } from "resend";

type SendHtmlEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

let resendClient: Resend | null = null;

export function getResendEnv() {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey) throw new Error("RESEND_API_KEY_MISSING");
  if (!from) throw new Error("RESEND_FROM_EMAIL_MISSING");
  return { apiKey, from };
}

export function getResendClient() {
  if (resendClient) return resendClient;
  const { apiKey } = getResendEnv();
  resendClient = new Resend(apiKey);
  return resendClient;
}

export async function sendHtmlEmail(input: SendHtmlEmailInput) {
  const { from } = getResendEnv();
  const client = getResendClient();
  const result = await client.emails.send({
    from,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
  });
  if (result.error) throw new Error(result.error.message);
  return { id: result.data?.id ?? null };
}
