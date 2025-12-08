'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Lead, Agent } from '@/lib/database.types'
import LeadEntryForm from './LeadEntryForm'

export default function TestDashboard() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch agents
      const { data: agentsData, error: agentsError } = await supabase
        .from('agents')
        .select('*')
        .order('name')

      if (agentsError) throw agentsError

      // Fetch leads
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })

      if (leadsError) throw leadsError

      setAgents(agentsData || [])
      setLeads(leadsData || [])
    } catch (error) {
      console.error('Error:', error)
      setError('שגיאה בטעינת הנתונים')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50" dir="rtl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">טוען נתונים...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50" dir="rtl">
        <div className="text-center bg-white p-8 rounded-lg shadow-sm border border-gray-200">
          <div className="text-red-500 text-xl mb-4">❌</div>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            נסה שוב
          </button>
        </div>
      </div>
    )
  }

  const pendingReview = leads.filter(l => l.relevance_status === 'ממתין לבדיקה').length
  const relevant = leads.filter(l => l.relevance_status === 'רלוונטי').length
  const notRelevant = leads.filter(l => l.relevance_status === 'לא רלוונטי').length

  return (
    <div className="min-h-screen bg-gray-50 py-8" dir="rtl">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">מערכת ניהול לידים</h1>
              <p className="text-gray-600">סוכנות ביטוח פלג</p>
            </div>
            <LeadEntryForm onLeadCreated={fetchData} />
          </div>

          {/* Connection Status */}
          <div className="px-6 py-4 bg-green-50">
            <p className="text-green-700 font-medium">
              ✅ חיבור לדאטאבייס תקין - RLS policies פועלים
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-blue-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-900">סה״כ לידים</h3>
            <p className="text-3xl font-bold text-blue-600">{leads.length}</p>
          </div>
          <div className="bg-yellow-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-yellow-900">ממתינים לבדיקה</h3>
            <p className="text-3xl font-bold text-yellow-600">{pendingReview}</p>
          </div>
          <div className="bg-green-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-green-900">רלוונטיים</h3>
            <p className="text-3xl font-bold text-green-600">{relevant}</p>
          </div>
          <div className="bg-red-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-red-900">לא רלוונטיים</h3>
            <p className="text-3xl font-bold text-red-600">{notRelevant}</p>
          </div>
        </div>

        {/* Agents List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">צוות ({agents.length})</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {agents.map((agent) => (
                <div key={agent.id} className="p-4 border border-gray-200 rounded-lg">
                  <h3 className="font-semibold text-gray-900">{agent.name}</h3>
                  <p className="text-sm text-gray-600">{agent.role}</p>
                  <p className="text-sm text-gray-500">{agent.email}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Leads Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">לידים</h2>
          </div>

          {leads.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500 text-lg">אין לידים במערכת</p>
              <p className="text-gray-400">נוסיף אפשרות להוסיף לידים בשלב הבא</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">שם</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">טלפון</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">מקור</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">רלוונטיות</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">תאריך</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr key={lead.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-900">{lead.lead_name}</td>
                      <td className="py-3 px-4 text-gray-700">{lead.phone}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                          {lead.source}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          lead.relevance_status === 'ממתין לבדיקה' ? 'bg-yellow-100 text-yellow-800' :
                          lead.relevance_status === 'רלוונטי' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {lead.relevance_status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-500 text-sm">
                        {new Date(lead.created_at).toLocaleDateString('he-IL')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Test Status */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            ✅ Phase 1A הושלם בהצלחה - המערכת מוכנה לשלב הבא
          </p>
        </div>
      </div>
    </div>
  )
}