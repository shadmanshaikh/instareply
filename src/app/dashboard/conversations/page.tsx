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

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadConversations() {
      try {
        const res = await fetch('/api/conversations');
        if (res.ok) {
          const data = await res.json();
          setConversations(data);
        }
      } catch (err) {
        console.error('Error loading conversations:', err);
      } finally {
        setLoading(false);
      }
    }
    loadConversations();
  }, []);

  const handleToggleAutoReply = async (id: string, currentStatus: boolean) => {
    const updatedStatus = !currentStatus;
    
    // Optimistic UI update
    setConversations(prev =>
      prev.map(c => (c.id === id ? { ...c, isAutoReplyOn: updatedStatus } : c))
    );

    try {
      const res = await fetch(`/api/conversations/${id}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAutoReplyOn: updatedStatus }),
      });
      if (!res.ok) {
        // Rollback on failure
        setConversations(prev =>
          prev.map(c => (c.id === id ? { ...c, isAutoReplyOn: currentStatus } : c))
        );
        console.error('Failed to toggle auto reply on database.');
      }
    } catch (err) {
      // Rollback on failure
      setConversations(prev =>
        prev.map(c => (c.id === id ? { ...c, isAutoReplyOn: currentStatus } : c))
      );
      console.error('Error toggling auto-reply:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-[#a0a0a0] font-medium tracking-widest uppercase">Retrieving Threads</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-8 overflow-y-auto">
      <header className="mb-10">
        <h1 className="text-2xl font-bold tracking-tight text-white">Direct Message Conversations</h1>
        <p className="text-xs text-[#a0a0a0] mt-1">Manage and audit active chat logs and individual thread toggles.</p>
      </header>

      <div className="oled-card overflow-hidden">
        <div className="min-w-full divide-y divide-[#1a1a1a]">
          <div className="bg-[#050505] p-4 grid grid-cols-12 text-left text-[10px] font-bold text-[#a0a0a0] uppercase tracking-wider">
            <div className="col-span-4">Instagram ID (IGSID)</div>
            <div className="col-span-4">Last Message preview</div>
            <div className="col-span-2">Updated At</div>
            <div className="col-span-1 text-center">AI Reply</div>
            <div className="col-span-1 text-right">Action</div>
          </div>
          
          <div className="divide-y divide-[#1a1a1a] bg-black">
            {conversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#525252]">
                No direct messages have been recorded yet.
              </div>
            ) : (
              conversations.map((c) => {
                const lastMsg = c.messages[0];
                return (
                  <div key={c.id} className="p-4 grid grid-cols-12 items-center hover:bg-[#050505] transition-all">
                    {/* Participant Details */}
                    <div className="col-span-4 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full border border-[#1a1a1a] flex items-center justify-center bg-[#0a0a0a]">
                        <span className="text-[10px] text-white">IG</span>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-semibold text-white truncate">{c.participantId}</span>
                        <span className="text-[9px] text-[#525252] font-mono truncate">ID: {c.id.slice(0, 8)}...</span>
                      </div>
                    </div>

                    {/* Last message preview */}
                    <div className="col-span-4 pr-4">
                      <p className="text-xs text-[#a0a0a0] truncate font-mono">
                        {lastMsg ? (
                          <>
                            <span className="text-white font-medium">{lastMsg.isFromBot ? 'Bot: ' : 'User: '}</span>
                            {lastMsg.text}
                          </>
                        ) : (
                          <span className="text-[#525252] italic">No messages</span>
                        )}
                      </p>
                    </div>

                    {/* Last active time */}
                    <div className="col-span-2 text-xs text-[#a0a0a0] font-mono">
                      {new Date(c.updatedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </div>

                    {/* Individual Toggle */}
                    <div className="col-span-1 flex justify-center">
                      <button
                        type="button"
                        onClick={() => handleToggleAutoReply(c.id, c.isAutoReplyOn)}
                        className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          c.isAutoReplyOn ? 'bg-white' : 'bg-[#1c1c1c]'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full transition duration-200 ease-in-out ${
                            c.isAutoReplyOn ? 'translate-x-4 bg-black' : 'translate-x-0 bg-[#525252]'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Navigation Link button */}
                    <div className="col-span-1 text-right">
                      <Link 
                        href={`/dashboard/conversations/${c.id}`}
                        className="btn-outline-stark px-3 py-1.5 text-[10px] uppercase font-semibold"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
