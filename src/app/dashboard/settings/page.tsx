'use client';

import { useState, useEffect } from 'react';

interface Settings {
  systemPrompt: string;
  isGloballyActive: boolean;
  maxHistoryLength: number;
  model: string;
}

export default function BotSettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const data = await res.json();
          setSettings(data);
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setSaving(true);
    setSaved(false);

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      console.error('Error updating settings:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-[#a0a0a0] font-medium tracking-widest uppercase">Fetching configuration</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-8 overflow-y-auto max-w-4xl w-full mx-auto">
      <header className="mb-10">
        <h1 className="text-2xl font-bold tracking-tight text-white">Bot Configuration</h1>
        <p className="text-xs text-[#a0a0a0] mt-1">Configure global AI behavior, system prompt guidelines, and models.</p>
      </header>

      {settings && (
        <form onSubmit={handleSave} className="space-y-8">
          {/* Settings Section */}
          <div className="oled-card p-6 space-y-6">
            <h3 className="text-sm font-semibold tracking-wider text-white uppercase border-b border-[#1a1a1a] pb-4">
              Core Status Settings
            </h3>
            
            {/* Global Activation Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-white">Global Auto-Reply</span>
                <span className="text-[11px] text-[#a0a0a0]">Activate or pause AI auto-replies across all incoming DMs.</span>
              </div>
              <button
                type="button"
                onClick={() => setSettings({ ...settings, isGloballyActive: !settings.isGloballyActive })}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  settings.isGloballyActive ? 'bg-white' : 'bg-[#1c1c1c]'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-black shadow ring-0 transition duration-200 ease-in-out ${
                    settings.isGloballyActive ? 'translate-x-5 bg-black' : 'translate-x-0 bg-white'
                  }`}
                />
              </button>
            </div>
            
            {/* Model Selection */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-white">LLM Provider Model (via OpenRouter)</label>
              <span className="text-[11px] text-[#a0a0a0]">Specify the target model ID exactly as documented in OpenRouter.</span>
              <select
                value={settings.model}
                onChange={(e) => setSettings({ ...settings, model: e.target.value })}
                className="w-full bg-black border border-[#1a1a1a] text-white text-xs rounded-lg p-3 font-mono focus:border-[#2c2c2c] focus:outline-none"
              >
                <option value="google/gemini-2.0-flash-001">google/gemini-2.0-flash-001 (Recommended)</option>
                <option value="openai/gpt-4o-mini">openai/gpt-4o-mini</option>
                <option value="anthropic/claude-3-haiku">anthropic/claude-3-haiku</option>
                <option value="meta-llama/llama-3-8b-instruct">meta-llama/llama-3-8b-instruct</option>
              </select>
            </div>

            {/* Max History Length */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-white">Max Memory History Context</label>
              <span className="text-[11px] text-[#a0a0a0]">Maximum number of historical messages to feed back into the AI for chat history.</span>
              <input
                type="number"
                min="1"
                max="50"
                value={settings.maxHistoryLength}
                onChange={(e) => setSettings({ ...settings, maxHistoryLength: Number(e.target.value) })}
                className="w-full bg-black border border-[#1a1a1a] text-white text-xs rounded-lg p-3 font-mono focus:border-[#2c2c2c] focus:outline-none"
              />
            </div>
          </div>

          {/* System Prompt Settings */}
          <div className="oled-card p-6 space-y-6">
            <h3 className="text-sm font-semibold tracking-wider text-white uppercase border-b border-[#1a1a1a] pb-4">
              Agent Persona Prompt
            </h3>
            
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-white font-mono">System Prompt Instructions</label>
              <span className="text-[11px] text-[#a0a0a0]">
                Write rules for response behavior. Instruct the bot to be concise, friendly, and avoid markdown.
              </span>
              <textarea
                rows={8}
                value={settings.systemPrompt}
                onChange={(e) => setSettings({ ...settings, systemPrompt: e.target.value })}
                className="w-full bg-black border border-[#1a1a1a] text-white text-xs rounded-lg p-4 font-mono focus:border-[#2c2c2c] focus:outline-none leading-relaxed"
                placeholder="Write system prompts guidelines here..."
              />
            </div>
          </div>

          {/* Controls */}
          <div className="flex justify-between items-center bg-black">
            <div className="text-xs font-semibold">
              {saved && <span className="text-white transition-opacity duration-200">✅ Changes saved to database</span>}
            </div>
            
            <button
              type="submit"
              disabled={saving}
              className="btn-stark px-6 py-3 text-xs tracking-wider uppercase disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
