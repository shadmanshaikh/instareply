import Link from 'next/link';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-full bg-black text-white overflow-hidden">
      {/* OLED Left Sidebar */}
      <aside className="w-64 oled-sidebar flex flex-col justify-between border-r border-[#1a1a1a] bg-[#050505]">
        <div className="flex flex-col">
          {/* Header/Logo */}
          <div className="p-6 border-b border-[#1a1a1a]">
            <Link href="/dashboard" className="flex items-center gap-3 group">
              <div className="w-5 h-5 rounded-full border-2 border-white flex items-center justify-center bg-black group-hover:scale-105 transition-transform">
                <span className="text-[10px] font-bold text-white">AI</span>
              </div>
              <span className="font-semibold text-sm tracking-wider text-white">INSTA AGENT</span>
            </Link>
          </div>
          
          {/* Nav Items */}
          <nav className="p-4 space-y-1">
            <Link 
              href="/dashboard" 
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-[#a0a0a0] hover:text-white hover:bg-[#121212] transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
              </svg>
              <span>Overview</span>
            </Link>
            
            <Link 
              href="/dashboard/conversations" 
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-[#a0a0a0] hover:text-white hover:bg-[#121212] transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>Conversations</span>
            </Link>

            <Link 
              href="/dashboard/settings" 
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-[#a0a0a0] hover:text-white hover:bg-[#121212] transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Bot Settings</span>
            </Link>
          </nav>
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-[#1a1a1a]">
          <div className="flex items-center gap-3">
            <div className="status-dot-active" />
            <div className="flex flex-col">
              <span className="text-xs font-medium text-white">System Active</span>
              <span className="text-[10px] text-[#525252]">Listening to webhook</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#000000] overflow-hidden">
        {children}
      </main>
    </div>
  );
}
