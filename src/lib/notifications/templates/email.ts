import { BookingNotificationData, NotificationEvent, RecipientInfo } from "../types";

const BRAND_COLOR = "#881337"; // Rose-900
const ACCENT_COLOR = "#d97706"; // Amber-600
const BG_COLOR = "#fdfbf7"; // Soft warm ivory
const TEXT_MAIN = "#1c1917"; // Stone-900
const TEXT_MUTED = "#78716c"; // Stone-500

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "N/A";
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function formatINR(val?: number | null): string {
  if (val === undefined || val === null) return "₹0";
  return `₹${val.toLocaleString("en-IN")}`;
}

function emailWrapper(title: string, bodyContent: string, siteUrl: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: ${BG_COLOR};
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: ${TEXT_MAIN};
      -webkit-font-smoothing: antialiased;
    }
    .container {
      max-width: 600px;
      margin: 30px auto;
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid #f2e8e5;
      box-shadow: 0 4px 20px rgba(136, 19, 55, 0.05);
    }
    .header {
      background: linear-gradient(135deg, #881337 0%, #4c0519 100%);
      padding: 28px 32px;
      text-align: center;
      color: #ffffff;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }
    .header p {
      margin: 6px 0 0 0;
      font-size: 13px;
      color: #fecdd3;
    }
    .content {
      padding: 32px;
    }
    .badge {
      display: inline-block;
      padding: 6px 12px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      background-color: #fff1f2;
      color: #9f1239;
    }
    .card {
      background: #fafaf9;
      border: 1px solid #e7e5e4;
      border-radius: 12px;
      padding: 20px;
      margin: 20px 0;
    }
    .outfit-row {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 16px;
    }
    .outfit-img {
      width: 72px;
      height: 90px;
      object-fit: cover;
      border-radius: 8px;
      border: 1px solid #e7e5e4;
    }
    .btn {
      display: inline-block;
      background: #881337;
      color: #ffffff !important;
      text-decoration: none;
      padding: 13px 28px;
      border-radius: 10px;
      font-weight: 600;
      font-size: 14px;
      text-align: center;
      margin-top: 10px;
    }
    .footer {
      background-color: #fafaf9;
      padding: 24px 32px;
      border-top: 1px solid #f5f5f4;
      text-align: center;
      font-size: 12px;
      color: ${TEXT_MUTED};
      line-height: 1.6;
    }
    .footer a {
      color: #881337;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>💍 ShaadiRent</h1>
      <p>Luxury Designer Wedding Wear On Rent</p>
    </div>
    <div class="content">
      ${bodyContent}
    </div>
    <div class="footer">
      <p>Questions? Reach out at <a href="mailto:support@shaadirent.com">support@shaadirent.com</a> or WhatsApp us.</p>
      <p>Manage your notification settings anytime from your <a href="${siteUrl}/account">ShaadiRent Profile</a>.</p>
      <p>© ${new Date().getFullYear()} ShaadiRent Technologies Pvt. Ltd. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export function generateEmailContent(
  event: NotificationEvent,
  recipient: RecipientInfo,
  data: BookingNotificationData,
  siteUrl: string = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
): { subject: string; html: string; text: string } {
  const isOwner = recipient.role === "owner";
  const bookingLink = `${siteUrl}/bookings/${data.bookingId}`;

  switch (event) {
    case "booking_confirmed": {
      if (isOwner) {
        const subject = `🛍️ New Rental Order! ${data.outfitTitle} (${data.bookingNumber})`;
        const body = `
          <div style="text-align: center; margin-bottom: 20px;">
            <span class="badge" style="background:#ecfdf5; color:#047857;">New Booking Confirmed</span>
            <h2 style="margin: 12px 0 6px 0; color:#1c1917; font-size:20px;">You Have a New Booking!</h2>
            <p style="color:#78716c; font-size:14px; margin:0;">Hi ${recipient.name}, a customer has rented your outfit.</p>
          </div>

          <div class="card">
            <h3 style="margin-top:0; font-size:15px; color:#881337;">Rental Details</h3>
            <p style="margin:6px 0; font-size:14px;"><strong>Outfit:</strong> ${data.outfitTitle}</p>
            <p style="margin:6px 0; font-size:14px;"><strong>Booking Ref:</strong> <span style="font-family:monospace; font-weight:bold;">${data.bookingNumber}</span></p>
            <p style="margin:6px 0; font-size:14px;"><strong>Rental Period:</strong> ${formatDate(data.rentalStartDate)} – ${formatDate(data.rentalEndDate)}</p>
            <p style="margin:6px 0; font-size:14px;"><strong>Your Earnings (Estimated):</strong> ${formatINR(data.rentalAmount * 0.85)}</p>
          </div>

          <div style="background:#fffbeb; border:1px solid #fde68a; border-radius:10px; padding:14px; font-size:13px; color:#92400e;">
            <strong>Next Step:</strong> Please ensure the outfit is dry cleaned, pressed, and packed in its protective garment bag ready for courier pickup.
          </div>

          <div style="text-align:center; margin-top: 24px;">
            <a href="${siteUrl}/owner/bookings" class="btn">View in Owner Portal</a>
          </div>
        `;
        return {
          subject,
          html: emailWrapper(subject, body, siteUrl),
          text: `Hi ${recipient.name}, you have a new booking for ${data.outfitTitle} (#${data.bookingNumber}) for ${formatDate(data.rentalStartDate)} to ${formatDate(data.rentalEndDate)}. Manage your booking: ${siteUrl}/owner/bookings`,
        };
      } else {
        const subject = `🎉 Booking Confirmed! ${data.outfitTitle} (#${data.bookingNumber})`;
        const body = `
          <div style="text-align: center; margin-bottom: 20px;">
            <span class="badge" style="background:#ecfdf5; color:#047857;">Booking Confirmed & Paid</span>
            <h2 style="margin: 12px 0 6px 0; color:#1c1917; font-size:20px;">Your Wedding Wear Is Booked!</h2>
            <p style="color:#78716c; font-size:14px; margin:0;">Hi ${recipient.name}, your rental order has been secured.</p>
          </div>

          <div class="card">
            <h3 style="margin-top:0; font-size:15px; color:#881337;">Outfit & Rental Schedule</h3>
            <p style="margin:6px 0; font-size:14px;"><strong>Outfit:</strong> ${data.outfitTitle}</p>
            <p style="margin:6px 0; font-size:14px;"><strong>Booking ID:</strong> <span style="font-family:monospace; font-weight:bold;">${data.bookingNumber}</span></p>
            <p style="margin:6px 0; font-size:14px;"><strong>Rental Dates:</strong> ${formatDate(data.rentalStartDate)} to ${formatDate(data.rentalEndDate)}</p>
            ${data.eventDate ? `<p style="margin:6px 0; font-size:14px;"><strong>Event Date:</strong> ${formatDate(data.eventDate)}</p>` : ""}
            <hr style="border:none; border-top:1px dashed #e7e5e4; margin:14px 0;" />
            <h3 style="margin-top:0; font-size:15px; color:#881337;">Payment Summary</h3>
            <p style="margin:4px 0; font-size:13px; display:flex; justify-content:space-between;"><span>Rental Fee:</span> <strong>${formatINR(data.rentalAmount)}</strong></p>
            <p style="margin:4px 0; font-size:13px; display:flex; justify-content:space-between;"><span>Refundable Deposit:</span> <strong>${formatINR(data.securityDeposit)}</strong></p>
            <p style="margin:8px 0 0 0; font-size:15px; display:flex; justify-content:space-between; color:#881337;"><span>Total Paid:</span> <strong>${formatINR(data.totalAmount)}</strong></p>
          </div>

          ${
            data.deliveryAddress?.city
              ? `
            <div style="background:#f5f5f4; border-radius:10px; padding:14px; font-size:13px; color:#44403c;">
              <strong>Delivery Destination:</strong><br/>
              ${data.deliveryAddress.line1 || ""}, ${data.deliveryAddress.city}, ${data.deliveryAddress.state || ""} - ${data.deliveryAddress.pincode || ""}
            </div>
          `
              : ""
          }

          <div style="text-align:center; margin-top: 24px;">
            <a href="${bookingLink}" class="btn">View Order & Tracking</a>
          </div>
        `;
        return {
          subject,
          html: emailWrapper(subject, body, siteUrl),
          text: `Hi ${recipient.name}, your booking #${data.bookingNumber} for ${data.outfitTitle} is confirmed! Dates: ${formatDate(data.rentalStartDate)} to ${formatDate(data.rentalEndDate)}. View details: ${bookingLink}`,
        };
      }
    }

    case "out_for_delivery": {
      const subject = `🚚 Out For Delivery! Your outfit is on its way (#${data.bookingNumber})`;
      const body = `
        <div style="text-align: center; margin-bottom: 20px;">
          <span class="badge" style="background:#eff6ff; color:#1d4ed8;">Dispatched & In Transit</span>
          <h2 style="margin: 12px 0 6px 0; color:#1c1917; font-size:20px;">Your Outfit Is On Its Way!</h2>
          <p style="color:#78716c; font-size:14px; margin:0;">Hi ${recipient.name}, our courier partner is en route to deliver your rental.</p>
        </div>

        <div class="card">
          <p style="margin:6px 0; font-size:14px;"><strong>Outfit:</strong> ${data.outfitTitle}</p>
          <p style="margin:6px 0; font-size:14px;"><strong>Booking Number:</strong> ${data.bookingNumber}</p>
          ${data.trackingNumber ? `<p style="margin:6px 0; font-size:14px;"><strong>Courier AWB / Tracking:</strong> <span style="font-family:monospace; font-weight:bold; color:#1d4ed8;">${data.trackingNumber}</span></p>` : ""}
          <p style="margin:6px 0; font-size:14px;"><strong>Delivery Window:</strong> Scheduled for today</p>
        </div>

        <div style="background:#fff7ed; border:1px solid #ffedd5; border-radius:10px; padding:14px; font-size:13px; color:#c2410c;">
          <strong>Tip on Receipt:</strong> Please inspect the garment upon delivery and check the fit. If you notice any transit wrinkles, use a mild steamer only. Keep the original garment cover safe for return pickup!
        </div>

        <div style="text-align:center; margin-top: 24px;">
          <a href="${bookingLink}" class="btn">Track Order Live</a>
        </div>
      `;
      return {
        subject,
        html: emailWrapper(subject, body, siteUrl),
        text: `Hi ${recipient.name}, your outfit ${data.outfitTitle} (#${data.bookingNumber}) is out for delivery! Track order: ${bookingLink}`,
      };
    }

    case "delivered": {
      const subject = `✨ Outfit Delivered! Have a magical celebration (#${data.bookingNumber})`;
      const body = `
        <div style="text-align: center; margin-bottom: 20px;">
          <span class="badge" style="background:#f0fdf4; color:#15803d;">Delivered Successfully</span>
          <h2 style="margin: 12px 0 6px 0; color:#1c1917; font-size:20px;">Outfit Delivered!</h2>
          <p style="color:#78716c; font-size:14px; margin:0;">Hi ${recipient.name}, your rental period is now officially active.</p>
        </div>

        <div class="card">
          <p style="margin:6px 0; font-size:14px;"><strong>Outfit:</strong> ${data.outfitTitle}</p>
          <p style="margin:6px 0; font-size:14px;"><strong>Return Scheduled For:</strong> ${formatDate(data.rentalEndDate)}</p>
        </div>

        <p style="font-size:14px; line-height:1.6; color:#44403c;">
          We hope you feel breathtaking at your wedding celebration! Remember, minor accidental food spills and seam stretching are covered under our ShaadiCare protection plan.
        </p>

        <div style="text-align:center; margin-top: 24px;">
          <a href="${bookingLink}" class="btn">View Care Instructions</a>
        </div>
      `;
      return {
        subject,
        html: emailWrapper(subject, body, siteUrl),
        text: `Hi ${recipient.name}, your outfit ${data.outfitTitle} (#${data.bookingNumber}) has been delivered! Your return is scheduled for ${formatDate(data.rentalEndDate)}. Enjoy your celebration!`,
      };
    }

    case "return_reminder": {
      const subject = `⏰ Return Reminder: Outfit pickup scheduled for tomorrow (#${data.bookingNumber})`;
      const body = `
        <div style="text-align: center; margin-bottom: 20px;">
          <span class="badge" style="background:#fffbeb; color:#b45309;">Return Pickup Tomorrow</span>
          <h2 style="margin: 12px 0 6px 0; color:#1c1917; font-size:20px;">Return Pickup Reminder</h2>
          <p style="color:#78716c; font-size:14px; margin:0;">Hi ${recipient.name}, we hope you had an unforgettable wedding celebration!</p>
        </div>

        <div class="card">
          <p style="margin:6px 0; font-size:14px;"><strong>Outfit:</strong> ${data.outfitTitle}</p>
          <p style="margin:6px 0; font-size:14px;"><strong>Scheduled Pickup Date:</strong> ${formatDate(data.rentalEndDate)}</p>
          <p style="margin:6px 0; font-size:14px;"><strong>Security Deposit In Escrow:</strong> ${formatINR(data.securityDeposit)}</p>
        </div>

        <div style="background:#f0fdf4; border:1px solid #dcfce7; border-radius:10px; padding:14px; font-size:13px; color:#166534;">
          <strong>Quick Packing Checklist:</strong>
          <ul style="margin:6px 0 0 0; padding-left:20px;">
            <li>Place outfit back inside the ShaadiRent garment bag</li>
            <li>Include any accessories, dupattas, or extra buttons</li>
            <li>No need to dry clean — our team handles premium sanitization!</li>
          </ul>
        </div>

        <div style="text-align:center; margin-top: 24px;">
          <a href="${bookingLink}" class="btn">View Return Details</a>
        </div>
      `;
      return {
        subject,
        html: emailWrapper(subject, body, siteUrl),
        text: `Hi ${recipient.name}, return pickup for ${data.outfitTitle} (#${data.bookingNumber}) is scheduled for tomorrow (${formatDate(data.rentalEndDate)}). Please pack the outfit in the garment bag.`,
      };
    }

    case "returned_inspection": {
      const subject = `🔍 Outfit Received: Return inspection underway (#${data.bookingNumber})`;
      const body = `
        <div style="text-align: center; margin-bottom: 20px;">
          <span class="badge" style="background:#faf5ff; color:#7e22ce;">Return Received</span>
          <h2 style="margin: 12px 0 6px 0; color:#1c1917; font-size:20px;">Outfit Received Safely</h2>
          <p style="color:#78716c; font-size:14px; margin:0;">Hi ${recipient.name}, your returned outfit has reached our hub.</p>
        </div>

        <div class="card">
          <p style="margin:6px 0; font-size:14px;"><strong>Outfit:</strong> ${data.outfitTitle}</p>
          <p style="margin:6px 0; font-size:14px;"><strong>Status:</strong> Quality & condition inspection in progress</p>
          <p style="margin:6px 0; font-size:14px;"><strong>Security Deposit:</strong> ${formatINR(data.securityDeposit)} will be refunded immediately once verified</p>
        </div>

        <div style="text-align:center; margin-top: 24px;">
          <a href="${bookingLink}" class="btn">Check Booking Status</a>
        </div>
      `;
      return {
        subject,
        html: emailWrapper(subject, body, siteUrl),
        text: `Hi ${recipient.name}, your outfit ${data.outfitTitle} (#${data.bookingNumber}) has been received back at our hub. Post-rental inspection is now underway.`,
      };
    }

    case "completed_refund": {
      const refundFormatted = formatINR(data.refundAmount ?? data.securityDeposit);
      const subject = `💚 Deposit Refunded & Booking Completed (#${data.bookingNumber})`;
      const body = `
        <div style="text-align: center; margin-bottom: 20px;">
          <span class="badge" style="background:#ecfdf5; color:#047857;">Inspection Passed & Refund Processed</span>
          <h2 style="margin: 12px 0 6px 0; color:#1c1917; font-size:20px;">Security Deposit Refunded!</h2>
          <p style="color:#78716c; font-size:14px; margin:0;">Hi ${recipient.name}, your rental inspection passed with flying colours.</p>
        </div>

        <div class="card">
          <p style="margin:6px 0; font-size:14px;"><strong>Outfit:</strong> ${data.outfitTitle}</p>
          <p style="margin:6px 0; font-size:14px;"><strong>Refund Amount:</strong> <strong style="color:#047857; font-size:16px;">${refundFormatted}</strong></p>
          <p style="margin:6px 0; font-size:14px;"><strong>Method:</strong> Credited to original payment source via Cashfree</p>
        </div>

        <div style="text-align:center; margin: 26px 0 10px 0;">
          <p style="font-size:14px; color:#44403c;">How was your experience wearing ${data.outfitTitle}? Share your review to help fellow brides and grooms:</p>
          <a href="${bookingLink}" class="btn" style="background:#d97706;">⭐ Leave a Review & Photo</a>
        </div>
      `;
      return {
        subject,
        html: emailWrapper(subject, body, siteUrl),
        text: `Hi ${recipient.name}, your deposit refund of ${refundFormatted} for booking #${data.bookingNumber} has been initiated! Leave a review: ${bookingLink}`,
      };
    }

    case "booking_cancelled": {
      const subject = `❌ Booking Cancelled (#${data.bookingNumber})`;
      const body = `
        <div style="text-align: center; margin-bottom: 20px;">
          <span class="badge" style="background:#fef2f2; color:#b91c1c;">Booking Cancelled</span>
          <h2 style="margin: 12px 0 6px 0; color:#1c1917; font-size:20px;">Booking Has Been Cancelled</h2>
          <p style="color:#78716c; font-size:14px; margin:0;">Hi ${recipient.name}, your booking for ${data.outfitTitle} has been cancelled.</p>
        </div>

        <div class="card">
          <p style="margin:6px 0; font-size:14px;"><strong>Booking Reference:</strong> ${data.bookingNumber}</p>
          ${data.cancellationReason ? `<p style="margin:6px 0; font-size:14px;"><strong>Reason:</strong> ${data.cancellationReason}</p>` : ""}
        </div>

        <div style="text-align:center; margin-top: 24px;">
          <a href="${siteUrl}/browse" class="btn">Explore Other Outfits</a>
        </div>
      `;
      return {
        subject,
        html: emailWrapper(subject, body, siteUrl),
        text: `Hi ${recipient.name}, your booking #${data.bookingNumber} for ${data.outfitTitle} has been cancelled. Explore outfits: ${siteUrl}/browse`,
      };
    }

    case "dispute_alert": {
      const subject = `⚠️ Dispute Notification (#${data.bookingNumber})`;
      const body = `
        <div style="text-align: center; margin-bottom: 20px;">
          <span class="badge" style="background:#fff1f2; color:#e11d48;">Dispute Notice</span>
          <h2 style="margin: 12px 0 6px 0; color:#1c1917; font-size:20px;">Dispute Claim Received</h2>
          <p style="color:#78716c; font-size:14px; margin:0;">Hi ${recipient.name}, an issue was flagged regarding booking #${data.bookingNumber}.</p>
        </div>

        <div class="card">
          <p style="margin:6px 0; font-size:14px;"><strong>Outfit:</strong> ${data.outfitTitle}</p>
          ${data.disputeReason ? `<p style="margin:6px 0; font-size:14px;"><strong>Details:</strong> ${data.disputeReason}</p>` : ""}
          <p style="margin:6px 0; font-size:13px; color:#78716c;">Our concierge team reviews disputes within 24 hours to ensure fair resolution for both parties.</p>
        </div>

        <div style="text-align:center; margin-top: 24px;">
          <a href="${bookingLink}" class="btn">View Dispute Status</a>
        </div>
      `;
      return {
        subject,
        html: emailWrapper(subject, body, siteUrl),
        text: `Hi ${recipient.name}, a dispute has been opened for booking #${data.bookingNumber} (${data.outfitTitle}). Our team is reviewing it: ${bookingLink}`,
      };
    }

    case "test_notification":
    default: {
      const subject = `🔔 Test Notification from ShaadiRent`;
      const body = `
        <div style="text-align: center; margin-bottom: 20px;">
          <span class="badge" style="background:#f3e8ff; color:#7e22ce;">Integration Test</span>
          <h2 style="margin: 12px 0 6px 0; color:#1c1917; font-size:20px;">Your Notifications Are Working!</h2>
          <p style="color:#78716c; font-size:14px; margin:0;">Hi ${recipient.name}, this is a test notification confirming your email channel is connected.</p>
        </div>

        <div class="card">
          <p style="margin:6px 0; font-size:14px;"><strong>Recipient:</strong> ${recipient.email || recipient.name}</p>
          <p style="margin:6px 0; font-size:14px;"><strong>Channel:</strong> Transactional Email (Resend)</p>
          <p style="margin:6px 0; font-size:14px;"><strong>Timestamp:</strong> ${new Date().toLocaleString("en-IN")}</p>
        </div>

        <div style="text-align:center; margin-top: 24px;">
          <a href="${siteUrl}/account" class="btn">Manage Preferences</a>
        </div>
      `;
      return {
        subject,
        html: emailWrapper(subject, body, siteUrl),
        text: `Hi ${recipient.name}, your ShaadiRent transactional email notification channel is working perfectly!`,
      };
    }
  }
}
