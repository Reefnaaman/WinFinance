'use client'

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Lead, Agent, LeadUpdate } from '@/lib/database.types';
import { useAuth } from '@/contexts/AuthContext';
import LeadEntryForm from './LeadEntryForm';
import CSVImport from './CSVImport';
import CSVExport from './CSVExport';
import Login from './Login';

export default function FullDashboard() {
  const { user, loading: authLoading, logout, canCreateLeads, canViewAllLeads } = useAuth();
  const [currentPage, setCurrentPage] = useState('home');
  const [activeAgent, setActiveAgent] = useState('all');
  const [activeStatus, setActiveStatus] = useState('all');
  const [activeSource, setActiveSource] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLead, setSelectedLead] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('month');

  // Database data - Move these BEFORE conditional returns to avoid hooks order error
  const [dbLeads, setDbLeads] = useState<Lead[]>([]);
  const [dbAgents, setDbAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  // Inline editing state
  const [editingField, setEditingField] = useState<{ leadId: string; field: string } | null>(null);
  const [editingValues, setEditingValues] = useState<{ [key: string]: any }>({});

  // Dropdown state
  const [dropdownOpen, setDropdownOpen] = useState<{ leadId: string; field: string } | null>(null);


  // Fetch data from Supabase
  const fetchData = async () => {
    try {
      setLoading(true);

      const { data: agentsData } = await supabase
        .from('agents')
        .select('*')
        .order('name');

      const { data: leadsData } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      setDbAgents(agentsData || []);
      setDbLeads(leadsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // useEffect MUST be before any conditional returns to follow Rules of Hooks
  useEffect(() => {
    fetchData();
  }, []);

  // Force agents to leads page only
  useEffect(() => {
    if (user?.role === 'agent') {
      setCurrentPage('leads');
    }
  }, [user]);

  // Show loading screen while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-white flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">טוען...</p>
        </div>
      </div>
    );
  }

  // Show login screen if not authenticated
  if (!user) {
    return <Login />;
  }


  const timeRanges = [
    { id: 'week', label: 'שבוע' },
    { id: 'month', label: 'חודש' },
    { id: '3months', label: '3 חודשים' },
    { id: 'year', label: 'שנה' },
  ];

  // SIMPLE: Use database agents as-is, deduplicated
  const agents = dbAgents
    .filter((agent, index, self) => index === self.findIndex((a) => a.id === agent.id)) // Remove duplicates
    .filter(a => a.role === 'agent' || a.role === 'admin') // Only agents and admin
    .map((agent, index) => {
      const colors = ['from-blue-500 to-blue-600', 'from-rose-500 to-rose-600', 'from-amber-500 to-amber-600', 'from-emerald-500 to-emerald-600', 'from-violet-500 to-violet-600'];
      const agentLeads = dbLeads.filter(l => l.assigned_agent_id === agent.id);

      return {
        id: agent.id,
        name: agent.name,
        avatar: agent.name === 'עדי' ? '👩‍💼' : '👨‍💼',
        color: colors[index % colors.length],
        stats: {
          matched: agentLeads.filter(l => l.status === 'התקיימה - נחתם').length, // Use new status names
          closed: agentLeads.filter(l => l.status === 'התקיימה - נחתם').length,
          inProgress: agentLeads.filter(l => l.status === 'התקיימה - במעקב').length,
          failed: agentLeads.filter(l => l.status === 'התקיימה - נכשל').length
        },
        totalAssigned: agentLeads.length
      };
    });

  const sources = [
    { id: 'Email', label: 'Email', icon: '📧', color: 'bg-blue-500', lightBg: 'bg-blue-50', text: 'text-blue-700' },
    { id: 'Google Sheet', label: 'Google Sheets', icon: '📊', color: 'bg-emerald-500', lightBg: 'bg-emerald-50', text: 'text-emerald-700' },
    { id: 'Manual', label: 'Manual', icon: '✏️', color: 'bg-purple-500', lightBg: 'bg-purple-50', text: 'text-purple-700' },
  ];

  // Role-based statuses
  const coordinatorStatuses = [
    // Coordinators don't set statuses, they just assign to agents
    // The assignment itself implies relevance
  ];

  const agentStatuses = [
    { id: 'אין מענה - לתאם מחדש', label: 'אין מענה - לתאם מחדש', color: 'bg-orange-500', lightBg: 'bg-orange-50', text: 'text-orange-700' },
    { id: 'התקיימה - נכשל', label: 'התקיימה - נכשל', color: 'bg-red-500', lightBg: 'bg-red-50', text: 'text-red-700' },
    { id: 'התקיימה - נחתם', label: 'התקיימה - נחתם', color: 'bg-green-500', lightBg: 'bg-green-50', text: 'text-green-700' },
    { id: 'התקיימה - במעקב', label: 'התקיימה - במעקב', color: 'bg-blue-500', lightBg: 'bg-blue-50', text: 'text-blue-700' },
  ];

  // Get statuses based on user role
  const getAvailableStatuses = () => {
    if (user?.role === 'agent') {
      return agentStatuses;
    } else if (user?.role === 'coordinator' || user?.role === 'admin') {
      // Coordinators should see all statuses for viewing, but can't edit them
      return agentStatuses;
    }
    return agentStatuses; // fallback
  };

  const statuses = getAvailableStatuses();
  console.log('🔍 Debug - Available statuses:', statuses);

  const relevanceStatuses = [
    { id: 'ממתין לבדיקה', label: 'ממתין לבדיקה', color: 'bg-yellow-500', lightBg: 'bg-yellow-100', text: 'text-yellow-800' },
    { id: 'רלוונטי', label: 'רלוונטי', color: 'bg-green-500', lightBg: 'bg-green-100', text: 'text-green-800' },
    { id: 'לא רלוונטי', label: 'לא רלוונטי', color: 'bg-red-500', lightBg: 'bg-red-100', text: 'text-red-800' },
  ];


  const filteredLeads = dbLeads.filter(lead => {
    // Role-based filtering: agents only see their assigned leads
    if (user?.role === 'agent' && lead.assigned_agent_id !== user.id) {
      return false;
    }

    const matchesAgent = activeAgent === 'all' || lead.assigned_agent_id === activeAgent;
    const matchesStatus = activeStatus === 'all' || lead.status === activeStatus;
    const matchesSource = activeSource === 'all' || lead.source === activeSource;
    const matchesSearch = lead.lead_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          lead.phone.includes(searchTerm);
    return matchesAgent && matchesStatus && matchesSource && matchesSearch;
  });

  const getStatusInfo = (statusId: string | null) => statuses.find(s => s.id === statusId);
  const getAgentInfo = (agentId: string | null) => agents.find(a => a.id === agentId);
  const getSourceInfo = (sourceId: string) => sources.find(s => s.id === sourceId);

  // Get color styling based on color_code field
  const getColorStyling = (colorCode: string | null) => {
    if (!colorCode) return "border-b border-slate-50 hover:bg-slate-50/50 transition-colors";

    const normalizedColor = colorCode.toLowerCase().trim();

    switch (normalizedColor) {
      case 'ירוק':
      case 'ירו':
        return "border-b border-green-200 bg-green-50/50 hover:bg-green-100/70 transition-colors";
      case 'אדום':
      case 'אד':
        return "border-b border-red-200 bg-red-50/50 hover:bg-red-100/70 transition-colors";
      case 'צהוב':
      case 'צה':
        return "border-b border-yellow-200 bg-yellow-50/50 hover:bg-yellow-100/70 transition-colors";
      case 'כחול':
      case 'כח':
        return "border-b border-blue-200 bg-blue-50/50 hover:bg-blue-100/70 transition-colors";
      case 'כתום':
        return "border-b border-orange-200 bg-orange-50/50 hover:bg-orange-100/70 transition-colors";
      case 'סגול':
        return "border-b border-purple-200 bg-purple-50/50 hover:bg-purple-100/70 transition-colors";
      case 'לבן':
        return "border-b border-gray-200 bg-gray-50/50 hover:bg-gray-100/70 transition-colors";
      default:
        return "border-b border-slate-50 hover:bg-slate-50/50 transition-colors";
    }
  };

  // Analytics calculations
  const totalLeads = dbLeads.length;
  const matchedLeads = dbLeads.filter(l => l.status === 'תואם').length;
  const closedLeads = dbLeads.filter(l => l.status === 'עסקה נסגרה').length;
  const failedLeads = dbLeads.filter(l => l.status === 'לא תואם').length;
  const pendingAssignment = dbLeads.filter(l => !l.assigned_agent_id).length;
  const emailLeads = dbLeads.filter(l => l.source === 'Email').length;
  const sheetsLeads = dbLeads.filter(l => l.source === 'Google Sheet').length;

  const navItems = [
    { id: 'home', label: 'דף הבית', icon: '🏠' },
    { id: 'leads', label: 'לידים', icon: '📋' },
    { id: 'agents', label: 'סוכנים', icon: '👥' },
    { id: 'users', label: 'ניהול משתמשים', icon: '⚙️' },
    ...(user?.role === 'admin' ? [{ id: 'email-settings', label: 'הגדרות מייל', icon: '📧' }] : []),
  ].filter(item => {
    // Agents only see leads page
    if (user?.role === 'agent') {
      return item.id === 'leads';
    }
    // Only admin can see users management
    if (item.id === 'users' && user?.role !== 'admin') {
      return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-white flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">טוען נתונים...</p>
        </div>
      </div>
    );
  }

  // Home Page Component
  const HomePage = () => (
    <div className="space-y-6">
      {/* Time Filter */}
      <div className="flex justify-end">
        <div className="flex items-center gap-2 bg-white rounded-xl p-1 shadow-sm border border-slate-100">
          {timeRanges.map((range) => (
            <button
              key={range.id}
              onClick={() => setTimeRange(range.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                timeRange === range.id
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative z-10">
          <h2 className="text-3xl font-bold mb-2">בוקר טוב! 👋</h2>
          <p className="text-blue-100 text-lg">הנה סיכום הפעילות שלך</p>
        </div>
        <div className="relative z-10 mt-6 flex flex-col sm:flex-row gap-4 sm:gap-6">
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-6 py-4">
            <p className="text-blue-100 text-sm">לידים ממתינים לשיוך</p>
            <p className="text-4xl font-bold">{pendingAssignment}</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-6 py-4">
            <p className="text-blue-100 text-sm">פגישות מתואמות</p>
            <p className="text-4xl font-bold">{matchedLeads}</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-6 py-4">
            <p className="text-blue-100 text-sm">עסקאות שנסגרו</p>
            <p className="text-4xl font-bold">{closedLeads}</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-slate-500 to-slate-600 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-xl">📊</span>
            </div>
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">
              {totalLeads > 0 ? `${((closedLeads/totalLeads)*100).toFixed(0)}%` : '0%'}
            </span>
          </div>
          <p className="text-4xl font-bold text-slate-800">{totalLeads}</p>
          <p className="text-slate-500">סה״כ לידים</p>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-xl">✅</span>
            </div>
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">
              {totalLeads > 0 ? `${((matchedLeads/totalLeads)*100).toFixed(0)}%` : '0%'}
            </span>
          </div>
          <p className="text-4xl font-bold text-slate-800">{matchedLeads}</p>
          <p className="text-slate-500">תואם</p>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-xl">🎉</span>
            </div>
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-700">
              {totalLeads > 0 ? `${((closedLeads/totalLeads)*100).toFixed(0)}%` : '0%'}
            </span>
          </div>
          <p className="text-4xl font-bold text-slate-800">{closedLeads}</p>
          <p className="text-slate-500">עסקאות נסגרו</p>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-xl">❌</span>
            </div>
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-red-100 text-red-700">{failedLeads}</span>
          </div>
          <p className="text-4xl font-bold text-slate-800">{failedLeads}</p>
          <p className="text-slate-500">נכשל</p>
        </div>
      </div>

      {/* All Analytics Cards in One Row - Maximum Space Efficiency */}
      <div className="grid grid-cols-1 xl:grid-cols-7 gap-4">
        {/* Status Distribution Chart - Compact */}
        <div className="xl:col-span-2">
          <div className="bg-gradient-to-br from-white to-slate-50/50 rounded-2xl p-4 shadow-lg border border-slate-100/50 backdrop-blur-sm h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
                  <span className="text-white text-sm">📊</span>
                </div>
                התפלגות סטטוס
              </h3>
            </div>

            <div className="flex flex-col items-center gap-4">
              {/* Ultra Compact Donut Chart */}
              <div className="relative">
                <div className="relative w-24 h-24">
                  <svg className="transform -rotate-90 w-24 h-24">
                    <circle
                      cx="48"
                      cy="48"
                      r="36"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      className="text-slate-100"
                    />
                    {/* Segments with better visual separation */}
                    <circle
                      cx="48"
                      cy="48"
                      r="36"
                      stroke="url(#gradient-success)"
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray={`${(matchedLeads / totalLeads) * 226.2} 226.2`}
                      strokeDashoffset="0"
                      strokeLinecap="round"
                    />
                    <circle
                      cx="48"
                      cy="48"
                      r="36"
                      stroke="url(#gradient-pending)"
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray={`${(pendingAssignment / totalLeads) * 226.2} 226.2`}
                      strokeDashoffset={`-${(matchedLeads / totalLeads) * 226.2 + 2}`}
                      strokeLinecap="round"
                    />
                    <circle
                      cx="48"
                      cy="48"
                      r="36"
                      stroke="url(#gradient-failed)"
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray={`${(failedLeads / totalLeads) * 226.2} 226.2`}
                      strokeDashoffset={`-${((matchedLeads + pendingAssignment) / totalLeads) * 226.2 + 4}`}
                      strokeLinecap="round"
                    />
                    <circle
                      cx="48"
                      cy="48"
                      r="36"
                      stroke="url(#gradient-closed)"
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray={`${(closedLeads / totalLeads) * 226.2} 226.2`}
                      strokeDashoffset={`-${((matchedLeads + pendingAssignment + failedLeads) / totalLeads) * 226.2 + 6}`}
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient id="gradient-success" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#059669" />
                      </linearGradient>
                      <linearGradient id="gradient-pending" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#2563eb" />
                      </linearGradient>
                      <linearGradient id="gradient-failed" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#ef4444" />
                        <stop offset="100%" stopColor="#dc2626" />
                      </linearGradient>
                      <linearGradient id="gradient-closed" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#8b5cf6" />
                        <stop offset="100%" stopColor="#7c3aed" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-lg font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">{totalLeads}</div>
                      <div className="text-xs text-slate-500 font-medium">לידים</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ultra Compact Legend */}
              <div className="w-full space-y-2">
                <div className="flex items-center justify-between p-1.5 rounded-md bg-emerald-50 border border-emerald-100">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600"></div>
                    <span className="text-xs font-medium text-emerald-800">תואם</span>
                  </div>
                  <div className="text-xs font-bold text-emerald-700">
                    {matchedLeads}
                  </div>
                </div>

                <div className="flex items-center justify-between p-1.5 rounded-md bg-blue-50 border border-blue-100">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-600"></div>
                    <span className="text-xs font-medium text-blue-800">נכשל</span>
                  </div>
                  <div className="text-xs font-bold text-blue-700">
                    {pendingAssignment}
                  </div>
                </div>

                <div className="flex items-center justify-between p-1.5 rounded-md bg-red-50 border border-red-100">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-red-500 to-red-600"></div>
                    <span className="text-xs font-medium text-red-800">לא תואם</span>
                  </div>
                  <div className="text-xs font-bold text-red-700">
                    {failedLeads}
                  </div>
                </div>

                <div className="flex items-center justify-between p-1.5 rounded-md bg-purple-50 border border-purple-100">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-purple-600"></div>
                    <span className="text-xs font-medium text-purple-800">עסקה נסגרה</span>
                  </div>
                  <div className="text-xs font-bold text-purple-700">
                    {closedLeads}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Agent Rankings - Ultra Compact */}
        <div className="xl:col-span-3">
          <div className="bg-gradient-to-br from-white to-amber-50/30 rounded-2xl p-4 shadow-lg border border-slate-100/50 backdrop-blur-sm h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center shadow-md">
                  <span className="text-white text-sm">🏆</span>
                </div>
                דירוג סוכנים
              </h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {dbAgents
                .map(agent => {
                  const agentLeads = dbLeads.filter(lead => lead.assigned_agent_id === agent.id);
                  const agentClosedLeads = agentLeads.filter(lead => lead.status === 'עסקה נסגרה');
                  const totalAgentLeads = agentLeads.length;
                  return {
                    ...agent,
                    totalLeads: totalAgentLeads,
                    closedLeads: agentClosedLeads.length,
                    successRate: totalAgentLeads > 0 ? ((agentClosedLeads.length / totalAgentLeads) * 100) : 0
                  };
                })
                .sort((a, b) => b.closedLeads - a.closedLeads)
                .slice(0, 4)
                .map((agent, index) => {
                  const maxLeads = Math.max(...dbAgents.map(a => {
                    const leads = dbLeads.filter(lead => lead.assigned_agent_id === a.id);
                    return leads.filter(lead => lead.status === 'עסקה נסגרה').length;
                  }), 1);
                  const percentage = (agent.closedLeads / maxLeads) * 100;

                  return (
                    <div key={agent.id} className="relative overflow-hidden bg-white/60 backdrop-blur-sm border border-white/50 rounded-lg p-3 hover:shadow-md transition-all">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`flex items-center justify-center w-6 h-6 rounded-lg font-bold text-xs text-white shadow-md ${
                          index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
                          index === 1 ? 'bg-gradient-to-br from-gray-400 to-gray-600' :
                          index === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-800' :
                          'bg-gradient-to-br from-blue-500 to-blue-600'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-800 truncate text-xs">{agent.name}</p>
                          <p className="text-xs text-slate-500">{agent.totalLeads} לידים</p>
                        </div>
                        {index < 3 && (
                          <span className="text-xs">
                            {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                          </span>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-slate-600">עסקאות</span>
                          <span className="font-bold text-xs">{agent.closedLeads}</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full transition-all duration-500 ${
                              index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                              index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-600' :
                              index === 2 ? 'bg-gradient-to-r from-amber-600 to-amber-800' :
                              'bg-gradient-to-r from-blue-500 to-blue-600'
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-slate-600">הצלחה</span>
                          <span className="font-semibold text-xs text-slate-700">{agent.successRate.toFixed(0)}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}

              {dbAgents.length === 0 && (
                <div className="lg:col-span-2 text-center py-6">
                  <p className="text-gray-500 text-sm">אין סוכנים במערכת עדיין</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Leads - Ultra Compact */}
        <div className="xl:col-span-2">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                <span>🕐</span> לידים אחרונים
              </h3>
              <button
                onClick={() => setCurrentPage('leads')}
                className="text-blue-600 hover:text-blue-700 text-xs font-medium"
              >
                צפה בהכל ←
              </button>
            </div>

            {dbLeads.length === 0 ? (
              <p className="text-center text-gray-500 py-6 text-sm">אין לידים במערכת עדיין</p>
            ) : (
              <div className="space-y-3">
                {dbLeads.slice(0, 4).map((lead) => {
                  const status = getStatusInfo(lead.status);
                  const source = getSourceInfo(lead.source);
                  const agent = getAgentInfo(lead.assigned_agent_id);
                  return (
                    <div key={lead.id} className="p-3 rounded-lg border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-slate-200 to-slate-300 rounded-full flex items-center justify-center text-slate-600 font-medium text-xs">
                            {lead.lead_name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-slate-800 text-xs truncate">{lead.lead_name}</p>
                            <p className="text-xs text-slate-500">{formatPhoneNumber(lead.phone)}</p>
                          </div>
                        </div>
                        {source && <span className="text-sm flex-shrink-0" title={source.label}>{source.icon}</span>}
                      </div>
                      <div className="flex items-center justify-between">
                        {status ? (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.lightBg} ${status.text}`}>
                            <div className={`w-1 h-1 rounded-full ${status.color}`} />
                            {status.label}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">ללא סטטוס</span>
                        )}
                        {agent && (
                          <span className="text-xs text-slate-500 truncate max-w-[60px]">{agent.name}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );


  // Relevance status update function
  const updateRelevanceStatus = async (leadId: string, status: 'ממתין לבדיקה' | 'רלוונטי' | 'לא רלוונטי') => {
    const updateData: LeadUpdate = {
      relevance_status: status,
      updated_at: new Date().toISOString()
    };

    const { error } = await (supabase
      .from('leads') as any)
      .update(updateData)
      .eq('id', leadId);

    if (!error) {
      setDbLeads(prev => prev.map(lead =>
        lead.id === leadId ? { ...lead, relevance_status: status } : lead
      ));
    }
  };

  // Agent assignment function
  const assignAgent = async (leadId: string, agentId: string) => {
    const updateData: LeadUpdate = {
      assigned_agent_id: agentId,
      updated_at: new Date().toISOString()
    };

    const { error } = await (supabase
      .from('leads') as any)
      .update(updateData)
      .eq('id', leadId);

    if (!error) {
      setDbLeads(prev => prev.map(lead =>
        lead.id === leadId ? { ...lead, assigned_agent_id: agentId } : lead
      ));
    }
  };

  // Google Calendar integration
  const createGoogleCalendarEvent = async (lead: Lead, meetingDate: string, meetingTime: string) => {
    const startDateTime = `${meetingDate}T${meetingTime}:00`;
    const endDateTime = new Date(new Date(startDateTime).getTime() + 60 * 60 * 1000).toISOString().slice(0, 16);

    const event = {
      summary: `פגישה עם ${lead.lead_name} - ביטוח`,
      description: `פגישת ביטוח עם לקוח חדש\nטלפון: ${formatPhoneNumber(lead.phone)}\nאימייל: ${lead.email || 'לא זמין'}${lead.agent_notes ? '\nהערות: ' + lead.agent_notes : ''}`,
      start: {
        dateTime: startDateTime + ':00.000Z',
        timeZone: 'Asia/Jerusalem',
      },
      end: {
        dateTime: endDateTime + ':00.000Z',
        timeZone: 'Asia/Jerusalem',
      },
      attendees: [
        ...(lead.email ? [{ email: lead.email }] : []),
      ],
    };

    // Create Google Calendar link for manual addition
    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.summary)}&dates=${startDateTime.replace(/[-:]/g, '')}Z/${endDateTime.replace(/[-:]/g, '')}Z&details=${encodeURIComponent(event.description)}`;

    window.open(calendarUrl, '_blank');
  };

  // Agent status update functions
  const updateLeadStatus = async (leadId: string, status: 'לא תואם' | 'תואם' | 'עסקה נסגרה' | 'התקיים מעק' | 'תואמה פגישה' | 'נכשל' | 'אין מענה' | 'נמכר', meetingDate?: string, meetingTime?: string) => {
    const updateData: LeadUpdate = {
      status,
      updated_at: new Date().toISOString()
    };

    if (status === 'תואם' && meetingDate) {
      updateData.meeting_date = meetingDate;
    }

    const { error } = await (supabase
      .from('leads') as any)
      .update(updateData)
      .eq('id', leadId);

    if (!error) {
      setDbLeads(prev => prev.map(lead => {
        if (lead.id === leadId) {
          const updatedLead = { ...lead, ...updateData };

          // Create Google Calendar event if meeting is scheduled
          if (status === 'תואם' && meetingDate && meetingTime) {
            createGoogleCalendarEvent(updatedLead, meetingDate, meetingTime);
          }

          return updatedLead;
        }
        return lead;
      }));
    }
  };

  const updateLeadNotes = async (leadId: string, notes: string) => {
    const updateData: LeadUpdate = {
      agent_notes: notes,
      updated_at: new Date().toISOString()
    };

    const { error } = await (supabase
      .from('leads') as any)
      .update(updateData)
      .eq('id', leadId);

    if (!error) {
      setDbLeads(prev => prev.map(lead =>
        lead.id === leadId ? { ...lead, agent_notes: notes } : lead
      ));
    }
  };

  const updateLeadColor = async (leadId: string, colorCode: string | null) => {
    const updateData: LeadUpdate = {
      color_code: colorCode,
      updated_at: new Date().toISOString()
    };

    const { error } = await (supabase
      .from('leads') as any)
      .update(updateData)
      .eq('id', leadId);

    if (!error) {
      setDbLeads(prev => prev.map(lead =>
        lead.id === leadId ? { ...lead, color_code: colorCode } : lead
      ));
    }
  };

  // Inline editing functions
  const startEditing = (leadId: string, field: string, currentValue: any) => {
    setEditingField({ leadId, field });
    setEditingValues({ [`${leadId}_${field}`]: currentValue });
  };

  const cancelEditing = () => {
    setEditingField(null);
    setEditingValues({});
  };

  const saveFieldEdit = async (leadId: string, field: string) => {
    const key = `${leadId}_${field}`;
    const newValue = editingValues[key];

    if (newValue === undefined || newValue === null) {
      cancelEditing();
      return;
    }

    try {
      let processedValue = newValue;

      // Convert datetime-local value to ISO string for scheduled_call_date
      if (field === 'scheduled_call_date' && newValue) {
        processedValue = new Date(newValue).toISOString();
      }

      // Convert price to number
      if (field === 'price' && newValue !== '' && newValue !== null) {
        processedValue = parseFloat(newValue);
        if (isNaN(processedValue)) {
          alert('אנא הזן מחיר תקין');
          return;
        }
      } else if (field === 'price' && (newValue === '' || newValue === null)) {
        processedValue = null;
      }

      const updateData: LeadUpdate = {
        [field]: processedValue,
        updated_at: new Date().toISOString()
      } as LeadUpdate;

      const { error } = await (supabase
        .from('leads') as any)
        .update(updateData)
        .eq('id', leadId);

      if (!error) {
        setDbLeads(prev => prev.map(lead =>
          lead.id === leadId ? { ...lead, ...updateData } : lead
        ));
      } else {
        console.error('Error updating field:', error);
        alert('שגיאה בעדכון השדה');
      }
    } catch (err) {
      console.error('Error saving field:', err);
      alert('שגיאה בשמירת השדה');
    }

    cancelEditing();
  };

  const updateEditingValue = (leadId: string, field: string, value: any) => {
    const key = `${leadId}_${field}`;
    setEditingValues(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const isEditing = (leadId: string, field: string) => {
    return editingField?.leadId === leadId && editingField?.field === field;
  };

  const getEditingValue = (leadId: string, field: string, defaultValue: any) => {
    const key = `${leadId}_${field}`;
    return editingValues[key] !== undefined ? editingValues[key] : defaultValue;
  };

  // Phone formatting function
  const formatPhoneNumber = (phone: string) => {
    if (!phone) return phone;

    // Remove all non-digits
    const digits = phone.replace(/[^\d]/g, '');

    // If it's 9 digits and doesn't start with 0, add 0
    if (digits.length === 9 && !digits.startsWith('0')) {
      return '0' + digits.slice(0, 2) + '-' + digits.slice(2);
    }

    // If it's 10 digits and starts with 0, format properly
    if (digits.length === 10 && digits.startsWith('0')) {
      return digits.slice(0, 3) + '-' + digits.slice(3);
    }

    // Return original if doesn't match expected patterns
    return phone;
  };

  // Dropdown functions
  const openDropdown = (leadId: string, field: string) => {
    setDropdownOpen({ leadId, field });
  };

  const closeDropdown = () => {
    setDropdownOpen(null);
  };

  const isDropdownOpen = (leadId: string, field: string) => {
    return dropdownOpen?.leadId === leadId && dropdownOpen?.field === field;
  };


  // Leads Page Component
  const LeadsPage = () => (
    <div className="flex gap-6">
      {/* Main Content */}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-slate-800">לידים</h2>

        </div>

        {/* Agent Mini Dashboard - Only show for agents */}
        {user?.role === 'agent' && (() => {
          const agentLeads = filteredLeads;
          const totalAssigned = agentLeads.length;
          const dealsSigned = agentLeads.filter(l => l.status === 'התקיימה - נחתם').length;
          const inFollowUp = agentLeads.filter(l => l.status === 'התקיימה - במעקב').length;
          const noAnswer = agentLeads.filter(l => l.status === 'אין מענה - לתאם מחדש').length;
          const failed = agentLeads.filter(l => l.status === 'התקיימה - נכשל').length;

          const successRate = totalAssigned > 0 ? Math.round((dealsSigned / totalAssigned) * 100) : 0;
          const responseRate = totalAssigned > 0 ? Math.round(((totalAssigned - noAnswer) / totalAssigned) * 100) : 0;

          return (
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 mb-6 text-white shadow-lg">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-2xl">
                  {user.name === 'עדי' ? '👩‍💼' : '👨‍💼'}
                </div>
                <div>
                  <h3 className="text-2xl font-bold">{user.name}</h3>
                  <p className="text-blue-100">סוכן ביטוח</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                  <p className="text-blue-100 text-sm">לידים שויכו</p>
                  <p className="text-3xl font-bold">{totalAssigned}</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                  <p className="text-blue-100 text-sm">עסקאות נחתמו</p>
                  <p className="text-3xl font-bold text-green-300">{dealsSigned}</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                  <p className="text-blue-100 text-sm">שיעור הצלחה</p>
                  <p className="text-3xl font-bold text-yellow-300">{successRate}%</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                  <p className="text-blue-100 text-sm">שיעור מענה</p>
                  <p className="text-3xl font-bold text-cyan-300">{responseRate}%</p>
                </div>
              </div>

              <div className="mt-4 flex gap-4 text-sm flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-300 rounded-full"></div>
                  <span>במעקב: {inFollowUp}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-orange-300 rounded-full"></div>
                  <span>אין מענה: {noAnswer}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-300 rounded-full"></div>
                  <span>נכשלו: {failed}</span>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Filters Bar */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            {/* Search */}
            <div className="flex-1 min-w-64 relative">
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
              <input
                type="text"
                placeholder="חיפוש לפי שם או טלפון..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 placeholder:text-slate-600"
              />
            </div>

            {/* Action Buttons - Only for admin/coordinator */}
            {canCreateLeads() && (
              <div className="flex items-center gap-3">
                <CSVImport onImportComplete={fetchData} />
                <CSVExport
                  currentFilters={{
                    assigned_agent_id: activeAgent === 'all' ? undefined : activeAgent,
                    status: activeStatus === 'all' ? undefined : activeStatus,
                    source: activeSource === 'all' ? undefined : activeSource
                  }}
                  agents={agents.filter(a => a.role === 'agent')}
                />
                <LeadEntryForm onLeadCreated={fetchData} />
              </div>
            )}

          </div>
        </div>

        {/* Leads Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-right py-4 px-5 text-sm font-semibold text-slate-600">שם לקוח</th>
                  <th className="text-right py-4 px-5 text-sm font-semibold text-slate-600 w-36">טלפון</th>
                  <th className="text-right py-4 px-5 text-sm font-semibold text-slate-600">מקור</th>
                  <th className="text-right py-4 px-5 text-sm font-semibold text-slate-600">שיוך</th>
                  <th className="text-right py-4 px-5 text-sm font-semibold text-slate-600">סטטוס</th>
                  <th className="text-right py-4 px-5 text-sm font-semibold text-slate-600">תאריך שיחה</th>
                  <th className="text-right py-4 px-5 text-sm font-semibold text-slate-600">מחיר</th>
                  <th className="text-right py-4 px-5 text-sm font-semibold text-slate-600">הערות</th>
                  <th className="text-right py-4 px-5 text-sm font-semibold text-slate-600">סוכן</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-8 text-gray-500">
                      אין לידים להצגה
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead) => {
                    const status = getStatusInfo(lead.status);
                    const source = getSourceInfo(lead.source);
                    const agent = getAgentInfo(lead.assigned_agent_id);
                    return (
                      <tr key={lead.id} className={getColorStyling(lead.color_code)}>
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-slate-200 to-slate-300 rounded-full flex items-center justify-center text-slate-600 font-medium">
                              {lead.lead_name.charAt(0)}
                            </div>
                            <div className="flex-1">
                              {isEditing(lead.id, 'lead_name') ? (
                                <input
                                  type="text"
                                  value={getEditingValue(lead.id, 'lead_name', lead.lead_name)}
                                  onChange={(e) => updateEditingValue(lead.id, 'lead_name', e.target.value)}
                                  onBlur={() => saveFieldEdit(lead.id, 'lead_name')}
                                  onKeyPress={(e) => e.key === 'Enter' && saveFieldEdit(lead.id, 'lead_name')}
                                  onKeyDown={(e) => e.key === 'Escape' && cancelEditing()}
                                  autoFocus
                                  className="font-medium text-slate-800 bg-white border border-blue-300 rounded px-2 py-1 w-full focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              ) : (
                                <p
                                  className="font-medium text-slate-800 cursor-pointer hover:bg-slate-100 rounded px-1 py-0.5"
                                  onClick={() => startEditing(lead.id, 'lead_name', lead.lead_name)}
                                  title="לחץ לעריכה"
                                >
                                  {lead.lead_name}
                                </p>
                              )}
                              {/* Meeting Date Display */}
                              {lead.meeting_date && (
                                <p className="text-xs text-blue-600">📅 {new Date(lead.meeting_date).toLocaleDateString('he-IL')}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-5">
                          {isEditing(lead.id, 'phone') ? (
                            <input
                              type="text"
                              value={getEditingValue(lead.id, 'phone', lead.phone)}
                              onChange={(e) => updateEditingValue(lead.id, 'phone', e.target.value)}
                              onBlur={() => saveFieldEdit(lead.id, 'phone')}
                              onKeyPress={(e) => e.key === 'Enter' && saveFieldEdit(lead.id, 'phone')}
                              onKeyDown={(e) => e.key === 'Escape' && cancelEditing()}
                              autoFocus
                              className="text-slate-600 font-mono text-sm bg-white border border-blue-300 rounded px-2 py-1 w-full focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          ) : (
                            <div className="flex items-center gap-2">
                              <a
                                href={`tel:${formatPhoneNumber(lead.phone).replace(/[^\d]/g, '')}`}
                                className="text-slate-600 font-mono text-sm hover:text-blue-600 hover:underline"
                                title="לחץ להתקשר"
                              >
                                {formatPhoneNumber(lead.phone)}
                              </a>
                              <button
                                onClick={() => startEditing(lead.id, 'phone', lead.phone)}
                                className="text-slate-400 hover:text-slate-600 text-xs"
                                title="ערוך מספר"
                              >
                                ✏️
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-5">
                          {isEditing(lead.id, 'source') ? (
                            <select
                              value={getEditingValue(lead.id, 'source', lead.source)}
                              onChange={(e) => updateEditingValue(lead.id, 'source', e.target.value)}
                              onBlur={() => saveFieldEdit(lead.id, 'source')}
                              onKeyDown={(e) => e.key === 'Escape' && cancelEditing()}
                              autoFocus
                              className="text-xs bg-white border border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                              <option value="Email">Email</option>
                              <option value="Google Sheet">Google Sheet</option>
                              <option value="Manual">Manual</option>
                              <option value="Other">Other</option>
                            </select>
                          ) : (
                            <div
                              className="cursor-pointer hover:bg-slate-100 rounded p-1"
                              onClick={() => startEditing(lead.id, 'source', lead.source)}
                              title="לחץ לעריכה"
                            >
                              {source ? (
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${source.lightBg} ${source.text}`}>
                                  {source.icon} {source.label}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-dashed border-slate-300 text-xs font-medium text-slate-500 hover:border-slate-400 hover:text-slate-600">
                                  ➕ הוסף מקור
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-5">
                          <div className="relative">
                            {(() => {
                              // Show assignment status instead of relevance
                              if (!lead.assigned_agent_id) {
                                return (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                    <div className="w-2 h-2 rounded-full bg-yellow-500" />
                                    לא שויך
                                  </span>
                                );
                              } else {
                                return (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    <div className="w-2 h-2 rounded-full bg-green-500" />
                                    שויך לסוכן
                                  </span>
                                );
                              }
                            })()}

                          </div>
                        </td>
                        <td className="py-4 px-5">
                          {/* Status Dropdown for Agent Updates Only */}
                          <div className="flex items-center gap-2">
                            <div className="relative">
                              {user?.role === 'agent' ? (
                                status ? (
                                  <button
                                    onClick={() => isDropdownOpen(lead.id, 'status') ? closeDropdown() : openDropdown(lead.id, 'status')}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium cursor-pointer hover:opacity-80 transition-opacity ${status.lightBg} ${status.text}`}
                                  >
                                    <div className={`w-2 h-2 rounded-full ${status.color}`} />
                                    {status.label}
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => isDropdownOpen(lead.id, 'status') ? closeDropdown() : openDropdown(lead.id, 'status')}
                                    className="text-slate-400 text-sm hover:text-slate-600 hover:bg-slate-50 rounded px-2 py-1 border border-dashed border-slate-300"
                                  >
                                    ✏️ לחץ לעדכון סטטוס
                                  </button>
                                )
                              ) : (
                                status ? (
                                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${status.lightBg} ${status.text}`}>
                                    <div className={`w-2 h-2 rounded-full ${status.color}`} />
                                    {status.label}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 text-sm">אין סטטוס</span>
                                )
                              )}

                              {isDropdownOpen(lead.id, 'status') && user?.role === 'agent' && (
                                <div className="absolute top-full left-0 bg-white border border-slate-200 rounded-lg shadow-lg z-10 min-w-[180px] mt-1">
                                  {statuses.map((statusOption) => (
                                    <button
                                      key={statusOption.id}
                                      onClick={() => {
                                        updateLeadStatus(lead.id, statusOption.id as any);
                                        closeDropdown();
                                      }}
                                      className={`w-full px-3 py-2 text-right ${statusOption.text} border-b border-slate-100 flex items-center gap-2 last:border-b-0 hover:bg-slate-50`}
                                    >
                                      <div className={`w-2 h-2 rounded-full ${statusOption.color}`} />
                                      {statusOption.label}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>

                          </div>
                        </td>

                        {/* Scheduled Call Date Column */}
                        <td className="py-4 px-5">
                          {(() => {
                            const canScheduleCall = user?.role === 'admin' || user?.role === 'coordinator';
                            return (
                              <div className="relative">
                                {isEditing(lead.id, 'scheduled_call_date') ? (
                                  <input
                                    type="datetime-local"
                                    value={getEditingValue(lead.id, 'scheduled_call_date', lead.scheduled_call_date ? new Date(lead.scheduled_call_date).toISOString().slice(0, 16) : '')}
                                    onChange={(e) => updateEditingValue(lead.id, 'scheduled_call_date', e.target.value)}
                                    onBlur={() => saveFieldEdit(lead.id, 'scheduled_call_date')}
                                    onKeyPress={(e) => e.key === 'Enter' && saveFieldEdit(lead.id, 'scheduled_call_date')}
                                    onKeyDown={(e) => e.key === 'Escape' && cancelEditing()}
                                    autoFocus
                                    className="text-sm bg-white border border-blue-300 rounded px-2 py-1 w-full focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  />
                                ) : (
                                  <div
                                    className={`${canScheduleCall ? 'cursor-pointer hover:bg-slate-100' : 'cursor-default'} rounded p-1 min-h-[24px] flex items-center`}
                                    onClick={() => canScheduleCall && startEditing(lead.id, 'scheduled_call_date', lead.scheduled_call_date ? new Date(lead.scheduled_call_date).toISOString().slice(0, 16) : '')}
                                    title={canScheduleCall ? 'לחץ לקביעת תאריך שיחה' : 'קביעת תאריכים מאופשרת רק למתאם או מנהל'}
                                  >
                                    {lead.scheduled_call_date ? (
                                      <div className="flex flex-col">
                                        <span className="text-sm font-medium text-slate-700">
                                          📞 {new Date(lead.scheduled_call_date).toLocaleDateString('he-IL')}
                                        </span>
                                        <span className="text-xs text-slate-500">
                                          {new Date(lead.scheduled_call_date).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                      </div>
                                    ) : (
                                      <span className="text-sm text-slate-400">
                                        {canScheduleCall ? 'לחץ לקביעת תאריך...' : '📅 לא נקבע'}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </td>

                        {/* Price Column */}
                        <td className="py-4 px-5">
                          {(() => {
                            const canEditPrice = user?.role === 'admin' || user?.role === 'coordinator' || (user?.role === 'agent' && lead.assigned_agent_id === user?.id);
                            return (
                              <div className="relative">
                                {isEditing(lead.id, 'price') ? (
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={getEditingValue(lead.id, 'price', lead.price || '')}
                                    onChange={(e) => updateEditingValue(lead.id, 'price', e.target.value)}
                                    onBlur={() => saveFieldEdit(lead.id, 'price')}
                                    onKeyPress={(e) => e.key === 'Enter' && saveFieldEdit(lead.id, 'price')}
                                    onKeyDown={(e) => e.key === 'Escape' && cancelEditing()}
                                    autoFocus
                                    placeholder="0.00"
                                    className="text-sm bg-white border border-blue-300 rounded px-2 py-1 w-full focus:outline-none focus:ring-1 focus:ring-blue-500 text-left"
                                  />
                                ) : (
                                  <div
                                    className={`${canEditPrice ? 'cursor-pointer hover:bg-slate-100' : 'cursor-default'} rounded p-1 min-h-[24px] flex items-center`}
                                    onClick={() => canEditPrice && startEditing(lead.id, 'price', lead.price || '')}
                                    title={canEditPrice ? 'לחץ לעריכת המחיר' : 'עריכת מחיר מאופשרת רק למנהל, מתאם או סוכן המטפל'}
                                  >
                                    {lead.price ? (
                                      <div className="flex items-center gap-1">
                                        <span className="text-sm font-medium text-green-700">
                                          ₪{Number(lead.price).toLocaleString('he-IL', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                                        </span>
                                      </div>
                                    ) : (
                                      <span className="text-sm text-slate-400">
                                        {canEditPrice ? 'לחץ להוספת מחיר...' : '-'}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </td>

                        <td className="py-4 px-5">
                          {isEditing(lead.id, 'agent_notes') ? (
                            <input
                              type="text"
                              value={getEditingValue(lead.id, 'agent_notes', lead.agent_notes || '')}
                              onChange={(e) => updateEditingValue(lead.id, 'agent_notes', e.target.value)}
                              onBlur={() => saveFieldEdit(lead.id, 'agent_notes')}
                              onKeyPress={(e) => e.key === 'Enter' && saveFieldEdit(lead.id, 'agent_notes')}
                              onKeyDown={(e) => e.key === 'Escape' && cancelEditing()}
                              autoFocus
                              placeholder="הוסף הערות..."
                              className="text-sm bg-white border border-blue-300 rounded px-2 py-1 w-full focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          ) : (
                            <div
                              className="cursor-pointer hover:bg-slate-100 rounded p-1 min-h-[24px]"
                              onClick={() => startEditing(lead.id, 'agent_notes', lead.agent_notes || '')}
                              title="לחץ לעריכה"
                            >
                              {lead.agent_notes ? (
                                <span className="text-sm text-slate-600">{lead.agent_notes}</span>
                              ) : (
                                <span className="text-sm text-slate-400">לחץ להוספת הערות...</span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-5">
                          <div className="relative">
                            {(() => {
                              const canAssignAgent = user?.role !== 'agent';
                              return (
                                <div
                                  className={`rounded p-1 ${canAssignAgent ? 'cursor-pointer hover:bg-slate-100' : 'cursor-default'}`}
                                  onClick={() => canAssignAgent && (isDropdownOpen(lead.id, 'agent') ? closeDropdown() : openDropdown(lead.id, 'agent'))}
                                  title={canAssignAgent ? 'לחץ לבחירת סוכן' : 'שיוך סוכנים מאופשר רק למתאם או מנהל'}
                                >
                                  {agent ? (
                                    <div className="flex items-center gap-2">
                                      <div className={`w-8 h-8 bg-gradient-to-br ${agent.color} rounded-lg flex items-center justify-center text-white text-sm shadow-sm`}>
                                        {agent.avatar}
                                      </div>
                                      <span className="text-slate-700 text-sm font-medium">{agent.name}</span>
                                    </div>
                                  ) : (
                                    <button className={`text-slate-400 text-sm rounded px-2 py-1 border border-dashed border-slate-300 flex items-center gap-2 ${canAssignAgent ? 'hover:text-slate-600 hover:bg-slate-50' : 'cursor-default'}`}>
                                      {canAssignAgent ? '✏️ בחר סוכן' : '👤 לא שויך'}
                                    </button>
                                  )}
                                </div>
                              );
                            })()}

                            {/* Agent Dropdown - Only for admin/coordinator */}
                            {isDropdownOpen(lead.id, 'agent') && user?.role !== 'agent' && (
                              <div className="absolute z-50 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg">
                                <button
                                  onClick={() => {
                                    assignAgent(lead.id, '');
                                    closeDropdown();
                                  }}
                                  className="w-full px-3 py-2 text-right text-sm hover:bg-gray-50 border-b border-gray-100"
                                >
                                  לא שויך
                                </button>
                                {dbAgents.filter(a => a.role === 'agent' || a.role === 'admin').map((agentOption) => (
                                  <button
                                    key={agentOption.id}
                                    onClick={() => {
                                      assignAgent(lead.id, agentOption.id);
                                      closeDropdown();
                                    }}
                                    className="w-full px-3 py-2 text-right hover:bg-gray-50 flex items-center gap-2"
                                  >
                                    <div className={`w-6 h-6 bg-gradient-to-br ${getAgentInfo(agentOption.id)?.color || 'from-gray-400 to-gray-600'} rounded-lg flex items-center justify-center text-white text-xs shadow-sm`}>
                                      {getAgentInfo(agentOption.id)?.avatar || '👤'}
                                    </div>
                                    <span className="text-sm text-slate-900">{agentOption.name}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );

  // Agents Page Component
  const AgentsPage = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">ביצועי סוכנים</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {agents.map((agent) => {
          const total = agent.stats.matched + agent.stats.notInterested + agent.stats.closed + (agent.stats.notMatched || 0);
          const successRate = total > 0 ? Math.round(((agent.stats.matched + agent.stats.closed) / total) * 100) : 0;

          return (
            <div key={agent.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 bg-gradient-to-br ${agent.color} rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg`}>
                    {agent.avatar}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{agent.name}</h3>
                    <p className="text-slate-700">{total} לידים</p>
                  </div>
                </div>
                <div className="text-left">
                  <p className="text-3xl font-bold text-slate-900">{successRate}%</p>
                  <p className="text-xs text-slate-700">אחוז הצלחה</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                <div className="bg-emerald-50 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-emerald-600">{agent.stats.matched}</p>
                  <p className="text-xs text-emerald-600">תואם</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-blue-600">{agent.stats.closed}</p>
                  <p className="text-xs text-blue-600">נסגר</p>
                </div>
                <div className="bg-amber-50 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-amber-600">{agent.stats.notMatched || 0}</p>
                  <p className="text-xs text-amber-600">לא תואם</p>
                </div>
                <div className="bg-red-50 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-red-600">{agent.stats.notInterested}</p>
                  <p className="text-xs text-red-600">לא רצה</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );

  // Email Settings Page Component
  const EmailSettingsPage = () => {
    const [settings, setSettings] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [testing, setTesting] = useState(false);
    const [checking, setChecking] = useState(false);
    const [formData, setFormData] = useState({
      email_host: 'imap.gmail.com',
      email_port: 993,
      email_username: '',
      email_password: '',
      email_secure: true,
      monitored_email_addresses: '',
      email_enabled: false
    });

    // Load email settings
    useEffect(() => {
      loadEmailSettings();
    }, []);

    const loadEmailSettings = async () => {
      try {
        const response = await fetch('/api/email-settings');
        const data = await response.json();

        if (data.success && data.settings) {
          setSettings(data.settings);
          setFormData({
            email_host: data.settings.email_host || 'imap.gmail.com',
            email_port: data.settings.email_port || 993,
            email_username: data.settings.email_username || '',
            email_password: data.settings.email_password || '',
            email_secure: data.settings.email_secure !== false,
            monitored_email_addresses: (data.settings.monitored_email_addresses || []).join(', '),
            email_enabled: data.settings.email_enabled || false
          });
        }
      } catch (error) {
        console.error('Error loading email settings:', error);
      }
    };

    const saveSettings = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/email-settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            monitored_email_addresses: formData.monitored_email_addresses
              .split(',')
              .map(email => email.trim())
              .filter(email => email.length > 0)
          })
        });

        const data = await response.json();

        if (data.success) {
          setSettings(data.settings);
          alert('הגדרות נשמרו בהצלחה!');
        } else {
          alert('שגיאה בשמירת הגדרות');
        }
      } catch (error) {
        console.error('Error saving settings:', error);
        alert('שגיאה בשמירת הגדרות');
      } finally {
        setLoading(false);
      }
    };

    const testConnection = async () => {
      setTesting(true);
      try {
        const response = await fetch('/api/test-email-connection', {
          method: 'POST'
        });
        const data = await response.json();
        alert(data.message);
      } catch (error) {
        alert('שגיאה בבדיקת חיבור');
      } finally {
        setTesting(false);
      }
    };

    const checkEmails = async () => {
      setChecking(true);
      try {
        const response = await fetch('/api/check-emails', {
          method: 'POST'
        });
        const data = await response.json();

        if (data.success) {
          alert('בדיקת מיילים הושלמה!');
          // Refresh leads data
          fetchData();
        } else {
          alert('שגיאה בבדיקת מיילים');
        }
      } catch (error) {
        alert('שגיאה בבדיקת מיילים');
      } finally {
        setChecking(false);
      }
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-800">הגדרות מוניטור מייל אוטומטי</h2>
          <div className="flex gap-3">
            <button
              onClick={testConnection}
              disabled={testing || !formData.email_username || !formData.email_password}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {testing ? 'בודק חיבור...' : '🔍 בדוק חיבור'}
            </button>
            <button
              onClick={checkEmails}
              disabled={checking || !settings?.email_enabled}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {checking ? 'בודק מיילים...' : '📧 בדוק מיילים כעת'}
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
          <h3 className="font-medium mb-2">הוראות הגדרה מהירות:</h3>
          <ol className="list-decimal list-inside space-y-1">
            <li>הפעל אימות דו-שלבי בחשבון Gmail</li>
            <li>צור סיסמת אפליקציה: Google Account → Security → App passwords</li>
            <li>השתמש בסיסמת האפליקציה (16 תווים) ולא בסיסמה הרגילה</li>
            <li>הגדר כתובות מייל מפוקחות (מופרדות בפסיק)</li>
            <li>הפעל מוניטור אחרי שמירת הגדרות</li>
          </ol>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Gmail Configuration */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-slate-800">הגדרות חשבון Gmail</h3>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">שרת IMAP</label>
                <input
                  type="text"
                  value={formData.email_host}
                  onChange={(e) => setFormData(prev => ({ ...prev, email_host: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">פורט</label>
                <input
                  type="number"
                  value={formData.email_port}
                  onChange={(e) => setFormData(prev => ({ ...prev, email_port: parseInt(e.target.value) || 993 }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">כתובת Gmail</label>
                <input
                  type="email"
                  value={formData.email_username}
                  onChange={(e) => setFormData(prev => ({ ...prev, email_username: e.target.value }))}
                  placeholder="leads@winfinance.com"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">סיסמת אפליקציה (16 תווים)</label>
                <input
                  type="password"
                  value={formData.email_password}
                  onChange={(e) => setFormData(prev => ({ ...prev, email_password: e.target.value }))}
                  placeholder="xxxx xxxx xxxx xxxx"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 font-mono"
                />
              </div>
            </div>

            {/* Monitoring Configuration */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-slate-800">הגדרות מוניטור</h3>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">כתובות מייל מפוקחות</label>
                <textarea
                  value={formData.monitored_email_addresses}
                  onChange={(e) => setFormData(prev => ({ ...prev, monitored_email_addresses: e.target.value }))}
                  placeholder="campaigns@leadprovider.com, forms@website.co.il"
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                />
                <p className="text-xs text-slate-500 mt-1">הפרד כתובות מייל בפסיק. השאר ריק כדי לעקוב אחרי כל המיילים</p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="email_enabled"
                  checked={formData.email_enabled}
                  onChange={(e) => setFormData(prev => ({ ...prev, email_enabled: e.target.checked }))}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="email_enabled" className="text-sm font-medium text-slate-700">
                  הפעל מוניטור מייל אוטומטי
                </label>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="email_secure"
                  checked={formData.email_secure}
                  onChange={(e) => setFormData(prev => ({ ...prev, email_secure: e.target.checked }))}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="email_secure" className="text-sm font-medium text-slate-700">
                  השתמש בחיבור מאובטח (SSL/TLS)
                </label>
              </div>

              {settings && (
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-600">
                    <strong>סטטוס:</strong> {settings.email_enabled ? '🟢 פעיל' : '🔴 כבוי'}
                  </p>
                  {settings.last_check_date && (
                    <p className="text-sm text-slate-600">
                      <strong>בדיקה אחרונה:</strong> {new Date(settings.last_check_date).toLocaleString('he-IL')}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-200">
            <button
              onClick={saveSettings}
              disabled={loading || !formData.email_username || !formData.email_password}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'שומר...' : '💾 שמור הגדרות'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Users Management Page Component
  const UsersPage = () => {
    const [users, setUsers] = useState<Agent[]>([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingUser, setEditingUser] = useState<Agent | null>(null);
    const [newUser, setNewUser] = useState({
      name: '',
      email: '',
      role: 'agent' as 'admin' | 'coordinator' | 'agent' | 'lead_supplier'
    });

    // Load users
    useEffect(() => {
      setUsers(dbAgents);
    }, [dbAgents]);

    // Create user function
    const createUser = async () => {
      try {
        const { data, error } = await supabase
          .from('agents')
          .insert([{
            name: newUser.name,
            email: newUser.email,
            role: newUser.role
          }])
          .select()
          .single();

        if (error) throw error;

        setUsers(prev => [...prev, data]);
        setNewUser({ name: '', email: '', role: 'agent' });
        setShowCreateModal(false);
        fetchData(); // Refresh data
      } catch (error) {
        console.error('Error creating user:', error);
        alert('שגיאה ביצירת משתמש');
      }
    };

    // Update user function
    const updateUser = async (userId: string, updates: Partial<Agent>) => {
      try {
        const { error } = await supabase
          .from('agents')
          .update(updates)
          .eq('id', userId);

        if (error) throw error;

        setUsers(prev => prev.map(user =>
          user.id === userId ? { ...user, ...updates } : user
        ));
        setEditingUser(null);
        fetchData(); // Refresh data
      } catch (error) {
        console.error('Error updating user:', error);
        alert('שגיאה בעדכון משתמש');
      }
    };

    // Delete user function
    const deleteUser = async (userId: string) => {
      if (!confirm('האם אתה בטוח שברצונך למחוק משתמש זה?')) return;

      try {
        const { error } = await supabase
          .from('agents')
          .delete()
          .eq('id', userId);

        if (error) throw error;

        setUsers(prev => prev.filter(user => user.id !== userId));
        fetchData(); // Refresh data
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('שגיאה במחיקת משתמש');
      }
    };

    const roleLabels = {
      admin: 'מנהל',
      coordinator: 'מתאם',
      agent: 'סוכן',
      lead_supplier: 'ספק לידים'
    };

    const roleColors = {
      admin: 'bg-purple-100 text-purple-800',
      coordinator: 'bg-blue-100 text-blue-800',
      agent: 'bg-green-100 text-green-800',
      lead_supplier: 'bg-orange-100 text-orange-800'
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">ניהול משתמשים</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            + הוסף משתמש
          </button>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-right py-4 px-5 text-sm font-semibold text-slate-600">שם</th>
                  <th className="text-right py-4 px-5 text-sm font-semibold text-slate-600">אימייל</th>
                  <th className="text-right py-4 px-5 text-sm font-semibold text-slate-600">תפקיד</th>
                  <th className="text-right py-4 px-5 text-sm font-semibold text-slate-600">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-slate-200 to-slate-300 rounded-full flex items-center justify-center text-slate-600 font-medium">
                          {user.name.charAt(0)}
                        </div>
                        <span className="font-medium text-slate-900">{user.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <span className="text-slate-700">{user.email}</span>
                    </td>
                    <td className="py-4 px-5">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${roleColors[user.role as keyof typeof roleColors]}`}>
                        {roleLabels[user.role as keyof typeof roleLabels]}
                      </span>
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditingUser(user)}
                          className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                        >
                          ערוך
                        </button>
                        <button
                          onClick={() => deleteUser(user.id)}
                          className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                        >
                          מחק
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create User Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowCreateModal(false)}>
            <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-xl font-bold text-slate-900 mb-4">הוסף משתמש חדש</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">שם</label>
                  <input
                    type="text"
                    value={newUser.name}
                    onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                    placeholder="הכנס שם משתמש"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">אימייל</label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                    placeholder="user@winfinance.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">תפקיד</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                  >
                    <option value="agent">סוכן</option>
                    <option value="coordinator">מתאם</option>
                    <option value="admin">מנהל</option>
                    <option value="lead_supplier">ספק לידים</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={createUser}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  צור משתמש
                </button>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
                >
                  ביטול
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {editingUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setEditingUser(null)}>
            <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-xl font-bold text-slate-900 mb-4">ערוך משתמש</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">שם</label>
                  <input
                    type="text"
                    value={editingUser.name}
                    onChange={(e) => setEditingUser(prev => prev ? { ...prev, name: e.target.value } : null)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">אימייל</label>
                  <input
                    type="email"
                    value={editingUser.email}
                    onChange={(e) => setEditingUser(prev => prev ? { ...prev, email: e.target.value } : null)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">תפקיד</label>
                  <select
                    value={editingUser.role}
                    onChange={(e) => setEditingUser(prev => prev ? { ...prev, role: e.target.value as any } : null)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                  >
                    <option value="agent">סוכן</option>
                    <option value="coordinator">מתאם</option>
                    <option value="admin">מנהל</option>
                    <option value="lead_supplier">ספק לידים</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => updateUser(editingUser.id, editingUser)}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  עדכן
                </button>
                <button
                  onClick={() => setEditingUser(null)}
                  className="flex-1 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
                >
                  ביטול
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-white" dir="rtl">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
            <div className="flex items-center gap-3 sm:gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <span className="text-white text-xl font-bold">W</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-800">WinFinance</h1>
                </div>
              </div>

              {/* Navigation - Hidden for agents */}
              {user?.role !== 'agent' && (
                <nav className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 sm:mr-6">
                  {navItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setCurrentPage(item.id)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                        currentPage === item.id
                          ? 'bg-white shadow-sm text-slate-800'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      <span>{item.icon}</span>
                      {item.label}
                    </button>
                  ))}
                </nav>
              )}
            </div>

            {/* User Info & Logout */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium text-slate-800">{user?.name}</p>
                <p className="text-xs text-slate-500">
                  {user?.role === 'admin' ? 'מנהל' :
                   user?.role === 'coordinator' ? 'מתאמת' : 'סוכן'}
                </p>
              </div>
              <button
                onClick={logout}
                className="px-3 py-2 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all border border-red-300 hover:border-red-400"
                title="התנתק"
              >
                🚪 יציאה
              </button>
            </div>

          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {user?.role === 'agent' ? (
          <LeadsPage />
        ) : (
          <>
            {currentPage === 'home' && <HomePage />}
            {currentPage === 'leads' && <LeadsPage />}
            {currentPage === 'agents' && <AgentsPage />}
            {currentPage === 'users' && <UsersPage />}
            {currentPage === 'email-settings' && <EmailSettingsPage />}
          </>
        )}
      </main>
    </div>
  );
}