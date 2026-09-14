"use client";

import { useState } from "react";
import { User, Mail, Phone, Calendar, AlertCircle, ArrowRight } from "lucide-react";
import type { ApplicationFormData } from "@/app/(public)/become-an-owner/actions";

interface Step1Props {
  data: Partial<ApplicationFormData>;
  userEmail: string;
  onUpdate: (fields: Partial<ApplicationFormData>) => void;
  onNext: () => void;
}

export function Step1Personal({ data, userEmail, onUpdate, onNext }: Step1Props) {
  const [fullName, setFullName] = useState(data.full_name || "");
  const [phone, setPhone] = useState(data.phone || "");
  const [altPhone, setAltPhone] = useState(data.alt_phone || "");
  const [dob, setDob] = useState(data.dob || "");
  const [gender, setGender] = useState<ApplicationFormData["gender"]>(
    data.gender || "female"
  );
  const [bio, setBio] = useState(data.bio || "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const errs: Record<string, string> = {};

    if (!fullName.trim()) {
      errs.fullName = "Full name is required as per official ID.";
    }

    const cleanPhone = phone.replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length !== 10) {
      errs.phone = "Please enter a valid 10-digit mobile number.";
    }

    if (!dob) {
      errs.dob = "Date of birth is required.";
    } else {
      const birthDate = new Date(dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      if (age < 18) {
        errs.dob = "You must be at least 18 years old to register as an owner.";
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleContinue(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    onUpdate({
      full_name: fullName.trim(),
      email: userEmail,
      phone: phone.replace(/\D/g, ""),
      alt_phone: altPhone.trim() || undefined,
      dob,
      gender,
      bio: bio.trim() || undefined,
    });
    onNext();
  }

  return (
    <form onSubmit={handleContinue} className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-stone-900 sm:text-3xl">
          Personal Information
        </h2>
        <p className="mt-1 text-sm text-stone-500">
          Enter your legal personal details as they appear on your government-issued ID card.
        </p>
      </div>

      <div className="space-y-4 pt-2">
        {/* Full Name */}
        <div>
          <label className="block text-sm font-semibold text-stone-700 mb-1.5">
            Full Legal Name <span className="text-rose-600">*</span>
          </label>
          <div className="relative">
            <User
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
            />
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: "" }));
              }}
              placeholder="e.g. Priya Sharma"
              className={`w-full rounded-xl border pl-10 pr-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-800/20 transition-all ${
                errors.fullName ? "border-rose-400 bg-rose-50/20" : "border-stone-200"
              }`}
            />
          </div>
          {errors.fullName && (
            <p className="mt-1.5 flex items-center gap-1 text-xs text-rose-600">
              <AlertCircle size={13} /> {errors.fullName}
            </p>
          )}
        </div>

        {/* Email Address (Pre-filled / Read-only) */}
        <div>
          <label className="block text-sm font-semibold text-stone-700 mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <Mail
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
            />
            <input
              type="email"
              disabled
              value={userEmail}
              className="w-full rounded-xl border border-stone-200 bg-stone-100/70 pl-10 pr-4 py-3 text-sm text-stone-600 cursor-not-allowed"
            />
          </div>
          <p className="mt-1 text-[11px] text-stone-400">
            Linked to your verified Google account.
          </p>
        </div>

        {/* Primary Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">
              Mobile Number <span className="text-rose-600">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-stone-500">
                +91
              </span>
              <input
                type="tel"
                maxLength={10}
                required
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value.replace(/\D/g, ""));
                  if (errors.phone) setErrors((prev) => ({ ...prev, phone: "" }));
                }}
                placeholder="9876543210"
                className={`w-full rounded-xl border pl-12 pr-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-800/20 transition-all ${
                  errors.phone ? "border-rose-400 bg-rose-50/20" : "border-stone-200"
                }`}
              />
            </div>
            {errors.phone && (
              <p className="mt-1.5 flex items-center gap-1 text-xs text-rose-600">
                <AlertCircle size={13} /> {errors.phone}
              </p>
            )}
            <p className="mt-1 text-[11px] text-stone-400">
              We will verify this number via SMS OTP in Step 2.
            </p>
          </div>

          {/* Alternate Phone */}
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">
              Alternate Phone <span className="text-xs font-normal text-stone-400">(Optional)</span>
            </label>
            <div className="relative">
              <Phone
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
              />
              <input
                type="tel"
                maxLength={10}
                value={altPhone}
                onChange={(e) => setAltPhone(e.target.value.replace(/\D/g, ""))}
                placeholder="Optional backup number"
                className="w-full rounded-xl border border-stone-200 pl-10 pr-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-800/20"
              />
            </div>
          </div>
        </div>

        {/* Date of Birth & Gender */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">
              Date of Birth <span className="text-rose-600">*</span>
            </label>
            <div className="relative">
              <Calendar
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
              />
              <input
                type="date"
                required
                max={new Date().toISOString().split("T")[0]}
                value={dob}
                onChange={(e) => {
                  setDob(e.target.value);
                  if (errors.dob) setErrors((prev) => ({ ...prev, dob: "" }));
                }}
                className={`w-full rounded-xl border pl-10 pr-4 py-3 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-800/20 transition-all ${
                  errors.dob ? "border-rose-400 bg-rose-50/20" : "border-stone-200"
                }`}
              />
            </div>
            {errors.dob && (
              <p className="mt-1.5 flex items-center gap-1 text-xs text-rose-600">
                <AlertCircle size={13} /> {errors.dob}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">
              Gender <span className="text-rose-600">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "female", label: "Female" },
                { id: "male", label: "Male" },
                { id: "other", label: "Other" },
                { id: "prefer_not_to_say", label: "Prefer not to say" },
              ].map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setGender(item.id as ApplicationFormData["gender"])}
                  className={`rounded-xl border py-2.5 px-3 text-xs font-semibold transition-all ${
                    gender === item.id
                      ? "border-rose-800 bg-rose-50 text-rose-900 shadow-sm"
                      : "border-stone-200 bg-white text-stone-600 hover:border-stone-300"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bio / Wardrobe Story */}
        <div>
          <label className="block text-sm font-semibold text-stone-700 mb-1.5">
            About Your Collection <span className="text-xs font-normal text-stone-400">(Optional)</span>
          </label>
          <textarea
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell us briefly about the bridal lehengas, sherwanis, or designer wear you plan to list..."
            className="w-full rounded-xl border border-stone-200 p-3.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-800/20 resize-none"
          />
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-stone-100">
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-800 to-rose-900 px-6 py-3.5 text-sm font-semibold text-white shadow-md shadow-rose-950/20 hover:from-rose-900 hover:to-stone-950 hover:shadow-lg transition-all"
        >
          <span>Continue to OTP Verification</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </form>
  );
}
