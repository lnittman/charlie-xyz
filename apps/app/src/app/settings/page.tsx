'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Save, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    autoAnalyze: true,
    refreshInterval: 30,
    maxConcurrentCharlies: 3,
    notifyOnBlocked: true,
    notifyOnCompleted: false,
    aiProvider: 'anthropic',
    aiModel: 'claude-3-5-sonnet',
    webhookUrl: '',
    apiKey: ''
  })

  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    // In a real app, this would save to backend
    localStorage.setItem('charlie-settings', JSON.stringify(settings))
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="min-h-screen bg-[#010101] text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-[#010101]/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="p-2 hover:bg-gray-900 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-400" />
              </Link>
              
              <div className="flex items-center gap-3">
                <img 
                  src="https://www.charlielabs.ai/images/logo.svg" 
                  alt="Charlie" 
                  className="h-8 w-auto"
                />
                <div className="h-6 w-px bg-gray-700" />
                <h1 className="text-lg font-medium text-white">
                  Settings
                </h1>
              </div>
            </div>
            
            <button
              onClick={handleSave}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg transition-all',
                saved
                  ? 'bg-[#ABF716]/20 text-[#ABF716]'
                  : 'bg-[#ABF716] hover:bg-[#9BE516] text-black font-medium'
              )}
            >
              <Save className="w-4 h-4" />
              {saved ? 'Saved!' : 'Save Changes'}
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-6 max-w-4xl">
        {/* Notice */}
        <div className="flex items-start gap-3 p-4 bg-yellow-900/20 border border-yellow-800 rounded-lg mb-6">
          <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-200">
              Demo Mode
            </p>
            <p className="text-sm text-yellow-300 mt-1">
              This is a visual prototype. Settings are stored locally and don't affect actual Charlie operations.
            </p>
          </div>
        </div>

        {/* Settings Sections */}
        <div className="space-y-6">
          {/* General Settings */}
          <div className="bg-black border border-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-medium text-white mb-4">
              General
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">
                    Auto-analyze workflows
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Automatically analyze new workflows with AI
                  </p>
                </div>
                <button
                  onClick={() => setSettings({...settings, autoAnalyze: !settings.autoAnalyze})}
                  className={cn(
                    'relative w-11 h-6 rounded-full transition-colors',
                    settings.autoAnalyze
                      ? 'bg-[#ABF716]'
                      : 'bg-gray-700'
                  )}
                >
                  <div
                    className={cn(
                      'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform',
                      settings.autoAnalyze ? 'translate-x-6' : 'translate-x-1'
                    )}
                  />
                </button>
              </div>
              
              <div>
                <label className="text-sm font-medium text-white">
                  Refresh interval (seconds)
                </label>
                <input
                  type="number"
                  value={settings.refreshInterval}
                  onChange={(e) => setSettings({...settings, refreshInterval: parseInt(e.target.value)})}
                  className="mt-1 w-full px-3 py-2 bg-gray-900 border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ABF716] focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-white">
                  Max concurrent Charlies
                </label>
                <select
                  value={settings.maxConcurrentCharlies}
                  onChange={(e) => setSettings({...settings, maxConcurrentCharlies: parseInt(e.target.value)})}
                  className="mt-1 w-full px-3 py-2 bg-gray-900 border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ABF716] focus:border-transparent"
                >
                  {[1, 2, 3, 4, 5].map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-black border border-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-medium text-white mb-4">
              Notifications
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">
                    Notify when Charlie is blocked
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Get alerts when a Charlie instance encounters a blocker
                  </p>
                </div>
                <button
                  onClick={() => setSettings({...settings, notifyOnBlocked: !settings.notifyOnBlocked})}
                  className={cn(
                    'relative w-11 h-6 rounded-full transition-colors',
                    settings.notifyOnBlocked
                      ? 'bg-[#ABF716]'
                      : 'bg-gray-700'
                  )}
                >
                  <div
                    className={cn(
                      'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform',
                      settings.notifyOnBlocked ? 'translate-x-6' : 'translate-x-1'
                    )}
                  />
                </button>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">
                    Notify on completion
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Get alerts when a Charlie completes a workflow
                  </p>
                </div>
                <button
                  onClick={() => setSettings({...settings, notifyOnCompleted: !settings.notifyOnCompleted})}
                  className={cn(
                    'relative w-11 h-6 rounded-full transition-colors',
                    settings.notifyOnCompleted
                      ? 'bg-[#ABF716]'
                      : 'bg-gray-700'
                  )}
                >
                  <div
                    className={cn(
                      'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform',
                      settings.notifyOnCompleted ? 'translate-x-6' : 'translate-x-1'
                    )}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* AI Configuration */}
          <div className="bg-black border border-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-medium text-white mb-4">
              AI Configuration
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-white">
                  Provider
                </label>
                <select
                  value={settings.aiProvider}
                  onChange={(e) => setSettings({...settings, aiProvider: e.target.value})}
                  className="mt-1 w-full px-3 py-2 bg-gray-900 border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ABF716] focus:border-transparent"
                >
                  <option value="anthropic">Anthropic</option>
                  <option value="openai">OpenAI</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-white">
                  Model
                </label>
                <select
                  value={settings.aiModel}
                  onChange={(e) => setSettings({...settings, aiModel: e.target.value})}
                  className="mt-1 w-full px-3 py-2 bg-gray-900 border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ABF716] focus:border-transparent"
                >
                  <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
                  <option value="claude-3-opus">Claude 3 Opus</option>
                  <option value="gpt-4-turbo">GPT-4 Turbo</option>
                  <option value="gpt-4">GPT-4</option>
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-white">
                  API Key
                </label>
                <input
                  type="password"
                  value={settings.apiKey}
                  onChange={(e) => setSettings({...settings, apiKey: e.target.value})}
                  placeholder="sk-..."
                  className="mt-1 w-full px-3 py-2 bg-gray-900 border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ABF716] focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Webhooks */}
          <div className="bg-black border border-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-medium text-white mb-4">
              Webhooks
            </h2>
            
            <div>
              <label className="text-sm font-medium text-white">
                Webhook URL
              </label>
              <input
                type="url"
                value={settings.webhookUrl}
                onChange={(e) => setSettings({...settings, webhookUrl: e.target.value})}
                placeholder="https://your-domain.com/webhook"
                className="mt-1 w-full px-3 py-2 bg-gray-900 border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ABF716] focus:border-transparent"
              />
              <p className="text-xs text-gray-400 mt-2">
                Receive POST requests when Charlie events occur
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}