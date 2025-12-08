'use client'

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Lead, Agent } from '@/lib/database.types';
import LeadEntryForm from './LeadEntryForm';

export default function FullDashboard() {
  const [currentPage, setCurrentPage] = useState('home');
  const [activeAgent, setActiveAgent] = useState('all');
  const [activeStatus, setActiveStatus] = useState('all');
  const [activeSource, setActiveSource] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLead, setSelectedLead] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('month');

  // Database data
  const [dbLeads, setDbLeads] = useState<Lead[]>([]);
  const [dbAgents, setDbAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  const timeRanges = [
    { id: 'week', label: 'שבוע' },
    { id: 'month', label: 'חודש' },
    { id: '3months', label: '3 חודשים' },
    { id: 'year', label: 'שנה' },
  ];

  // Map database agents to UI format
  const agents = dbAgents
    .filter(a => a.role === 'agent')
    .map((agent, index) => {
      const colors = [
        'from-blue-500 to-blue-600',
        'from-rose-500 to-rose-600',
        'from-amber-500 to-amber-600',
        'from-emerald-500 to-emerald-600',
        'from-violet-500 to-violet-600'
      ];

      const agentLeads = dbLeads.filter(l => l.assigned_agent_id === agent.id);

      return {
        id: agent.id,
        name: agent.name,
        avatar: agent.name === 'עדי' ? '👩‍💼' : '👨‍💼',
        color: colors[index % colors.length],
        stats: {
          matched: agentLeads.filter(l => l.status === 'תואם').length,
          notInterested: agentLeads.filter(l => l.status === 'לקוח לא רצה').length,
          closed: agentLeads.filter(l => l.status === 'עסקה נסגרה').length,
          notMatched: agentLeads.filter(l => l.status === 'לא תואם').length
        }
      };
    });

  const sources = [
    { id: 'Email', label: 'Email', icon: '📧', color: 'bg-blue-500', lightBg: 'bg-blue-50', text: 'text-blue-700' },
    { id: 'Google Sheet', label: 'Google Sheets', icon: '📊', color: 'bg-emerald-500', lightBg: 'bg-emerald-50', text: 'text-emerald-700' },
    { id: 'Manual', label: 'Manual', icon: '✏️', color: 'bg-purple-500', lightBg: 'bg-purple-50', text: 'text-purple-700' },
  ];

  const statuses = [
    { id: 'תואם', label: 'תואם', color: 'bg-emerald-500', lightBg: 'bg-emerald-50', text: 'text-emerald-700' },
    { id: 'לא תואם', label: 'לא תואם', color: 'bg-amber-500', lightBg: 'bg-amber-50', text: 'text-amber-700' },
    { id: 'לקוח לא רצה', label: 'לקוח לא רצה', color: 'bg-red-500', lightBg: 'bg-red-50', text: 'text-red-700' },
    { id: 'עסקה נסגרה', label: 'עסקה נסגרה', color: 'bg-blue-500', lightBg: 'bg-blue-50', text: 'text-blue-700' },
  ];

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

  useEffect(() => {
    fetchData();
  }, []);

  const filteredLeads = dbLeads.filter(lead => {
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

  // Analytics calculations
  const totalLeads = dbLeads.length;
  const matchedLeads = dbLeads.filter(l => l.status === 'תואם').length;
  const closedLeads = dbLeads.filter(l => l.status === 'עסקה נסגרה').length;
  const failedLeads = dbLeads.filter(l => l.status === 'לא תואם' || l.status === 'לקוח לא רצה').length;
  const pendingReview = dbLeads.filter(l => l.relevance_status === 'ממתין לבדיקה').length;
  const emailLeads = dbLeads.filter(l => l.source === 'Email').length;
  const sheetsLeads = dbLeads.filter(l => l.source === 'Google Sheet').length;

  const navItems = [
    { id: 'home', label: 'דף הבית', icon: '🏠' },
    { id: 'leads', label: 'לידים', icon: '📋' },
    { id: 'agents', label: 'סוכנים', icon: '👥' },
    { id: 'coordinator', label: 'מתאמת', icon: '👩‍💼' },
  ];

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
      <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 rounded-3xl p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative z-10">
          <h2 className="text-3xl font-bold mb-2">בוקר טוב! 👋</h2>
          <p className="text-blue-100 text-lg">הנה סיכום הפעילות שלך</p>
        </div>
        <div className="relative z-10 mt-6 flex gap-6">
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-6 py-4">
            <p className="text-blue-100 text-sm">לידים ממתינים לבדיקה</p>
            <p className="text-4xl font-bold">{pendingReview}</p>
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
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
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

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
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

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
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

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
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

      {/* Recent Leads */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <span>🕐</span> לידים אחרונים
          </h3>
          <button
            onClick={() => setCurrentPage('leads')}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            צפה בהכל ←
          </button>
        </div>

        {dbLeads.length === 0 ? (
          <p className="text-center text-gray-500 py-8">אין לידים במערכת עדיין</p>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {dbLeads.slice(0, 6).map((lead) => {
              const status = getStatusInfo(lead.status);
              const source = getSourceInfo(lead.source);
              const agent = getAgentInfo(lead.assigned_agent_id);
              return (
                <div key={lead.id} className="p-4 rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-slate-200 to-slate-300 rounded-full flex items-center justify-center text-slate-600 font-medium">
                        {lead.lead_name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{lead.lead_name}</p>
                        <p className="text-xs text-slate-500">{lead.phone}</p>
                      </div>
                    </div>
                    {source && <span className="text-lg" title={source.label}>{source.icon}</span>}
                  </div>
                  <div className="flex items-center justify-between">
                    {status ? (
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.lightBg} ${status.text}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${status.color}`} />
                        {status.label}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">ללא סטטוס</span>
                    )}
                    {agent && (
                      <span className="text-xs text-slate-500">{agent.name}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  // Coordinator Page Component (NEW!)
  const CoordinatorPage = () => {
    const newLeads = dbLeads.filter(l => l.relevance_status === 'ממתין לבדיקה');
    const readyToAssign = dbLeads.filter(l => l.relevance_status === 'רלוונטי' && !l.assigned_agent_id);

    const updateRelevanceStatus = async (leadId: string, status: 'רלוונטי' | 'לא רלוונטי') => {
      const { error } = await supabase
        .from('leads')
        .update({ relevance_status: status, updated_at: new Date().toISOString() })
        .eq('id', leadId);

      if (!error) {
        setDbLeads(prev => prev.map(lead =>
          lead.id === leadId ? { ...lead, relevance_status: status } : lead
        ));
      }
    };

    const assignAgent = async (leadId: string, agentId: string) => {
      const { error } = await supabase
        .from('leads')
        .update({ assigned_agent_id: agentId, updated_at: new Date().toISOString() })
        .eq('id', leadId);

      if (!error) {
        setDbLeads(prev => prev.map(lead =>
          lead.id === leadId ? { ...lead, assigned_agent_id: agentId } : lead
        ));
      }
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-800">מתאמת - לאה</h2>
          <div className="flex gap-4">
            <div className="bg-amber-100 px-4 py-2 rounded-xl">
              <span className="text-amber-700 font-medium">{newLeads.length} ממתינים לבדיקה</span>
            </div>
            <div className="bg-emerald-100 px-4 py-2 rounded-xl">
              <span className="text-emerald-700 font-medium">{readyToAssign.length} מוכנים לשיוך</span>
            </div>
          </div>
        </div>

        {/* New Leads Review */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span>🔍</span> לידים חדשים לבדיקה
          </h3>

          {newLeads.length === 0 ? (
            <p className="text-slate-500 text-center py-8">אין לידים חדשים לבדיקה</p>
          ) : (
            <div className="space-y-3">
              {newLeads.map((lead) => {
                const source = getSourceInfo(lead.source);
                return (
                  <div key={lead.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-slate-200 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-slate-200 to-slate-300 rounded-full flex items-center justify-center text-slate-600 font-medium">
                        {lead.lead_name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{lead.lead_name}</p>
                        <p className="text-sm text-slate-500">{lead.phone}</p>
                      </div>
                      {source && (
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${source.lightBg} ${source.text}`}>
                          {source.icon} {source.label}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateRelevanceStatus(lead.id, 'רלוונטי')}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-all"
                      >
                        רלוונטי ✓
                      </button>
                      <button
                        onClick={() => updateRelevanceStatus(lead.id, 'לא רלוונטי')}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-all"
                      >
                        לא רלוונטי ✗
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Ready to Assign */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span>👥</span> מוכנים לשיוך לסוכנים
          </h3>

          {readyToAssign.length === 0 ? (
            <p className="text-slate-500 text-center py-8">אין לידים מוכנים לשיוך</p>
          ) : (
            <div className="space-y-3">
              {readyToAssign.map((lead) => {
                const source = getSourceInfo(lead.source);
                return (
                  <div key={lead.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-slate-200 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-emerald-200 to-emerald-300 rounded-full flex items-center justify-center text-emerald-600 font-medium">
                        {lead.lead_name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{lead.lead_name}</p>
                        <p className="text-sm text-slate-500">{lead.phone}</p>
                      </div>
                      {source && (
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${source.lightBg} ${source.text}`}>
                          {source.icon} {source.label}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <select
                        onChange={(e) => e.target.value && assignAgent(lead.id, e.target.value)}
                        defaultValue=""
                        className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      >
                        <option value="">בחר סוכן</option>
                        {agents.map((agent) => (
                          <option key={agent.id} value={agent.id}>
                            {agent.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Leads Page Component
  const LeadsPage = () => (
    <div className="flex gap-6">
      {/* Main Content */}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-slate-800">לידים</h2>
        </div>

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
                className="w-full pr-10 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>

            {/* Source Filter */}
            <div className="flex items-center gap-2 bg-slate-50 rounded-xl p-1">
              <button
                onClick={() => setActiveSource('all')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeSource === 'all' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                כל המקורות
              </button>
              {sources.map((source) => (
                <button
                  key={source.id}
                  onClick={() => setActiveSource(source.id)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                    activeSource === source.id ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {source.icon}
                  {source.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Leads Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-right py-4 px-5 text-sm font-semibold text-slate-600">שם לקוח</th>
                  <th className="text-right py-4 px-5 text-sm font-semibold text-slate-600">טלפון</th>
                  <th className="text-right py-4 px-5 text-sm font-semibold text-slate-600">מקור</th>
                  <th className="text-right py-4 px-5 text-sm font-semibold text-slate-600">רלוונטיות</th>
                  <th className="text-right py-4 px-5 text-sm font-semibold text-slate-600">סטטוס</th>
                  <th className="text-right py-4 px-5 text-sm font-semibold text-slate-600">סוכן</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-500">
                      אין לידים להצגה
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead) => {
                    const status = getStatusInfo(lead.status);
                    const source = getSourceInfo(lead.source);
                    const agent = getAgentInfo(lead.assigned_agent_id);
                    return (
                      <tr key={lead.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-slate-200 to-slate-300 rounded-full flex items-center justify-center text-slate-600 font-medium">
                              {lead.lead_name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium text-slate-800">{lead.lead_name}</p>
                              {lead.agent_notes && (
                                <p className="text-xs text-slate-400 truncate max-w-48">{lead.agent_notes}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-5">
                          <span className="text-slate-600 font-mono text-sm">{lead.phone}</span>
                        </td>
                        <td className="py-4 px-5">
                          {source && (
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${source.lightBg} ${source.text}`}>
                              {source.icon} {source.label}
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-5">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                            lead.relevance_status === 'ממתין לבדיקה' ? 'bg-yellow-100 text-yellow-800' :
                            lead.relevance_status === 'רלוונטי' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {lead.relevance_status}
                          </span>
                        </td>
                        <td className="py-4 px-5">
                          {status ? (
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${status.lightBg} ${status.text}`}>
                              <div className={`w-2 h-2 rounded-full ${status.color}`} />
                              {status.label}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-sm">—</span>
                          )}
                        </td>
                        <td className="py-4 px-5">
                          {agent ? (
                            <div className="flex items-center gap-2">
                              <div className={`w-8 h-8 bg-gradient-to-br ${agent.color} rounded-lg flex items-center justify-center text-white text-sm shadow-sm`}>
                                {agent.avatar}
                              </div>
                              <span className="text-slate-700 text-sm font-medium">{agent.name}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-sm">לא שויך</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
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

      <div className="grid grid-cols-2 gap-6">
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
                    <h3 className="text-xl font-bold text-slate-800">{agent.name}</h3>
                    <p className="text-slate-500">{total} לידים</p>
                  </div>
                </div>
                <div className="text-left">
                  <p className="text-3xl font-bold text-slate-800">{successRate}%</p>
                  <p className="text-xs text-emerald-600">אחוז הצלחה</p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 mb-4">
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-white" dir="rtl">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <span className="text-white text-xl">📋</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-800">ניהול לידים</h1>
                  <p className="text-slate-500 text-sm">סוכנות ביטוח פלג</p>
                </div>
              </div>

              {/* Navigation */}
              <nav className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 mr-6">
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
            </div>

            <div className="flex items-center gap-3">
              <button className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 font-medium transition-all flex items-center gap-2">
                <span>📤</span> ייצוא
              </button>
              <LeadEntryForm onLeadCreated={fetchData} />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {currentPage === 'home' && <HomePage />}
        {currentPage === 'leads' && <LeadsPage />}
        {currentPage === 'agents' && <AgentsPage />}
        {currentPage === 'coordinator' && <CoordinatorPage />}
      </main>
    </div>
  );
}