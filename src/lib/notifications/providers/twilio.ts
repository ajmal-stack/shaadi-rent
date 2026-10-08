/**
 * Deprecated: Twilio is disabled.
 * The application has migrated completely to 100% Free Notification Services:
 * - Free 1-Click WhatsApp links (wa.me) & Meta WhatsApp Cloud API (1,000 free convos/mo) -> @/lib/notifications/providers/whatsapp
 * - Free Transactional Email via Resend Free Tier (3,000 emails/mo) -> @/lib/notifications/providers/resend
 * - In-App Notification Center with real-time alerts -> @/lib/notifications/dispatcher
 */

import { ChannelDeliveryStatus } from "../types";

export interface SendMessageParams {
  to: string;
  body: string;
  isWhatsApp?: boolean;
}

export async function sendTwilioMessage(_params: SendMessageParams): Promise<ChannelDeliveryStatus> {
  console.info("[Twilio Disabled] Using 100% Free notification channels instead (WhatsApp wa.me & Resend).");
  return {
    status: "skipped",
    provider: "system",
    error: "Twilio disabled in favor of 100% free providers (wa.me & Resend free tier)",
  };
}
