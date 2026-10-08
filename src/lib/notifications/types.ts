export type NotificationChannel = "email" | "sms" | "whatsapp";

export type NotificationEvent =
  | "booking_confirmed"
  | "out_for_delivery"
  | "delivered"
  | "return_reminder"
  | "returned_inspection"
  | "completed_refund"
  | "booking_cancelled"
  | "dispute_alert"
  | "promotional_offer"
  | "test_notification";

export interface RecipientInfo {
  userId: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: "renter" | "owner" | "admin";
  notificationPrefs?: {
    email_bookings?: boolean;
    sms_alerts?: boolean;
    whatsapp_updates?: boolean;
    promotions?: boolean;
  } | null;
}

export interface BookingNotificationData {
  bookingId?: string | null;
  bookingNumber?: string;
  outfitId?: string;
  outfitTitle: string;
  outfitImage?: string | null;
  outfitSlug?: string;
  rentalStartDate: string;
  rentalEndDate: string;
  eventDate?: string | null;
  totalAmount: number;
  rentalAmount: number;
  securityDeposit: number;
  paymentMethod?: string;
  paymentStatus?: string;
  deliveryAddress?: {
    line1?: string;
    city?: string;
    state?: string;
    pincode?: string;
    phone?: string;
  } | null;
  trackingNumber?: string | null;
  refundAmount?: number | null;
  cancellationReason?: string | null;
  disputeReason?: string | null;
  notes?: string | null;
}

export interface ChannelDeliveryStatus {
  status: "sent" | "simulated" | "skipped" | "failed";
  provider?: "resend" | "whatsapp_free" | "system";
  messageId?: string;
  error?: string;
  sentAt?: string;
  recipient?: string;
}

export type DeliveryReport = Partial<Record<NotificationChannel, ChannelDeliveryStatus>>;

export interface NotificationRecord {
  id: string;
  user_id: string;
  booking_id?: string | null;
  event: NotificationEvent;
  title: string;
  message: string;
  channels: NotificationChannel[];
  delivery_status: DeliveryReport;
  metadata?: Record<string, unknown>;
  read_at?: string | null;
  created_at: string;
}
