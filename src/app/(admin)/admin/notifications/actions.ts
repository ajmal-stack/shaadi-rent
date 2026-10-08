"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createFreeWhatsAppUrl, sendFreeWhatsAppMessage } from "@/lib/notifications/providers/whatsapp";
import { sendEmailViaResend } from "@/lib/notifications/providers/resend";

// ── Admin Verification Helper ────────────────────────────────────────────────
async function assertAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) throw new Error("Authentication required.");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    throw new Error("Admin access required.");
  }

  return user;
}

export interface BroadcastStats {
  totalUsers: number;
  promotionsOpted: number;
  whatsappReady: number;
  totalCampaigns: number;
}

export interface BroadcastCampaignItem {
  id: string;
  title: string;
  message: string;
  offer_code: string | null;
  discount_percent: number | null;
  target_audience: string;
  channels: string[];
  action_url: string | null;
  recipients_count: number;
  created_at: string;
}

// ── 1. Fetch Stats & Recent Campaigns ─────────────────────────────────────────
export async function getBroadcastStatsAction(): Promise<{
  success: boolean;
  stats?: BroadcastStats;
  campaigns?: BroadcastCampaignItem[];
  error?: string;
}> {
  try {
    await assertAdmin();
    const admin = createAdminClient();

    // Fetch all profiles
    const { data: profiles, error: pErr } = await admin
      .from("profiles")
      .select("id, phone, notification_prefs, role");

    if (pErr) throw pErr;

    const allProfiles = profiles || [];
    const totalUsers = allProfiles.length;
    const whatsappReady = allProfiles.filter((p) => Boolean(p.phone && p.phone.trim().length >= 10)).length;
    
    const promotionsOpted = allProfiles.filter((p) => {
      const prefs = p.notification_prefs as Record<string, boolean> | null;
      return !prefs || prefs.promotions !== false;
    }).length;

    // Fetch campaign history
    let campaigns: BroadcastCampaignItem[] = [];
    try {
      const { data: campData } = await admin
        .from("broadcast_campaigns")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      if (campData) {
        campaigns = campData.map((c) => ({
          id: c.id,
          title: c.title,
          message: c.message,
          offer_code: c.offer_code,
          discount_percent: c.discount_percent,
          target_audience: c.target_audience,
          channels: Array.isArray(c.channels) ? (c.channels as string[]) : [],
          action_url: c.action_url,
          recipients_count: c.recipients_count || 0,
          created_at: c.created_at,
        }));
      }
    } catch {
      // Table might not be created yet, return empty list safely
      campaigns = [];
    }

    return {
      success: true,
      stats: {
        totalUsers,
        promotionsOpted,
        whatsappReady,
        totalCampaigns: campaigns.length,
      },
      campaigns,
    };
  } catch (err: unknown) {
    console.error("[getBroadcastStatsAction] Error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to load broadcast stats.",
    };
  }
}

// ── 2. Dispatch Broadcast & Promotional Offer ────────────────────────────────
export interface DispatchBroadcastParams {
  title: string;
  message: string;
  offerCode?: string;
  discountPercent?: number;
  targetAudience: "all" | "promotions_opted" | "customers" | "owners";
  channels: Array<"in_app" | "whatsapp" | "email">;
  actionUrl?: string;
}

