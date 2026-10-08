import { ChannelDeliveryStatus } from "../types";

export interface SendWhatsAppParams {
  to: string; // phone number e.g. +919876543210
  body: string;
}

/**
 * Normalizes phone numbers to standard format without plus or spaces for wa.me links
 */
export function normalizePhoneForWhatsApp(rawPhone: string): string {
  const cleaned = rawPhone.replace(/[^\d]/g, "");
  if (cleaned.length === 10) return `91${cleaned}`;
  return cleaned;
}

/**
 * Generates a 100% FREE WhatsApp Click-to-Chat deep link.
 * Opens directly in WhatsApp on mobile or WhatsApp Web on desktop with pre-filled message.
 * Cost: ₹0 forever (No API subscription needed).
 */
export function createFreeWhatsAppUrl(phone: string, message: string): string {
  const normalizedPhone = normalizePhoneForWhatsApp(phone);
  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Dispatches WhatsApp message using Meta WhatsApp Cloud API (1,000 free conversations/mo)
 * or records the free 1-click WhatsApp URL in development mode.
 * Cost: 100% Free.
 */
export async function sendFreeWhatsAppMessage(params: SendWhatsAppParams): Promise<ChannelDeliveryStatus> {
  if (!params.to) {
    return {
      status: "failed",
      provider: "whatsapp_free",
      error: "Recipient phone number is missing",
      sentAt: new Date().toISOString(),
    };
  }

  const normalizedPhone = normalizePhoneForWhatsApp(params.to);
  const freeWhatsAppUrl = createFreeWhatsAppUrl(params.to, params.body);

  // If Meta WhatsApp Cloud API credentials are provided (1,000 free/mo tier)
  const metaToken = process.env.WHATSAPP_CLOUD_ACCESS_TOKEN;
  const metaPhoneId = process.env.WHATSAPP_CLOUD_PHONE_NUMBER_ID;

  if (metaToken && metaPhoneId) {
    try {
      const response = await fetch(`https://graph.facebook.com/v19.0/${metaPhoneId}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${metaToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: normalizedPhone,
          type: "text",
          text: { body: params.body },
        }),
      });

      const resData = await response.json();
      if (!response.ok) {
        console.warn("[Meta WhatsApp Cloud API Error]", resData);
        // Fallback to free wa.me url
        return {
          status: "simulated",
          provider: "whatsapp_free",
          messageId: freeWhatsAppUrl,
          recipient: normalizedPhone,
          sentAt: new Date().toISOString(),
        };
      }

      return {
        status: "sent",
        provider: "whatsapp_free",
        messageId: resData?.messages?.[0]?.id || `wa_${Date.now()}`,
        recipient: normalizedPhone,
        sentAt: new Date().toISOString(),
      };
    } catch (err) {
      console.warn("[Meta WhatsApp API Network Warning]", err);
    }
  }

  // 100% Free 1-Click WhatsApp Link & Simulation
  console.log(`\n============================================================`);
  console.log(`[FREE WHATSAPP NOTIFICATION (Cost: ₹0)]`);
  console.log(`To: +${normalizedPhone}`);
  console.log(`1-Click Send URL: ${freeWhatsAppUrl}`);
  console.log(`Message:\n${params.body}`);
  console.log(`============================================================\n`);

  // No Cloud API token — wa.me link is stored in metadata but not pushed to user
  return {
    status: "simulated",
    provider: "whatsapp_free",
    messageId: freeWhatsAppUrl,
    recipient: normalizedPhone,
    sentAt: new Date().toISOString(),
  };
}
