'use client'

import React from 'react';
import { AnalyticsData } from './analyticsUtils';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * WelcomeBanner component props
 * Extracted from: FullDashboard_backup.tsx lines 369-405
 */
export interface WelcomeBannerProps {
  /** Analytics data for displaying KPI metrics */
  analyticsData: AnalyticsData;
  /** Optional CSS class name */
  className?: string;
}

// ============================================================================
// COMPONENT IMPLEMENTATION
// ============================================================================

/**
 * WelcomeBanner Component
 *
 * PURPOSE: Renders a gradient welcome banner with KPI cards
 * EXTRACTED FROM: FullDashboard_backup.tsx lines 369-405
 * MOBILE-FIRST: Responsive 2x3 grid on mobile, 5-column on desktop
 * FEATURES:
 * - Gradient background with decorative circles
 * - Hebrew greeting and analytics overview
 * - 5 KPI cards: Total leads, Pending, Meetings, Closed, Revenue
 * - Hebrew currency formatting
 * - Percentage calculations for metrics
 *
 * @param props WelcomeBannerProps
 * @returns JSX.Element
 */
export default function WelcomeBanner({
  analyticsData,
  className = ""
}: WelcomeBannerProps) {

  // ============================================================================
  // DESTRUCTURE ANALYTICS DATA
  // ============================================================================

  const {
    totalLeads,
    pendingAssignment,
    matchedLeads,
    closedLeads,
    totalRevenue,
    analyticsLeads
  } = analyticsData;

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className={`bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden ${className}`}>
      {/* Decorative Background Circles */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

      {/* Welcome Text */}
      <div className="relative z-10">
        <h2 className="text-3xl font-bold mb-2">בוקר טוב! 👋</h2>
        <p className="text-blue-100 text-lg">הנה סיכום הפעילות שלך</p>
      </div>

      {/* KPI Cards Grid - Mobile: Compact 2x3 grid, Desktop: 5 column layout */}
      <div className="relative z-10 mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-4">

        {/* Total Leads Card */}
        <div className="bg-white/20 backdrop-blur-sm rounded-xl md:rounded-2xl px-3 py-3 md:px-6 md:py-4 flex flex-col justify-center">
          <p className="text-blue-100 text-xs md:text-sm">סה״כ לידים</p>
          <p className="text-xl md:text-3xl lg:text-4xl font-bold leading-tight">{totalLeads}</p>
          <p className="text-blue-200 text-xs hidden md:block">כל הלידים במערכת</p>
        </div>

        {/* Pending Assignment Card */}
        <div className="bg-white/20 backdrop-blur-sm rounded-xl md:rounded-2xl px-3 py-3 md:px-6 md:py-4 flex flex-col justify-center">
          <p className="text-blue-100 text-xs md:text-sm">ממתינים</p>
          <p className="text-xl md:text-3xl lg:text-4xl font-bold leading-tight">{pendingAssignment}</p>
          <p className="text-blue-200 text-xs">{totalLeads > 0 ? `${((pendingAssignment/totalLeads)*100).toFixed(0)}%` : '0%'}</p>
        </div>

        {/* Meetings Card */}
        <div className="bg-white/20 backdrop-blur-sm rounded-xl md:rounded-2xl px-3 py-3 md:px-6 md:py-4 flex flex-col justify-center">
          <p className="text-blue-100 text-xs md:text-sm">פגישות</p>
          <p className="text-xl md:text-3xl lg:text-4xl font-bold leading-tight">{matchedLeads}</p>
          <p className="text-blue-200 text-xs">{totalLeads > 0 ? `${((matchedLeads/totalLeads)*100).toFixed(0)}%` : '0%'}</p>
        </div>

        {/* Closed Leads Card */}
        <div className="bg-white/20 backdrop-blur-sm rounded-xl md:rounded-2xl px-3 py-3 md:px-6 md:py-4 flex flex-col justify-center">
          <p className="text-blue-100 text-xs md:text-sm">נסגרו</p>
          <p className="text-xl md:text-3xl lg:text-4xl font-bold leading-tight">{closedLeads}</p>
          <p className="text-blue-200 text-xs">{totalLeads > 0 ? `${((closedLeads/totalLeads)*100).toFixed(0)}%` : '0%'}</p>
        </div>

        {/* Total Revenue Card - Spans 2 columns on mobile, 1 on desktop */}
        <div className="bg-white/20 backdrop-blur-sm rounded-xl md:rounded-2xl px-3 py-3 md:px-6 md:py-4 flex flex-col justify-center col-span-2 md:col-span-1">
          <p className="text-blue-100 text-xs md:text-sm">סה״כ הכנסות</p>
          <p className="text-lg md:text-2xl lg:text-3xl font-bold leading-tight">
            {totalRevenue.toLocaleString('he-IL', { style: 'currency', currency: 'ILS', minimumFractionDigits: 0 })}
          </p>
          <p className="text-blue-200 text-xs">
            {analyticsLeads.filter(l => l.status === 'התקיימה - נחתם' && l.price).length}/{closedLeads} עם מחיר
          </p>
        </div>

      </div>
    </div>
  );
}