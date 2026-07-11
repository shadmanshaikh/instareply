'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Message {
  id: string;
  senderId: string;
  text: string;
  isFromBot: boolean;
  timestamp: string;
}

interface Conversation {
  id: string;
  participantId: string;
  isAutoReplyOn: boolean;
  updatedAt: string;
  messages: Message[];
}

interface Settings {
  systemPrompt: string;
  isGloballyActive: boolean;
  maxHistoryLength: number;
  model: string;
}

export default function DashboardOverview() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [convsRes, settingsRes] = await Promise.all([
          fetch('/api/conversations'),
          fetch('/api/settings'),
        ]);
        
        if (convsRes.ok && settingsRes.ok) {
          const convsData = await convsRes.json();
          const settingsData = await settingsRes.json();
          setConversations(convsData);
          setSettings(settingsData);
        }
      } catch (err) {
        console.error('Error loading dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const totalConversations = conversations.length;
  const activeAutoreplies = conversations.filter(c => c.isAutoReplyOn).length;
  const totalMessagesCount = conversations.reduce((acc, c) => acc + c.messages.length, 0);
  const latestActivity = conversations.length > 0 ? new Date(conversations[0].updatedAt).toLocaleString() : 'No recent activity';

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-[#a0a0a0] font-medium tracking-widest uppercase">Initializing Interface</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-8 overflow-y-auto">
      {/* Top Header */}
      <header className="mb-10">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Dashboard Overview</h1>
            <p className="text-xs text-[#a0a0a0] mt-1">Real-time status of your Instagram AI automation agent.</p>
          </div>
          <div className="flex items-center gap-3 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg px-4 py-2">
            <span className={settings?.isGloballyActive ? 'status-dot-active' : 'status-dot-inactive'} />
            <span className="text-xs font-semibold text-white tracking-wider uppercase">
              {settings?.isGloballyActive ? 'Auto-Reply Active' : 'Auto-Reply Paused'}
            </span>
          </div>
        </div>
      </header>

      {/* Grid Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <div className="oled-card p-6">
          <span className="text-[10px] uppercase tracking-wider text-[#a0a0a0] font-semibold">Active Chats</span>
          <h2 className="text-3xl font-bold mt-2 text-white">{totalConversations}</h2>
          <p className="text-[10px] text-[#525252] mt-1">Unique user threads</p>
        </div>

        <div className="oled-card p-6">
          <span className="text-[10px] uppercase tracking-wider text-[#a0a0a0] font-semibold">Auto-Reply Enabled</span>
          <h2 className="text-3xl font-bold mt-2 text-white">{activeAutoreplies}</h2>
          <p className="text-[10px] text-[#525252] mt-1">Threads with AI active</p>
        </div>

        <div className="oled-card p-6">
          <span className="text-[10px] uppercase tracking-wider text-[#a0a0a0] font-semibold">Processed Messages</span>
          <h2 className="text-3xl font-bold mt-2 text-white">{totalMessagesCount}</h2>
          <p className="text-[10px] text-[#525252] mt-1">Total database log events</p>
        </div>

        <div className="oled-card p-6">
          <span className="text-[10px] uppercase tracking-wider text-[#a0a0a0] font-semibold">Latest Activity</span>
          <h2 className="text-xs font-bold mt-4 text-white truncate">{latestActivity}</h2>
          <p className="text-[10px] text-[#525252] mt-1">Last webhook processed</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Active Configurations */}
        <div className="oled-card p-6 flex flex-col justify-between h-[300px]">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-semibold tracking-wider text-white uppercase">Agent Settings</h3>
              <Link href="/dashboard/settings" className="text-xs text-white hover:underline">Edit settings</Link>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-[#1a1a1a] pb-2">
                <span className="text-xs text-[#a0a0a0]">Current LLM Model</span>
                <span className="text-xs font-mono text-white">{settings?.model}</span>
              </div>
              <div className="flex justify-between items-center border-b border-[#1a1a1a] pb-2">
                <span className="text-xs text-[#a0a0a0]">Context Memory Length</span>
                <span className="text-xs font-mono text-white">{settings?.maxHistoryLength} messages</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-[#a0a0a0]">Active System Persona</span>
                <p className="text-xs text-white line-clamp-3 bg-black border border-[#1a1a1a] rounded p-2 mt-1 font-mono">
                  {settings?.systemPrompt}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Conversations */}
        <div className="oled-card p-6 flex flex-col h-[300px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-semibold tracking-wider text-white uppercase">Recent Direct Messages</h3>
            <Link href="/dashboard/conversations" className="text-xs text-white hover:underline">View all</Link>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3">
            {conversations.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <p className="text-xs text-[#525252]">No threads recorded. Send a test DM to start.</p>
              </div>
            ) : (
              conversations.slice(0, 4).map((c) => {
                const lastMsg = c.messages[0];
                return (
                  <Link 
                    key={c.id} 
                    href={`/dashboard/conversations/${c.id}`} 
                    className="flex justify-between items-center p-3 rounded-lg border border-[#1a1a1a] bg-black hover:border-[#2c2c2c] transition-all"
                  >
                    <div className="flex flex-col gap-1 min-w-0 flex-1">
                      <span className="text-xs font-semibold text-white truncate">User IGSID: {c.participantId}</span>
                      <p className="text-xs text-[#a0a0a0] truncate font-mono">
                        {lastMsg ? `${lastMsg.isFromBot ? 'Bot: ' : 'User: '}${lastMsg.text}` : 'No messages'}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 ml-4">
                      <span className="text-[9px] text-[#525252] font-mono">
                        {new Date(c.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className={`w-1.5 h-1.5 rounded-full ${c.isAutoReplyOn ? 'bg-white' : 'bg-[#404040]'}`} />
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