export async function dispatchAdminBroadcastAction(params: DispatchBroadcastParams): Promise<{
  success: boolean;
  message: string;
  recipientsCount?: number;
  sampleWhatsAppUrl?: string;
}> {
  try {
    const adminUser = await assertAdmin();
    const admin = createAdminClient();

    const trimmedTitle = params.title.trim();
    const trimmedMessage = params.message.trim();
    const offerCode = params.offerCode?.trim().toUpperCase() || null;
    const actionUrl = params.actionUrl?.trim() || "/browse";
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const fullActionUrl = actionUrl.startsWith("http") ? actionUrl : `${siteUrl}${actionUrl.startsWith("/") ? "" : "/"}${actionUrl}`;

    if (!trimmedTitle || trimmedTitle.length < 3) {
      return { success: false, message: "Offer title must be at least 3 characters." };
    }
    if (!trimmedMessage || trimmedMessage.length < 10) {
      return { success: false, message: "Offer message must be at least 10 characters." };
    }
    if (!params.channels || params.channels.length === 0) {
      return { success: false, message: "Please select at least one delivery channel." };
    }

    // 1. Fetch targeted recipients
    const { data: profiles, error: pErr } = await admin
      .from("profiles")
      .select("id, full_name, email, phone, role, notification_prefs");

    if (pErr) throw pErr;

    let targetProfiles = profiles || [];

    if (params.targetAudience === "promotions_opted") {
      targetProfiles = targetProfiles.filter((p) => {
        const prefs = p.notification_prefs as Record<string, boolean> | null;
        return !prefs || prefs.promotions !== false;
      });
    } else if (params.targetAudience === "customers") {
      targetProfiles = targetProfiles.filter((p) => p.role === "customer");
    } else if (params.targetAudience === "owners") {
      targetProfiles = targetProfiles.filter((p) => p.role === "owner");
    }

    if (targetProfiles.length === 0) {
      return {
        success: false,
        message: "No registered users matched the selected audience criteria.",
      };
    }

    // Prepare formatted message for WhatsApp & Email
    const promoSuffix = offerCode
      ? `\n\n🎁 Use Code: *${offerCode}*${params.discountPercent ? ` for ${params.discountPercent}% OFF!` : ""}`
      : "";
    const formattedWhatsAppBody =
      `✨ *ShaadiRent Special Announcement* ✨\n\n` +
      `*${trimmedTitle}*\n\n` +
      `${trimmedMessage}` +
      `${promoSuffix}\n\n` +
      `Explore luxury bridal outfits: ${fullActionUrl}`;

    let sampleWhatsAppUrl: string | undefined = undefined;

    // 2. Dispatch to each recipient
    const batchNotificationInserts: Array<{
      user_id: string;
      event: string;
      title: string;
      message: string;
      channels: string[];
      delivery_status: Record<string, unknown>;
      metadata: Record<string, unknown>;
    }> = [];

    for (const recipient of targetProfiles) {
      const waUrl = recipient.phone
        ? createFreeWhatsAppUrl(recipient.phone, formattedWhatsAppBody)
        : null;

      if (!sampleWhatsAppUrl && waUrl) {
        sampleWhatsAppUrl = waUrl;
      }

      const deliveryReport: Record<string, unknown> = {};

      // Channel: In-App
      if (params.channels.includes("in_app")) {
        deliveryReport.in_app = { status: "sent", sentAt: new Date().toISOString() };
      }

      // Channel: WhatsApp (Free 1-Click + Meta Cloud API if configured)
      if (params.channels.includes("whatsapp") && recipient.phone) {
        try {
          const waResult = await sendFreeWhatsAppMessage({
            to: recipient.phone,
            body: formattedWhatsAppBody,
          });
          deliveryReport.whatsapp = waResult;
        } catch (err: unknown) {
          deliveryReport.whatsapp = {
            status: "simulated",
            messageId: waUrl,
            error: err instanceof Error ? err.message : "WhatsApp dispatch error",
          };
        }
      }

      // Channel: Email (Resend Free Tier)
      if (params.channels.includes("email") && recipient.email) {
        try {
          const emailResult = await sendEmailViaResend({
            to: recipient.email,
            subject: `✨ ${trimmedTitle}`,
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #FFFDF9; border: 1px solid #FFE4E6; border-radius: 20px; overflow: hidden; color: #1C1917;">
                <div style="background: linear-gradient(135deg, #881337 0%, #4C0519 100%); padding: 32px 24px; text-align: center; color: #FFFFFF;">
                  <span style="font-size: 32px;">👑</span>
                  <h1 style="margin: 12px 0 0 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">ShaadiRent Exclusive</h1>
                  <p style="margin: 4px 0 0 0; font-size: 13px; color: #FDA4AF;">Luxury Bridal & Festive Wardrobe</p>
                </div>
                <div style="padding: 32px 24px;">
                  <h2 style="margin: 0 0 16px 0; font-size: 20px; color: #881337; font-weight: 700;">${trimmedTitle}</h2>
                  <p style="font-size: 15px; line-height: 1.6; color: #44403C; margin: 0 0 20px 0;">${trimmedMessage}</p>
                  ${
                    offerCode
                      ? `
                    <div style="background: #FFF1F2; border: 2px dashed #BE123C; border-radius: 14px; padding: 18px; text-align: center; margin: 24px 0;">
                      <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 600; text-transform: uppercase; color: #9F1239; letter-spacing: 1px;">Exclusive Discount Code</p>
                      <span style="font-size: 24px; font-weight: 800; color: #881337; letter-spacing: 2px;">${offerCode}</span>
                      ${params.discountPercent ? `<p style="margin: 6px 0 0 0; font-size: 13px; color: #9F1239; font-weight: 600;">Save ${params.discountPercent}% On Your Rental</p>` : ""}
                    </div>
                  `
                      : ""
                  }
                  <div style="text-align: center; margin: 32px 0 16px 0;">
                    <a href="${fullActionUrl}" style="display: inline-block; background: #881337; color: #FFFFFF; font-weight: 600; font-size: 14px; padding: 14px 32px; border-radius: 12px; text-decoration: none; box-shadow: 0 4px 12px rgba(136, 19, 55, 0.25);">
                      Explore Collection &amp; Rent Now →
                    </a>
                  </div>
                </div>
                <div style="background: #F5F5F4; padding: 16px; text-align: center; font-size: 11px; color: #78716C; border-top: 1px solid #E7E5E4;">
                  You received this special offer because you have a registered account on ShaadiRent.
                </div>
              </div>
            `,
            text: `${trimmedTitle}\n\n${trimmedMessage}\n\n${promoSuffix}\n\nVisit: ${fullActionUrl}`,
          });
          deliveryReport.email = emailResult;
        } catch (err: unknown) {
          deliveryReport.email = {
            status: "failed",
            error: err instanceof Error ? err.message : "Email error",
          };
        }
      }

      // Collect in-app notification row
      batchNotificationInserts.push({
        user_id: recipient.id,
        event: "promotional_offer",
        title: trimmedTitle,
        message: offerCode ? `${trimmedMessage} (Code: ${offerCode})` : trimmedMessage,
        channels: params.channels,
        delivery_status: deliveryReport,
        metadata: {
          offer_code: offerCode,
          discount_percent: params.discountPercent || null,
          action_url: actionUrl,
          whatsapp_url: waUrl,
          target_audience: params.targetAudience,
          broadcast: true,
        },
      });
    }

    // Insert batch notifications into database and broadcast in realtime
    try {
      if (batchNotificationInserts.length > 0) {
        const { data: insertedRows } = await admin
          .from("notifications")
          .insert(batchNotificationInserts as any)
          .select();

        if (insertedRows && insertedRows.length > 0) {
          for (const row of insertedRows) {
            try {
              const ch = admin.channel(`realtime-notifications-${row.user_id}`);
              ch.send({
                type: "broadcast",
                event: "notification_created",
                payload: row,
              });
            } catch {}
          }
        }
      }
    } catch (insertErr) {
      console.warn("[dispatchAdminBroadcastAction] Warning inserting notifications batch:", insertErr);
    }

    // Record campaign in broadcast_campaigns audit log
    try {
      await admin.from("broadcast_campaigns").insert({
        title: trimmedTitle,
        message: trimmedMessage,
        offer_code: offerCode,
        discount_percent: params.discountPercent || null,
        target_audience: params.targetAudience,
        channels: params.channels as any,
        action_url: actionUrl,
        recipients_count: targetProfiles.length,
        created_by: adminUser.id,
        metadata: {
          sample_whatsapp_url: sampleWhatsAppUrl,
        },
      });
    } catch (logErr) {
      console.warn("[dispatchAdminBroadcastAction] Could not log to broadcast_campaigns table:", logErr);
    }

    revalidatePath("/admin/notifications");
    revalidatePath("/account");

    return {
      success: true,
      recipientsCount: targetProfiles.length,
      sampleWhatsAppUrl,
      message: `Broadcast successfully sent to ${targetProfiles.length} recipients across ${params.channels.join(", ")}!`,
    };
  } catch (err: unknown) {
    console.error("[dispatchAdminBroadcastAction] Fatal Error:", err);
    return {
      success: false,
      message: err instanceof Error ? err.message : "Failed to dispatch broadcast.",
    };
  }
}
