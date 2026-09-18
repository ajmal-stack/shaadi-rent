"use client";

import {
  Clock,
  Users,
  Shirt,
  CalendarCheck,
  CreditCard,
  UserPlus,
} from "lucide-react";
import { StatCard } from "./StatCard";
import { DonutChart } from "./DonutChart";
import { BarChart } from "./BarChart";
import { MiniLineChart } from "./MiniLineChart";
import { RecentBookingsFeed, type RecentBooking } from "./RecentBookingsFeed";

interface DashboardChartsProps {
  // KPI data
  pendingApplicationsCount: number;
  totalOwnersCount: number;
  totalOutfitsCount: number;
  totalBookingsCount: number;
  totalRevenue: number;
  newUsersThisMonth: number;

  // Sparklines
  bookingsByDay: number[]; // last 30 days
  bookingLabels: string[];
  revenueByDay: { label: string; value: number }[]; // last 14 days

  // Donut
  bookingStatusBreakdown: { label: string; value: number; color: string }[];

  // Feed
  recentBookings: RecentBooking[];

  // Trends
  bookingsTrend: number | null;
  revenueTrend: number | null;
}

function formatINR(v: number) {
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
  if (v >= 1000) return `₹${(v / 1000).toFixed(1)}K`;
  return `₹${v}`;
}

export function DashboardCharts({
  pendingApplicationsCount,
  totalOwnersCount,
  totalOutfitsCount,
  totalBookingsCount,
  totalRevenue,
  newUsersThisMonth,
  bookingsByDay,
  bookingLabels,
  revenueByDay,
  bookingStatusBreakdown,
  recentBookings,
  bookingsTrend,
  revenueTrend,
}: DashboardChartsProps) {
  return (
    <div className="space-y-6">
      {/* ── KPI Cards ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Pending Review"
          value={pendingApplicationsCount}
          icon={Clock}
          iconColor="#92400e"
          iconBg="#fef3c7"
          borderColor="#fde68a"
          sparklineColor="#d97706"
          trendLabel="Owner applications"
        />
        <StatCard
          title="Verified Owners"
          value={totalOwnersCount}
          icon={Users}
          iconColor="#1e40af"
          iconBg="#eff6ff"
          borderColor="#dbeafe"
          trendLabel="Active sellers"
        />
        <StatCard
          title="Total Outfits"
          value={totalOutfitsCount}
          icon={Shirt}
          iconColor="#065f46"
          iconBg="#ecfdf5"
          borderColor="#a7f3d0"
          trendLabel="In catalog"
        />
        <StatCard
          title="Total Bookings"
          value={totalBookingsCount}
          icon={CalendarCheck}
          iconColor="#be123c"
          iconBg="#fff1f2"
          borderColor="#fecdd3"
          sparklineData={bookingsByDay}
          sparklineColor="#be123c"
          trend={bookingsTrend}
          trendLabel="vs last month"
        />
        <StatCard
          title="Platform Revenue"
          value={`₹${totalRevenue}`}
          icon={CreditCard}
          iconColor="#7c3aed"
          iconBg="#f5f3ff"
          borderColor="#ddd6fe"
          sparklineData={revenueByDay.map((d) => d.value)}
          sparklineColor="#7c3aed"
          trend={revenueTrend}
          trendLabel="vs last month"
        />
        <StatCard
          title="New Users"
          value={newUsersThisMonth}
          icon={UserPlus}
          iconColor="#0e7490"
          iconBg="#ecfeff"
          borderColor="#a5f3fc"
          trendLabel="This month"
        />
      </div>

      {/* ── Charts Row ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Bookings trend chart */}
        <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 shadow-sm">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-stone-800 dark:text-stone-200">Bookings — Last 30 Days</h3>
            <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">Daily new bookings</p>
          </div>
          <MiniLineChart
            data={bookingsByDay}
            labels={bookingLabels}
            color="#be123c"
            height={110}
            width={500}
          />
        </div>

        {/* Revenue bar chart */}
        <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 shadow-sm">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-stone-800 dark:text-stone-200">Revenue — Last 14 Days</h3>
            <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">Daily confirmed payments (₹)</p>
          </div>
          <BarChart
            data={revenueByDay}
            color="#7c3aed"
            height={130}
            formatValue={formatINR}
          />
        </div>
      </div>

      {/* ── Bottom Row: Donut + Recent Bookings ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Booking status donut */}
        <div className="lg:col-span-2 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 shadow-sm">
          <div className="mb-5">
            <h3 className="text-sm font-bold text-stone-800 dark:text-stone-200">Booking Status</h3>
            <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">All-time breakdown</p>
          </div>
          <DonutChart segments={bookingStatusBreakdown} size={148} thickness={24} />
        </div>

        {/* Recent Bookings */}
        <div className="lg:col-span-3 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-stone-800 dark:text-stone-200">Recent Bookings</h3>
              <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">Latest rental transactions</p>
            </div>
            <a
              href="/admin/bookings"
              className="text-xs font-semibold text-rose-800 dark:text-rose-400 hover:text-rose-950 dark:hover:text-rose-300"
            >
              View all →
            </a>
          </div>
          <RecentBookingsFeed bookings={recentBookings} />
        </div>
      </div>

    </div>
  );
}
