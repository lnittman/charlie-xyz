'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Save, AlertCircle, ChevronDown, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DropdownMenu } from './dropdown-menu'

interface Model {
  id: string
  name: string
  provider: string
  description?: string
}

export default function SettingsClient() {
  const [settings, setSettings] = useState({
    autoAnalyze: true,
    refreshInterval: 30,
    maxConcurrentCharlies: 3,
    notifyOnBlocked: true,
    notifyOnCompleted: false,
    aiProvider: 'anthropic',
    aiModel: 'claude-3-5-sonnet-20241022',
    webhookUrl: '',
    apiKey: ''
  })
  
  const [saved, setSaved] = useState(false)
  const [models, setModels] = useState<Model[]>([])
  const [loadingModels, setLoadingModels] = useState(false)
  
  useEffect(() => {
    // Load settings from localStorage on mount
    const saved = localStorage.getItem('charlie-settings')
    if (saved) {
      setSettings(JSON.parse(saved))
    }
  }, [])

  useEffect(() => {
    // Load models when provider changes
    loadModels(settings.aiProvider)
  }, [settings.aiProvider])

  const loadModels = async (provider: string) => {
    setLoadingModels(true)
    try {
      const response = await fetch(`/api/models/${provider}`)
      if (response.ok) {
        const data = await response.json()
        setModels(data.models || [])
        // If current model is not in the list, select the first one
        if (data.models?.length > 0 && !data.models.find((m: Model) => m.id === settings.aiModel)) {
          setSettings(prev => ({ ...prev, aiModel: data.models[0].id }))
        }
      } else {
        console.error('Failed to load models')
        // Fallback to static list
        setModels(getStaticModels(provider))
      }
    } catch (error) {
      console.error('Error loading models:', error)
      // Fallback to static list
      setModels(getStaticModels(provider))
    } finally {
      setLoadingModels(false)
    }
  }

  const getStaticModels = (provider: string): Model[] => {
    switch (provider) {
      case 'anthropic':
        return [
          { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', provider: 'anthropic' },
          { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', provider: 'anthropic' },
          { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', provider: 'anthropic' },
        ]
      case 'openai':
        return [
          { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai' },
          { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai' },
          { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'openai' },
          { id: 'o1-preview', name: 'O1 Preview', provider: 'openai' },
          { id: 'o1-mini', name: 'O1 Mini', provider: 'openai' },
        ]
      case 'google':
        return [
          { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash (Experimental)', provider: 'google' },
          { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'google' },
          { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', provider: 'google' },
        ]
      default:
        return []
    }
  }

  const handleSave = () => {
    localStorage.setItem('charlie-settings', JSON.stringify(settings))
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="min-h-screen bg-[#010101] text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-[#010101]/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 max-w-7xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="p-2 hover:bg-gray-900 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-400" />
              </Link>
              <div className="h-6 w-px bg-gray-700" />
              <h1 className="text-lg font-mono text-white">
                Settings
              </h1>
            </div>
            
            <button
              onClick={handleSave}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg transition-all',
                saved
                  ? 'bg-[#ABF716]/20 text-[#ABF716] border border-[#ABF716]/30'
                  : 'bg-[#ABF716] hover:bg-[#9ae614] text-black font-medium'
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
        <div className="flex items-start gap-3 p-4 bg-black border border-gray-800 rounded-lg mb-6">
          <AlertCircle className="w-5 h-5 text-[#ABF716] mt-0.5" />
          <div>
            <p className="text-sm font-medium text-white">
              Demo Mode
            </p>
            <p className="text-sm text-gray-400 mt-1">
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
                      'absolute top-1 w-4 h-4 bg-black rounded-full transition-transform',
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
                  className="mt-1 w-full px-3 py-2 bg-gray-900 border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ABF716] focus:border-transparent font-mono"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-white">
                  Max concurrent Charlies
                </label>
                <select
                  value={settings.maxConcurrentCharlies}
                  onChange={(e) => setSettings({...settings, maxConcurrentCharlies: parseInt(e.target.value)})}
                  className="mt-1 w-full px-3 py-2 bg-gray-900 border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ABF716] focus:border-transparent font-mono"
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
                      'absolute top-1 w-4 h-4 bg-black rounded-full transition-transform',
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
                      'absolute top-1 w-4 h-4 bg-black rounded-full transition-transform',
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
                <DropdownMenu
                  trigger={
                    <button className="mt-1 w-full px-3 py-2 bg-gray-900 border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ABF716] focus:border-transparent flex items-center justify-between">
                      <span>{settings.aiProvider === 'anthropic' ? 'Anthropic' : settings.aiProvider === 'openai' ? 'OpenAI' : settings.aiProvider === 'google' ? 'Google' : 'Custom'}</span>
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </button>
                  }
                  className="w-full"
                >
                  <button
                    onClick={() => setSettings({...settings, aiProvider: 'anthropic'})}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-800 transition-colors"
                  >
                    Anthropic
                  </button>
                  <button
                    onClick={() => setSettings({...settings, aiProvider: 'openai'})}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-800 transition-colors"
                  >
                    OpenAI
                  </button>
                  <button
                    onClick={() => setSettings({...settings, aiProvider: 'google'})}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-800 transition-colors"
                  >
                    Google
                  </button>
                  <button
                    onClick={() => setSettings({...settings, aiProvider: 'custom'})}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-800 transition-colors"
                  >
                    Custom
                  </button>
                </DropdownMenu>
              </div>
              
              <div>
                <label className="text-sm font-medium text-white">
                  Model
                </label>
                <DropdownMenu
                  trigger={
                    <button className="mt-1 w-full px-3 py-2 bg-gray-900 border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ABF716] focus:border-transparent flex items-center justify-between">
                      {loadingModels ? (
                        <>
                          <span className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Loading models...
                          </span>
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        </>
                      ) : (
                        <>
                          <span className="font-mono text-sm">
                            {models.find(m => m.id === settings.aiModel)?.name || settings.aiModel}
                          </span>
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        </>
                      )}
                    </button>
                  }
                  className="w-full max-h-60 overflow-y-auto"
                >
                  {loadingModels ? (
                    <div className="px-3 py-2 text-sm text-gray-400">
                      Loading models...
                    </div>
                  ) : models.length > 0 ? (
                    models.map((model) => (
                      <button
                        key={model.id}
                        onClick={() => setSettings({...settings, aiModel: model.id})}
                        className={cn(
                          "w-full px-3 py-2 text-left text-sm hover:bg-gray-800 transition-colors",
                          settings.aiModel === model.id && "bg-gray-800"
                        )}
                      >
                        <div className="font-mono">{model.name}</div>
                        {model.description && (
                          <div className="text-xs text-gray-500 mt-0.5">{model.description}</div>
                        )}
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-sm text-gray-400">
                      No models available
                    </div>
                  )}
                </DropdownMenu>
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
                  className="mt-1 w-full px-3 py-2 bg-gray-900 border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ABF716] focus:border-transparent font-mono"
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
                className="mt-1 w-full px-3 py-2 bg-gray-900 border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ABF716] focus:border-transparent font-mono"
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