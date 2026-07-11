'use client';

import { useState, useEffect, useRef, use } from 'react';
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
}

export default function ConversationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load conversation details and messages
  useEffect(() => {
    async function loadData() {
      try {
        const [msgRes, convsRes] = await Promise.all([
          fetch(`/api/messages/${id}`),
          fetch('/api/conversations'),
        ]);

        if (msgRes.ok && convsRes.ok) {
          const msgData = await msgRes.json();
          const convsData = await convsRes.json();
          
          setMessages(msgData);
          
          const currentConv = convsData.find((c: Conversation) => c.id === id);
          if (currentConv) {
            setConversation(currentConv);
          }
        }
      } catch (err) {
        console.error('Error fetching conversation details:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();

    // Poll for new messages every 4 seconds for real-time simulation
    const interval = setInterval(loadData, 4000);
    return () => clearInterval(interval);
  }, [id]);

  // Scroll to bottom on load/new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleToggleAutoReply = async () => {
    if (!conversation) return;
    const updatedStatus = !conversation.isAutoReplyOn;

    setConversation({ ...conversation, isAutoReplyOn: updatedStatus });

    try {
      const res = await fetch(`/api/conversations/${id}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAutoReplyOn: updatedStatus }),
      });
      if (!res.ok) {
        // Rollback
        setConversation({ ...conversation, isAutoReplyOn: !updatedStatus });
        console.error('Failed to toggle auto reply on database.');
      }
    } catch (err) {
      setConversation({ ...conversation, isAutoReplyOn: !updatedStatus });
      console.error('Error toggling auto-reply:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-[#a0a0a0] font-medium tracking-widest uppercase">Syncing thread logs</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-black overflow-hidden">
      {/* Top Thread Header */}
      <header className="p-6 border-b border-[#1a1a1a] bg-[#050505] flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link 
            href="/dashboard/conversations" 
            className="text-xs text-[#a0a0a0] hover:text-white flex items-center gap-1.5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back</span>
          </Link>
          <div className="h-4 w-[1px] bg-[#1a1a1a]" />
          <div className="flex flex-col">
            <h2 className="text-sm font-semibold text-white">Instagram User Thread</h2>
            <span className="text-[10px] text-[#a0a0a0] font-mono">IGSID: {conversation?.participantId}</span>
          </div>
        </div>

        {/* Auto-reply Status Check/Action */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[#a0a0a0]">Auto-Reply:</span>
            <button
              onClick={handleToggleAutoReply}
              className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                conversation?.isAutoReplyOn ? 'bg-white' : 'bg-[#1c1c1c]'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full transition duration-200 ease-in-out ${
                  conversation?.isAutoReplyOn ? 'translate-x-4 bg-black' : 'translate-x-0 bg-[#525252]'
                }`}
              />
            </button>
          </div>
        </div>
      </header>

      {/* Message viewport */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-xs text-[#525252]">No message logs recorded in database for this conversation.</p>
          </div>
        ) : (
          messages.map((m) => (
            <div 
              key={m.id} 
              className={`flex ${m.isFromBot ? 'justify-start' : 'justify-end'} animate-fade-in`}
            >
              <div className="max-w-[70%] flex flex-col gap-1">
                {/* Bubble */}
                <div className={`p-4 text-xs leading-relaxed ${
                  m.isFromBot ? 'chat-bubble-bot' : 'chat-bubble-user'
                }`}>
                  <p className="font-mono whitespace-pre-wrap">{m.text}</p>
                </div>
                {/* Timestamp */}
                <span className={`text-[9px] text-[#525252] font-mono px-2 ${
                  m.isFromBot ? 'text-left' : 'text-right'
                }`}>
                  {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
            </div>
          ))
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Footer Info Area */}
      <footer className="p-4 border-t border-[#1a1a1a] bg-[#050505] text-center">
        <p className="text-[10px] text-[#525252] font-mono">
          System is listening in live mode. Conversations are refreshed automatically.
        </p>
      </footer>
    </div>
  );
}
