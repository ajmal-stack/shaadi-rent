"use client";

import { OrderTrackingStepper } from "./OrderTrackingStepper";
import type { BookingStatus } from "@/types/database";

interface BookingTimelineProps {
  currentStatus: BookingStatus;
  deliveryDate: string;
  returnDate: string;
  eventDate?: string | null;
  securityDeposit?: number;
  bookingNumber?: string;
}

export function BookingTimeline({
  currentStatus,
  deliveryDate,
  returnDate,
  eventDate,
  securityDeposit = 0,
  bookingNumber,
}: BookingTimelineProps) {
  return (
    <OrderTrackingStepper
      currentStatus={currentStatus}
      deliveryDate={deliveryDate}
      returnDate={returnDate}
      eventDate={eventDate}
      securityDeposit={securityDeposit}
      bookingNumber={bookingNumber}
    />
  );
}
