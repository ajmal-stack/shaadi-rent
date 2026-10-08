import { ChannelDeliveryStatus } from "../types";

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

/**
 * Dispatches an email via Resend API (or simulated in development if RESEND_API_KEY is not set).
 */
export async function sendEmailViaResend(params: SendEmailParams): Promise<ChannelDeliveryStatus> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || "ShaadiRent <onboarding@resend.dev>";

  if (!params.to) {
    return {
      status: "failed",
      provider: "resend",
      error: "Recipient email is missing",
      sentAt: new Date().toISOString(),
    };
  }

  // Live Resend API call if key is configured
  if (apiKey && apiKey.startsWith("re_")) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [params.to],
          subject: params.subject,
          html: params.html,
          text: params.text,
          reply_to: params.replyTo || "support@shaadirent.com",
        }),
      });

      const resData = await response.json();

      if (!response.ok) {
        console.error("[Resend Provider Error]", resData);
        return {
          status: "failed",
          provider: "resend",
          error: resData?.message || "Failed to send email via Resend",
          recipient: params.to,
          sentAt: new Date().toISOString(),
        };
      }

      console.log(`[Resend Live Email Sent] to=${params.to} id=${resData.id} subject="${params.subject}"`);
      return {
        status: "sent",
        provider: "resend",
        messageId: resData.id,
        recipient: params.to,
        sentAt: new Date().toISOString(),
      };
    } catch (err: unknown) {
      console.error("[Resend Network Error]", err);
      return {
        status: "failed",
        provider: "resend",
        error: err instanceof Error ? err.message : "Network failure",
        recipient: params.to,
        sentAt: new Date().toISOString(),
      };
    }
  }

  // Simulated fallback when RESEND_API_KEY is not yet supplied in environment
  const simId = `sim_resend_${Date.now()}`;
  console.log(`\n============================================================`);
  console.log(`[SIMULATED TRANSACTIONAL EMAIL via Resend]`);
  console.log(`To: ${params.to}`);
  console.log(`Subject: ${params.subject}`);
  console.log(`Preview: ${params.text?.slice(0, 160)}...`);
  console.log(`(Set RESEND_API_KEY in .env.local to send live emails)`);
  console.log(`============================================================\n`);

  return {
    status: "simulated",
    provider: "resend",
    messageId: simId,
    recipient: params.to,
    sentAt: new Date().toISOString(),
  };
}
