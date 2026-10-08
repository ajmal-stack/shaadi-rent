import { BookingNotificationData, NotificationEvent, RecipientInfo } from "../types";

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });
  } catch {
    return dateStr;
  }
}

export function generateWhatsAppContent(
  event: NotificationEvent,
  recipient: RecipientInfo,
  data: BookingNotificationData,
  siteUrl: string = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
): string {
  const isOwner = recipient.role === "owner";
  const bookingLink = `${siteUrl}/bookings/${data.bookingId}`;

  switch (event) {
    case "booking_confirmed":
      if (isOwner) {
        return (
          `🛍️ *ShaadiRent: New Rental Order!* \n\n` +
          `Hi ${recipient.name},\n` +
          `Great news! Your outfit *${data.outfitTitle}* has been booked for rental.\n\n` +
          `• *Booking Ref:* ${data.bookingNumber}\n` +
          `• *Rental Dates:* ${formatDate(data.rentalStartDate)} – ${formatDate(data.rentalEndDate)}\n` +
          `• *Your Earnings:* ₹${Math.round(data.rentalAmount * 0.85).toLocaleString("en-IN")}\n\n` +
          `Please ensure the outfit is dry cleaned, pressed, and ready in the garment bag.\n` +
          `Manage orders: ${siteUrl}/owner/bookings`
        );
      }
      return (
        `🎉 *ShaadiRent: Booking Confirmed!* \n\n` +
        `Hi ${recipient.name},\n` +
        `Your wedding outfit *${data.outfitTitle}* is officially booked!\n\n` +
        `• *Booking ID:* ${data.bookingNumber}\n` +
        `• *Rental Window:* ${formatDate(data.rentalStartDate)} – ${formatDate(data.rentalEndDate)}\n` +
        `• *Total Paid:* ₹${data.totalAmount.toLocaleString("en-IN")} (Deposit: ₹${data.securityDeposit.toLocaleString("en-IN")})\n\n` +
        `We'll notify you as soon as the outfit is dispatched.\n` +
        `View booking details: ${bookingLink}`
      );

    case "out_for_delivery":
      return (
        `🚚 *ShaadiRent: Out For Delivery!* \n\n` +
        `Hi ${recipient.name},\n` +
        `Your outfit *${data.outfitTitle}* (#${data.bookingNumber}) is dispatched and out for delivery today!\n\n` +
        `${data.trackingNumber ? `• *Tracking:* ${data.trackingNumber}\n` : ""}` +
        `Please inspect the outfit upon arrival. Enjoy your wedding festivities!\n` +
        `Track order: ${bookingLink}`
      );

    case "delivered":
      return (
        `✨ *ShaadiRent: Delivered!* \n\n` +
        `Hi ${recipient.name},\n` +
        `Your outfit *${data.outfitTitle}* has been delivered safely. Your rental period is now active.\n\n` +
        `• *Return Scheduled:* ${formatDate(data.rentalEndDate)}\n\n` +
        `Wishing you an extraordinary wedding celebration! 💍\n` +
        `Details: ${bookingLink}`
      );

    case "return_reminder":
      return (
        `⏰ *ShaadiRent: Return Reminder* \n\n` +
        `Hi ${recipient.name},\n` +
        `Friendly reminder that courier pickup for *${data.outfitTitle}* (#${data.bookingNumber}) is scheduled for *tomorrow* (${formatDate(data.rentalEndDate)}).\n\n` +
        `Please pack the outfit back into its original ShaadiRent garment bag. Your deposit of ₹${data.securityDeposit.toLocaleString("en-IN")} will be released right after inspection!\n` +
        `Return info: ${bookingLink}`
      );

    case "returned_inspection":
      return (
        `🔍 *ShaadiRent: Return Received* \n\n` +
        `Hi ${recipient.name},\n` +
        `Your returned outfit *${data.outfitTitle}* (#${data.bookingNumber}) has arrived safely at our hub. Our quality inspection team is now reviewing it.`
      );

    case "completed_refund":
      const refundAmt = data.refundAmount ?? data.securityDeposit;
      return (
        `💚 *ShaadiRent: Security Deposit Refunded!* \n\n` +
        `Hi ${recipient.name},\n` +
        `Your inspection passed! We have processed a deposit refund of *₹${refundAmt.toLocaleString("en-IN")}* to your original payment method.\n\n` +
        `We'd love to see your photos! Leave a quick review: ${bookingLink} ⭐`
      );

    case "booking_cancelled":
      return (
        `❌ *ShaadiRent: Booking Cancelled* \n\n` +
        `Hi ${recipient.name},\n` +
        `Your booking #${data.bookingNumber} for *${data.outfitTitle}* has been cancelled.\n` +
        `${data.cancellationReason ? `Reason: ${data.cancellationReason}\n` : ""}` +
        `Browse more styles: ${siteUrl}/browse`
      );

    case "dispute_alert":
      return (
        `⚠️ *ShaadiRent: Dispute Notice* \n\n` +
        `Hi ${recipient.name},\n` +
        `A dispute claim was filed for booking #${data.bookingNumber} (${data.outfitTitle}).\n` +
        `Our support concierge is reviewing it. Case updates: ${bookingLink}`
      );

    case "test_notification":
    default:
      return (
        `🔔 *ShaadiRent: WhatsApp Integration Test* \n\n` +
        `Hi ${recipient.name},\n` +
        `Your WhatsApp notification service is working perfectly! You will receive wedding rental updates directly here. ✨`
      );
  }
}

export function generateSmsContent(
  event: NotificationEvent,
  recipient: RecipientInfo,
  data: BookingNotificationData
): string {
  switch (event) {
    case "booking_confirmed":
      return `ShaadiRent: Booking confirmed for ${data.outfitTitle} (#${data.bookingNumber}). Rental: ${formatDate(data.rentalStartDate)}-${formatDate(data.rentalEndDate)}.`;
    case "out_for_delivery":
      return `ShaadiRent: Outfit ${data.outfitTitle} (#${data.bookingNumber}) is out for delivery today. Have an amazing event!`;
    case "delivered":
      return `ShaadiRent: Outfit delivered! Return pickup is scheduled for ${formatDate(data.rentalEndDate)}.`;
    case "return_reminder":
      return `ShaadiRent: Reminder - return pickup for ${data.outfitTitle} (#${data.bookingNumber}) is scheduled for tomorrow. Please keep garment bag ready.`;
    case "returned_inspection":
      return `ShaadiRent: Outfit received back. Quality inspection started for #${data.bookingNumber}.`;
    case "completed_refund":
      return `ShaadiRent: Security deposit refund of Rs ${data.refundAmount ?? data.securityDeposit} processed for #${data.bookingNumber}. Thank you for renting!`;
    case "booking_cancelled":
      return `ShaadiRent: Booking #${data.bookingNumber} has been cancelled.`;
    case "dispute_alert":
      return `ShaadiRent: A dispute was opened for booking #${data.bookingNumber}. Concierge is reviewing.`;
    case "test_notification":
    default:
      return `ShaadiRent: SMS notification channel test successful for ${recipient.name}.`;
  }
}
