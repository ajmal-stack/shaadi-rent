"use client";

import { useState } from "react";
import { MapPin, Building, AlertCircle, ArrowRight, ArrowLeft } from "lucide-react";
import { INDIAN_STATES } from "./constants";
import type { ApplicationFormData } from "@/app/(public)/become-an-owner/actions";

interface Step4Props {
  data: Partial<ApplicationFormData>;
  onUpdate: (fields: Partial<ApplicationFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function Step4Address({ data, onUpdate, onNext, onBack }: Step4Props) {
  const [line1, setLine1] = useState(data.address_line1 || "");
  const [line2, setLine2] = useState(data.address_line2 || "");
  const [city, setCity] = useState(data.city || "");
  const [district, setDistrict] = useState(data.district || "");
  const [state, setState] = useState(data.state || "Delhi");
  const [pincode, setPincode] = useState(data.pincode || "");
  const [landmark, setLandmark] = useState(data.landmark || "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const errs: Record<string, string> = {};

    if (!line1.trim()) errs.line1 = "Address Line 1 is required.";
    if (!city.trim()) errs.city = "City / Town is required.";
    if (!district.trim()) errs.district = "District is required.";
    if (!state.trim()) errs.state = "State is required.";

    const cleanPin = pincode.replace(/\D/g, "");
    if (!cleanPin || cleanPin.length !== 6) {
      errs.pincode = "Please enter a valid 6-digit postal pincode.";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleContinue(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    onUpdate({
      address_line1: line1.trim(),
      address_line2: line2.trim() || undefined,
      city: city.trim(),
      district: district.trim(),
      state,
      pincode: pincode.replace(/\D/g, ""),
      landmark: landmark.trim() || undefined,
    });
    onNext();
  }

  return (
    <form onSubmit={handleContinue} className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-stone-900 sm:text-3xl">
          Residential & Pickup Address
        </h2>
        <p className="mt-1 text-sm text-stone-500">
          This address is used for coordinating outfit pickups, dry-cleaning dispatches, and verified owner logistics.
        </p>
      </div>

      <div className="space-y-4 pt-2">
        {/* Address Line 1 */}
        <div>
          <label className="block text-sm font-semibold text-stone-700 mb-1.5">
            Flat, House No., Building, Apartment <span className="text-rose-600">*</span>
          </label>
          <div className="relative">
            <Building
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
            />
            <input
              type="text"
              required
              value={line1}
              onChange={(e) => {
                setLine1(e.target.value);
                if (errors.line1) setErrors((prev) => ({ ...prev, line1: "" }));
              }}
              placeholder="e.g. Flat 402, Lotus Tower, 14th Main"
              className={`w-full rounded-xl border pl-10 pr-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-800/20 transition-all ${
                errors.line1 ? "border-rose-400 bg-rose-50/20" : "border-stone-200"
              }`}
            />
          </div>
          {errors.line1 && (
            <p className="mt-1.5 flex items-center gap-1 text-xs text-rose-600">
              <AlertCircle size={13} /> {errors.line1}
            </p>
          )}
        </div>

        {/* Address Line 2 */}
        <div>
          <label className="block text-sm font-semibold text-stone-700 mb-1.5">
            Area, Street, Sector, Village <span className="text-xs font-normal text-stone-400">(Optional)</span>
          </label>
          <input
            type="text"
            value={line2}
            onChange={(e) => setLine2(e.target.value)}
            placeholder="e.g. Indiranagar, 100 Feet Road"
            className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-800/20"
          />
        </div>

        {/* City & District */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">
              City / Town <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              required
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
                if (errors.city) setErrors((prev) => ({ ...prev, city: "" }));
              }}
              placeholder="e.g. Bangalore"
              className={`w-full rounded-xl border px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-800/20 transition-all ${
                errors.city ? "border-rose-400 bg-rose-50/20" : "border-stone-200"
              }`}
            />
            {errors.city && (
              <p className="mt-1.5 flex items-center gap-1 text-xs text-rose-600">
                <AlertCircle size={13} /> {errors.city}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">
              District <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              required
              value={district}
              onChange={(e) => {
                setDistrict(e.target.value);
                if (errors.district) setErrors((prev) => ({ ...prev, district: "" }));
              }}
              placeholder="e.g. Bangalore Urban"
              className={`w-full rounded-xl border px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-800/20 transition-all ${
                errors.district ? "border-rose-400 bg-rose-50/20" : "border-stone-200"
              }`}
            />
            {errors.district && (
              <p className="mt-1.5 flex items-center gap-1 text-xs text-rose-600">
                <AlertCircle size={13} /> {errors.district}
              </p>
            )}
          </div>
        </div>

        {/* State & Pincode */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">
              State / Union Territory <span className="text-rose-600">*</span>
            </label>
            <select
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-3 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-800/20"
            >
              {INDIAN_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">
              Pincode <span className="text-rose-600">*</span>
            </label>
            <div className="relative">
              <MapPin
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
              />
              <input
                type="text"
                maxLength={6}
                required
                value={pincode}
                onChange={(e) => {
                  setPincode(e.target.value.replace(/\D/g, ""));
                  if (errors.pincode) setErrors((prev) => ({ ...prev, pincode: "" }));
                }}
                placeholder="560038"
                className={`w-full rounded-xl border pl-10 pr-4 py-3 text-sm font-mono text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-800/20 transition-all ${
                  errors.pincode ? "border-rose-400 bg-rose-50/20" : "border-stone-200"
                }`}
              />
            </div>
            {errors.pincode && (
              <p className="mt-1.5 flex items-center gap-1 text-xs text-rose-600">
                <AlertCircle size={13} /> {errors.pincode}
              </p>
            )}
          </div>
        </div>

        {/* Landmark */}
        <div>
          <label className="block text-sm font-semibold text-stone-700 mb-1.5">
            Nearby Landmark <span className="text-xs font-normal text-stone-400">(Optional)</span>
          </label>
          <input
            type="text"
            value={landmark}
            onChange={(e) => setLandmark(e.target.value)}
            placeholder="e.g. Near Metro Station / Behind City Hospital"
            className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-800/20"
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-stone-100">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 px-5 py-3 text-sm font-semibold text-stone-700 hover:bg-stone-50 transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>

        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-800 to-rose-900 px-6 py-3.5 text-sm font-semibold text-white shadow-md shadow-rose-950/20 hover:from-rose-900 hover:to-stone-950 hover:shadow-lg transition-all"
        >
          <span>Continue to Declaration</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </form>
  );
}
