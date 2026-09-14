import type { Metadata } from "next";
import { WizardShell } from "@/components/listing/WizardShell";
import { PhotoUploader } from "@/components/listing/PhotoUploader";

export const metadata: Metadata = {
  title: "Step 3: Photos — List Your Outfit | ShaadiRent",
  description: "Upload beautiful photos of your wedding outfit.",
};

export default function PhotosPage() {
  return (
    <WizardShell
      currentStep={3}
      title="Outfit Photos"
      subtitle="Beautiful photos dramatically increase bookings. Upload up to 10 photos — at least one is required. Tap a photo to set it as primary."
    >
      <PhotoUploader />
    </WizardShell>
  );
}
