import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "List Your Outfit — ShaadiRent",
  description: "Start listing your wedding outfit for rent on ShaadiRent.",
};

/**
 * /list-your-outfit landing page
 *
 * Immediately redirects authenticated users into the first step.
 * The layout already ensures the user is authenticated before reaching here.
 */
export default function ListYourOutfitPage() {
  redirect("/list-your-outfit/details");
}
