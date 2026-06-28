/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ConnectXProvider, useConnectX } from './utils/stateManager';
import { AuthWizard } from './components/AuthWizard';
import { HomeFeed } from './components/HomeFeed';
import { ReelsViewer } from './components/ReelsViewer';
import { ImagesGrid } from './components/ImagesGrid';
import { VideosPlayer } from './components/VideosPlayer';
import { ConnectsManager } from './components/ConnectsManager';
import { MessagingHub } from './components/MessagingHub';
import { CreatorStudio } from './components/CreatorStudio';
import { MonetizationCenter } from './components/MonetizationCenter';
import { ProfilePage } from './components/ProfilePage';
import { AppSettings } from './components/AppSettings';
import { AdminPanel } from './components/AdminPanel';
import { CreateHub } from './components/CreateHub';
import { StoryViewerOverlay } from './components/StoryViewerOverlay';
import { NotificationsPage } from './components/NotificationsPage';
import { TrendDetailsModal } from './components/TrendDetailsModal';
import { UnifiedShareModal } from './components/UnifiedShareModal';
import { useHapticFeedback } from './hooks/useHapticFeedback';
import { motion, AnimatePresence } from 'framer-motion';

import { 
  Home, Film, Image, Video, Users, MessageSquare, 
  Sparkles, DollarSign, User, Sliders, ShieldAlert, Plus, LogOut, ShieldCheck,
  PenTool, History, CheckCircle2, ChevronRight, Menu, Bell, Search, Info, X, Zap
} from 'lucide-react';

const TRENDING_TOPICS = [
  { text: '#TokyoCyberpunk', trend: 'Hot', isPink: true },
  { text: '$CTXO Token: +24.8%', trend: 'Bullish', isPink: false },
  { text: 'Active Nodes: 12,482', trend: 'Secured', isPink: false },
  { text: '#ConnectXVibe', trend: 'Trending', isPink: true },
  { text: '@Priya_Loops: 10M Views', trend: 'Viral', isPink: true },
  { text: 'Gas: 11 Gwei', trend: 'Optimal', isPink: false },
  { text: '#BehanceExclusive', trend: 'Showcase', isPink: true },
  { text: '@Kavin_Studio: Live Studio', trend: 'Live', isPink: false },
];

function cleanTrendForSearch(trendText: string): string {
  // If it starts with # or @ or $, extract up to the first space or colon
  if (trendText.startsWith('#') || trendText.startsWith('@') || trendText.startsWith('$')) {
    const match = trendText.match(/^([#@$][\w_]+)/);
    if (match) return match[1];
  }
  // Otherwise, if it contains a colon, take the part before the colon
  if (trendText.includes(':')) {
    return trendText.split(':')[0].trim();
  }
  return trendText.trim();
}

function AppContent() {
  const { 
    currentUser, loginAsDemo, logout, notifications, selectChatUser, selectGroupChat, 
    viewedUserId, setViewedUserId, setActiveStoryUserId,
    posts, reels, videos, stories, offlineActionsCount, syncOfflineQueue
  } = useConnectX();
  const triggerHaptic = useHapticFeedback();

  const [activeTab, setActiveTab] = useState<string>('Home');
  const [createOpen, setCreateOpen] = useState(false);
  const [activeEditor, setActiveEditor] = useState<'writeup' | 'post' | 'clips' | 'video' | 'stories' | null>(null);
  
  // Dynamic network connectivity listener
  const [isOnline, setIsOnline] = useState<boolean>(() => typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => {
      triggerHaptic('medium');
      setIsOnline(true);
    };
    const handleOffline = () => {
      triggerHaptic('heavy');
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [triggerHaptic]);

  // Global Share states as requested
  const [shareOpen, setShareOpen] = useState<boolean>(false);
  const [sharedItemId, setSharedItemId] = useState<string | null>(null);
  const [sharedItemType, setSharedItemType] = useState<'writeup' | 'post' | 'clip' | 'video' | 'story'>('post');

  // Custom navigation drawer states
  const [isSideDrawerOpen, setIsSideDrawerOpen] = useState(false);
  const [selectedTrendTopic, setSelectedTrendTopic] = useState<string | null>(null);
  const [homeFeedSearch, setHomeFeedSearch] = useState<string>('');

  // Glassmorphic Custom Floating Toasts State
  interface CustomToast {
    id: string;
    message: string;
    type?: 'success' | 'info' | 'warning' | 'error';
  }
  const [toasts, setToasts] = useState<CustomToast[]>([]);

  useEffect(() => {
    // Intercept standard window.alert for iframe friendliness and premium design
    const nativeAlert = window.alert;
    
    window.alert = (message: string) => {
      triggerHaptic('medium');
      const id = Math.random().toString(36).substring(2, 9);
      
      let type: 'success' | 'info' | 'warning' | 'error' = 'info';
      const lowercaseMsg = message.toLowerCase();
      if (
        lowercaseMsg.includes('success') || 
        lowercaseMsg.includes('complete') || 
        lowercaseMsg.includes('saved') || 
        lowercaseMsg.includes('approved') || 
        lowercaseMsg.includes('synchronized') ||
        lowercaseMsg.includes('restored') ||
        lowercaseMsg.includes('secured')
      ) {
        type = 'success';
      } else if (
        lowercaseMsg.includes('failed') || 
        lowercaseMsg.includes('error') || 
        lowercaseMsg.includes('invalid') || 
        lowercaseMsg.includes('specify') ||
        lowercaseMsg.includes('required')
      ) {
        type = 'error';
      } else if (
        lowercaseMsg.includes('warning') || 
        lowercaseMsg.includes('backup') || 
        lowercaseMsg.includes('offline')
      ) {
        type = 'warning';
      }

      setToasts(prev => [...prev, { id, message, type }]);

      // Auto-remove toast after 3.5 seconds
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 3500);
    };

    return () => {
      window.alert = nativeAlert;
    };
  }, [triggerHaptic]);

  // Set up global triggers for the ultra-compact bottom-sheet popup
  useEffect(() => {
    (window as any).triggerGlobalShare = (itemId: string, itemType: 'writeup' | 'post' | 'clip' | 'video' | 'story' = 'post') => {
      triggerHaptic('medium');
      setSharedItemId(itemId);
      setSharedItemType(itemType);
      setShareOpen(true);
    };
    return () => {
      delete (window as any).triggerGlobalShare;
    };
  }, [triggerHaptic]);

  // Find the selected post/item based on the tracked ID and type
  const findSharedItem = () => {
    if (!sharedItemId) return null;
    if (sharedItemType === 'post' || sharedItemType === 'writeup') {
      return posts.find(p => p.id === sharedItemId);
    } else if (sharedItemType === 'clip') {
      return reels.find(r => r.id === sharedItemId);
    } else if (sharedItemType === 'video') {
      return videos.find(v => v.id === sharedItemId);
    } else if (sharedItemType === 'story') {
      return stories.find(s => s.id === sharedItemId);
    }
    return null;
  };

  const sharedItem = findSharedItem();

  // Switch to profile whenever viewedUserId is changed
  useEffect(() => {
    if (viewedUserId) {
      setActiveTab('Profile');
    }
  }, [viewedUserId]);

  // Window coordinates listeners for Behance Showcase direct overrides
  useEffect(() => {
    (window as any).overrideActiveTab = (tabName: string) => {
      if (tabName === 'Home') {
        setViewedUserId(null);
        setHomeFeedSearch('');
        if (typeof (window as any).resetHomeFeed === 'function') {
          (window as any).resetHomeFeed();
        }
      }
      setActiveTab(tabName);
    };
    (window as any).overrideCreateOpen = (isOpen: boolean) => {
      setCreateOpen(isOpen);
    };
    (window as any).overrideActiveEditor = (editorName: 'writeup' | 'post' | 'clips' | 'video' | 'stories' | null) => {
      setActiveEditor(editorName);
    };
    (window as any).overrideSideDrawer = (isOpen: boolean) => {
      setIsSideDrawerOpen(isOpen);
    };
    (window as any).overrideStoryActiveUser = (userId: string | null) => {
      setActiveStoryUserId(userId);
    };
    (window as any).executeLoginAsKavin = () => {
      loginAsDemo('user_kavin');
    };
    (window as any).executeLogout = () => {
      logout();
    };

    return () => {
      delete (window as any).overrideActiveTab;
      delete (window as any).overrideCreateOpen;
      delete (window as any).overrideActiveEditor;
      delete (window as any).overrideSideDrawer;
      delete (window as any).overrideStoryActiveUser;
      delete (window as any).executeLoginAsKavin;
      delete (window as any).executeLogout;
    };
  }, [setActiveStoryUserId, loginAsDemo, logout]);

  // If user is not logged in / authenticated, prompt multi-step Auth Wizard screen
  if (!currentUser) {
    return <AuthWizard />;
  }

  // Count unread notifications
  const unreadNotifications = notifications.filter(n => !n.read).length;

  // Sidebar navigation mapping list
  const sidebarItems = [
    { name: 'Home', icon: Home, label: 'Feed Streams' },
    { name: 'Reels', icon: Film, label: 'Loop Reels' },
    { name: 'Images', icon: Image, label: 'Liquid Gallery' },
    { name: 'Videos', icon: Video, label: 'ConnectX TV' },
    { name: 'Messages', icon: MessageSquare, label: 'E2E Enclaves' },
    { name: 'Connects', icon: Users, label: 'Connects Hub' },
    { name: 'Monetize', icon: DollarSign, label: 'Creator Vault' },
    { name: 'Profile', icon: User, label: 'My Canvas' },
    { name: 'Settings', icon: Sliders, label: 'App Settings' },
  ];

  // If user belongs to matching admin accounts, render administrative controls
  const isAdmin = currentUser.username.toLowerCase().includes('admin') || currentUser.displayName.toLowerCase().includes('admin');
  const itemsWithAdmin = [...sidebarItems];
  if (isAdmin) {
    itemsWithAdmin.push({ name: 'Admin', icon: ShieldAlert, label: 'Governance Panel' });
  }

  return (
    <div className="flex-grow flex flex-col h-full bg-[#020510] text-white select-none relative overflow-hidden">
      
      {/* PHONE TOP STATUS BAR BAR MOCKUP */}
      <div className="h-7 bg-black/90 px-4 flex items-center justify-between shrink-0 font-sans select-none z-30 relative select-none">
        {/* Left Clock */}
        <span className="text-[10px] font-bold text-white tracking-tight">9:41</span>
        
        {/* Dynamic Island Capsule */}
        <div className="w-[105px] h-[18px] bg-black border border-white/5 rounded-full flex items-center justify-between px-2 shadow-inner">
          <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-cyan-400' : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]'} border border-black/5 animate-pulse shrink-0`}></div>
          <span className={`text-[7px] font-mono font-black ${isOnline ? 'text-cyan-400' : 'text-amber-500'} uppercase tracking-widest shrink-0`}>
            {isOnline ? 'SECURED NODE' : 'OFFLINE MODE'}
          </span>
          <div className={`w-1 h-1 rounded-full ${isOnline ? 'bg-pink-500' : 'bg-amber-500'} shrink-0`}></div>
        </div>

        {/* Icons Right */}
        <div className="flex items-center gap-1 text-white/95">
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L4.35 19.4c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0l1.9-1.9C9.22 19.58 10.57 20 12 20c4.97 0 9-4.03 9-9s-4.03-9-9-9zm0 15c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z"/>
          </svg>
          <span className="text-[8px] font-bold font-mono">{isOnline ? '5G' : 'OFFLINE'}</span>
          <div className="w-[15px] h-[8px] border border-white/30 rounded-[2px] p-[0.5px] flex justify-start items-center">
            <div className={`w-[100%] h-full ${isOnline ? 'bg-white' : 'bg-amber-500'} rounded-[0.5px]`}></div>
          </div>
        </div>
      </div>

      {/* FLOATING OFFLINE ALERT BADGE */}
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-18 inset-x-3 h-8 bg-amber-500/20 backdrop-blur-md border border-amber-500/20 rounded-xl px-2.5 flex items-center justify-between z-40 shadow-lg text-[8.5px] font-mono text-amber-300"
          >
            <div className="flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-amber-400 animate-bounce shrink-0" />
              <span>
                {offlineActionsCount > 0 
                  ? `Offline Mode Active — ${offlineActionsCount} interactions queued` 
                  : 'Network Offline — Browsing Cached Feed Streams'}
              </span>
            </div>
            <span className="text-[6.5px] uppercase tracking-wider font-bold bg-amber-500/20 text-amber-200 px-1 py-0.5 rounded leading-none shrink-0 border border-amber-500/25">
              LOCAL CACHE
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FLOATING ACTION SYNC BANNER */}
      <AnimatePresence>
        {isOnline && offlineActionsCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -25 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -25 }}
            className="absolute top-18 inset-x-3 h-8 bg-cyan-950/45 backdrop-blur-md border border-cyan-500/30 rounded-xl px-2.5 flex items-center justify-between z-40 shadow-lg text-[8.5px] font-mono text-cyan-200"
          >
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-cyan-400 animate-pulse shrink-0" />
              <span>{offlineActionsCount} offline interactions ready to sync</span>
            </div>
            <button
              onClick={() => {
                triggerHaptic('medium');
                syncOfflineQueue();
              }}
              className="text-[7.5px] uppercase tracking-wider font-bold bg-cyan-400/20 hover:bg-cyan-400/30 text-white px-2 py-0.5 rounded border border-cyan-400/30 cursor-pointer active:scale-95 transition-all"
            >
              Sync Now
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER BAR IN PHONE VIEW */}
      <header className="h-10 bg-black/85 border-b border-white/5 flex items-center justify-between px-2.5 sticky top-0 z-20 backdrop-blur-md">
        <div className="flex items-center gap-1.5">
          <button 
            id="cx_drawer_menu_trigger"
            onClick={() => {
              triggerHaptic('medium');
              setIsSideDrawerOpen(true);
            }}
            className="p-1 rounded-lg hover:bg-white/5 active:bg-white/10 transition-colors text-white cursor-pointer"
          >
            <Menu className="w-4 h-4 text-gray-300" />
          </button>
          <div className="flex items-center gap-1">
            <h1 className="text-[12.5px] font-display font-black tracking-widest bg-gradient-to-r from-cyan-400 via-blue-500 to-pink-500 bg-clip-text text-transparent">
              CONNECTX
            </h1>
            <span className="text-[6.5px] font-mono py-0.2 px-0.8 bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-extrabold rounded leading-none">
              v1.0
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Notifications Trigger */}
          <button 
            id="cx_notif_icon_trigger"
            onClick={() => {
              triggerHaptic('light');
              setViewedUserId(null);
              setCreateOpen(false);
              setActiveEditor(null);
              setSelectedTrendTopic(null);
              setActiveStoryUserId(null);
              setActiveTab('Notifications');
            }}
            className="p-1 rounded-full hover:bg-white/5 relative active:scale-95 transition-all text-white cursor-pointer"
          >
            <Bell className="w-3 h-3 text-gray-200" />
            <span className="absolute top-0 right-0 w-1 h-1 rounded-full bg-pink-500 animate-pulse border border-black"></span>
          </button>

          <img 
            onClick={() => {
              triggerHaptic('light');
              setViewedUserId(currentUser.id);
              setCreateOpen(false);
              setActiveEditor(null);
              setSelectedTrendTopic(null);
              setActiveStoryUserId(null);
              setActiveTab('Profile');
            }}
            src={currentUser.profilePic} 
            className="w-4.5 h-4.5 rounded-full border border-white/15 cursor-pointer hover:border-pink-500 transition-colors object-cover" 
          />
        </div>
      </header>

      {/* HORIZONTAL TRENDS TICKER */}
      <div className="h-5.5 bg-black/95 border-b border-white/5 flex items-center overflow-hidden relative shrink-0 z-10 select-none">
        <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />
        
        <div className="animate-marquee flex items-center gap-4 whitespace-nowrap py-0.5">
          {/* Duplicate 2x for seamless continuous loop */}
          {[...TRENDING_TOPICS, ...TRENDING_TOPICS].map((topic, index) => (
            <div 
              key={index} 
              onClick={() => {
                triggerHaptic('light');
                const cleanedKeyword = cleanTrendForSearch(topic.text);
                setHomeFeedSearch(cleanedKeyword);
                setActiveTab('Home');
                setSelectedTrendTopic(topic.text);
              }}
              className="flex items-center gap-1 cursor-pointer hover:scale-105 transition-transform shrink-0"
            >
              <span className={`w-0.5 h-0.5 rounded-full ${topic.isPink ? 'bg-pink-400 shadow-[0_0_8px_rgba(236,72,153,0.8)]' : 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]'} animate-pulse`} />
              <span className={`text-[7.5px] font-mono font-black uppercase tracking-wider ${topic.isPink ? 'text-pink-450 drop-shadow-[0_0_2.5px_rgba(236,72,153,0.45)]' : 'text-cyan-450 drop-shadow-[0_0_2.5px_rgba(34,211,238,0.45)]'}`}>
                {topic.text}
              </span>
              <span className="text-[6px] font-sans px-0.8 py-0.1 bg-white/5 border border-white/10 rounded text-gray-400 text-[5.5px] font-medium uppercase scale-90">
                {topic.trend}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* VIEWPORT CONTROLLER */}
      <main className="flex-grow overflow-y-auto no-scrollbar relative z-10 p-2 flex flex-col justify-start">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -12, filter: 'blur(4px)' }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="w-full flex-grow flex flex-col justify-start"
          >
            {activeTab === 'Home' && (
              <HomeFeed 
                searchQuery={homeFeedSearch}
                onSearchChange={setHomeFeedSearch}
                onOpenCreateMenu={() => setCreateOpen(true)} 
                onSelectUserTab={(tab) => setActiveTab(tab)}
                onSearchQuery={(q) => {
                  setHomeFeedSearch(q);
                  console.log(`Decrypted indexing for query: "${q}". Search metrics populated on feed.`);
                }}
              />
            )}

            {activeTab === 'Reels' && (
              <ReelsViewer onTriggerCreate={() => setCreateOpen(true)} />
            )}

            {activeTab === 'Images' && (
              <ImagesGrid onTriggerCreate={() => setCreateOpen(true)} />
            )}

            {activeTab === 'Videos' && (
              <VideosPlayer onTriggerCreate={() => setCreateOpen(true)} />
            )}

            {activeTab === 'Messages' && <MessagingHub />}

            {activeTab === 'Connects' && (
              <ConnectsManager 
                onSelectChatUser={(usr) => {
                  selectChatUser(usr);
                  setActiveTab('Messages');
                }} 
                onSelectGroupChat={(grp) => {
                  selectGroupChat(grp);
                  setActiveTab('Messages');
                }}
              />
            )}

            {activeTab === 'Studio' && <CreatorStudio />}

            {activeTab === 'Monetize' && <MonetizationCenter />}

            {activeTab === 'Profile' && (
              <ProfilePage 
                onOpenSettings={() => setActiveTab('Settings')} 
                onTriggerCreate={() => setCreateOpen(true)}
                onNavigate={(tab) => setActiveTab(tab)}
              />
            )}

            {activeTab === 'Settings' && <AppSettings />}

            {activeTab === 'Notifications' && <NotificationsPage onBack={() => setActiveTab('Home')} />}

            {activeTab === 'Admin' && <AdminPanel />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ERGONOMIC BOTTOM BAR - FLOATING LIQUID GLASS TAB BAR */}
      <div className="absolute bottom-3 left-3 right-3 h-13 rounded-xl bg-white/[0.04] backdrop-blur-[8px] saturate-[320%] border border-white/24 border-t-white/60 border-l-white/40 shadow-[0_30px_70px_rgba(0,0,0,0.9),inset_0_1px_0px_rgba(255,255,255,0.7),inset_0_2px_4px_rgba(255,255,255,0.4),inset_0_-2px_15px_rgba(255,255,255,0.04),0_0_0_1px_rgba(255,255,255,0.12)] z-40 flex items-center justify-between px-2 select-none">
        {/* Real-time liquid light glossy shine animation sweep overlay */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-[#2563FF]/4 via-transparent to-[#FF2E9A]/4 pointer-events-none" />

        {/* LEFT SYMMETRIC COMPARTMENT */}
        <div className="flex items-center justify-around flex-1">
          <button 
            type="button"
            id="tab-home"
            onClick={() => {
              triggerHaptic('light');
              setViewedUserId(null);
              setHomeFeedSearch('');
              if (typeof (window as any).resetHomeFeed === 'function') {
                (window as any).resetHomeFeed();
              }
              setCreateOpen(false);
              setActiveEditor(null);
              setSelectedTrendTopic(null);
              setActiveStoryUserId(null);
              setActiveTab('Home');
            }}
            className={`p-1 relative flex flex-col items-center gap-0.5 cursor-pointer transition-all duration-300 outline-none ${activeTab === 'Home' ? 'text-[#2563FF]' : 'text-gray-400 hover:text-white'}`}
          >
            {activeTab === 'Home' && (
              <motion.div 
                layoutId="activeTabIndicatorGlow" 
                className="absolute -inset-1 rounded-lg bg-white/[0.04] border border-white/20 shadow-[inset_0_1px_2px_rgba(255,255,255,0.25)] -z-10"
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
              />
            )}
            <Home className={`w-3.5 h-3.5 transition-transform duration-300 ${activeTab === 'Home' ? 'scale-110' : 'hover:scale-105'}`} />
            <span className="text-[7px] font-black font-mono tracking-wide uppercase">Stream</span>
          </button>
   
          <button 
            type="button"
            id="tab-reels"
            onClick={() => {
              triggerHaptic('light');
              setViewedUserId(null);
              setCreateOpen(false);
              setActiveEditor(null);
              setSelectedTrendTopic(null);
              setActiveStoryUserId(null);
              setActiveTab('Reels');
            }}
            className={`p-1 relative flex flex-col items-center gap-0.5 cursor-pointer transition-all duration-300 outline-none ${activeTab === 'Reels' ? 'text-[#FF2E9A]' : 'text-gray-400 hover:text-white'}`}
          >
            {activeTab === 'Reels' && (
              <motion.div 
                layoutId="activeTabIndicatorGlow" 
                className="absolute -inset-1 rounded-lg bg-white/[0.04] border border-white/20 shadow-[inset_0_1px_2px_rgba(255,255,255,0.25)] -z-10"
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
              />
            )}
            <Film className={`w-3.5 h-3.5 transition-transform duration-300 ${activeTab === 'Reels' ? 'scale-110' : 'hover:scale-105'}`} />
            <span className="text-[7px] font-black font-mono tracking-wide uppercase">Reels</span>
          </button>
        </div>

        {/* PERFECTLY CENTERED NATURAL GLASS ORB */}
        <div className="flex-shrink-0 flex items-center justify-center px-3 relative z-50">
          <button 
            type="button"
            id="center-plus-orb"
            onClick={() => {
              triggerHaptic('medium');
              setCreateOpen(true);
            }}
            className={`w-10 h-10 rounded-full text-white stroke-[2.5] cursor-pointer hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center relative group overflow-hidden border ${
              createOpen 
                ? 'bg-gradient-to-tr from-[#2563FF] to-[#FF2E9A] border-white shadow-[0_15px_30px_rgba(0,0,0,0.5)]' 
                : 'bg-white/5 backdrop-blur-[8px] saturate-[300%] border-white/50 shadow-[0_18px_38px_rgba(0,0,0,0.75),inset_0_1px_0px_rgba(255,255,255,0.7),inset_0_2px_4px_rgba(255,255,255,0.45),inset_0_-2px_15px_rgba(255,255,255,0.04),0_0_0_1px_rgba(255,255,255,0.15)] hover:border-white/75 hover:shadow-[0_20px_42px_rgba(0,0,0,0.8)]'
            }`}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />
            <span className="absolute top-0 -inset-x-full h-full w-1/2 bg-gradient-to-r from-transparent via-white/25 to-transparent skew-x-30 group-hover:left-full transition-all duration-[750ms] ease-out pointer-events-none animate-pulse" />
            <Plus className="w-5 h-5 text-white stroke-[2.5]" />
          </button>
        </div>

        {/* RIGHT SYMMETRIC COMPARTMENT */}
        <div className="flex items-center justify-around flex-1">
          <button 
            type="button"
            id="tab-messages"
            onClick={() => {
              triggerHaptic('light');
              setViewedUserId(null);
              setCreateOpen(false);
              setActiveEditor(null);
              setSelectedTrendTopic(null);
              setActiveStoryUserId(null);
              setActiveTab('Messages');
            }}
            className={`p-1 relative flex flex-col items-center gap-0.5 cursor-pointer transition-all duration-300 outline-none ${activeTab === 'Messages' ? 'text-[#8B5CF6]' : 'text-gray-400 hover:text-white'}`}
          >
            {activeTab === 'Messages' && (
              <motion.div 
                layoutId="activeTabIndicatorGlow" 
                className="absolute -inset-1 rounded-lg bg-white/[0.04] border border-white/20 shadow-[inset_0_1px_2px_rgba(255,255,255,0.25)] -z-10"
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
              />
            )}
            <MessageSquare className={`w-3.5 h-3.5 transition-transform duration-300 ${activeTab === 'Messages' ? 'scale-110' : 'hover:scale-105'}`} />
            <span className="text-[7px] font-black font-mono tracking-wide uppercase">Chats</span>
          </button>

          <button 
            type="button"
            id="tab-profile"
            onClick={() => {
              triggerHaptic('light');
              setViewedUserId(currentUser.id);
              setCreateOpen(false);
              setActiveEditor(null);
              setSelectedTrendTopic(null);
              setActiveStoryUserId(null);
              setActiveTab('Profile');
            }}
            className={`p-1 relative flex flex-col items-center gap-0.5 cursor-pointer transition-all duration-300 outline-none ${activeTab === 'Profile' ? 'text-[#2563FF]' : 'text-gray-400 hover:text-white'}`}
          >
            {activeTab === 'Profile' && (
              <motion.div 
                layoutId="activeTabIndicatorGlow" 
                className="absolute -inset-1 rounded-lg bg-white/[0.04] border border-white/20 shadow-[inset_0_1px_2px_rgba(255,255,255,0.25)] -z-10"
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
              />
            )}
            <User className={`w-3.5 h-3.5 transition-transform duration-300 ${activeTab === 'Profile' ? 'scale-110' : 'hover:scale-105'}`} />
            <span className="text-[7px] font-black font-mono tracking-wide uppercase">My Card</span>
          </button>
        </div>
      </div>

      {/* INSTAGRAM-STYLE EXTREME GLASS BOTTOM SHEET RENDER */}
      <AnimatePresence>
        {createOpen && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCreateOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-[4px] z-40 transition-opacity duration-300"
            />

            {/* Bottom Sheet wrapper matching user guidelines height (30% to 50% screen height) */}
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 280, damping: 24 }}
              className="absolute bottom-0 inset-x-0 bg-[#040815]/95 border-t border-white/10 rounded-t-[20px] p-2.5 pb-4 z-50 flex flex-col items-center justify-start shadow-[0_-15px_30px_rgba(0,0,0,0.8)]"
            >
              {/* Grab Handle */}
              <div className="w-8 h-0.75 bg-white/20 rounded-full mb-2 z-10 shrink-0"></div>

              {/* Title Header */}
              <div className="text-center mb-2 z-10 shrink-0">
                <span className="text-[7px] font-mono tracking-[0.2em] text-cyan-400 uppercase font-black">
                  CREATE HUB
                </span>
                <h3 className="text-[10.5px] font-bold text-white tracking-tight leading-none mt-0.5">
                  Produce Social Stream
                </h3>
              </div>

              {/* Glassmorphism buttons Grid */}
              <div className="grid grid-cols-5 gap-1 w-full z-10 px-0.5">
                {[
                  { id: 'writeup', label: 'WriteUp', emoji: '✍️', icon: PenTool, style: 'text-cyan-400', tagline: 'Post text' },
                  { id: 'post', label: 'Post', emoji: '📸', icon: Image, style: 'text-pink-400', tagline: 'Add photo' },
                  { id: 'clips', label: 'Clips', emoji: '🎬', icon: Film, style: 'text-purple-400', tagline: 'Make reel' },
                  { id: 'video', label: 'Video', emoji: '🎥', icon: Video, style: 'text-indigo-400', tagline: 'Vlog file' },
                  { id: 'stories', label: 'Stories', emoji: '📖', icon: History, style: 'text-amber-400', tagline: 'Active stories' }
                ].map((opt) => {
                  const IconComp = opt.icon;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => {
                        triggerHaptic('selection');
                        setCreateOpen(false);
                        setActiveEditor(opt.id as any);
                      }}
                      className="glass-panel border bg-white/[0.01] rounded-xl p-1 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 h-[50px] hover:border-pink-500/30"
                    >
                      <span className="text-[12px] block shrink-0">{opt.emoji}</span>
                      <span className="text-[8px] font-black text-white block mt-0.5 leading-none">{opt.label}</span>
                      <span className="text-[6.5px] text-gray-500 block shrink-0 mt-0.5 leading-none">{opt.tagline}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* INSTAGRAM-STYLE STORIES VIEWER OVERLAY */}
      <StoryViewerOverlay />

      {/* FULL-SCREEN ACTIVE WRITING/CREATOR DIALOG */}
      {activeEditor && (
        <div className="absolute inset-0 bg-[#020512]/95 backdrop-blur-md z-50 flex items-end justify-center p-0 animate-in fade-in duration-200">
          <div className={`w-full relative flex flex-col ${
            activeEditor === 'post' || activeEditor === 'clips' || activeEditor === 'stories'
              ? 'h-full rounded-none border-0 p-0 bg-black overflow-hidden'
              : 'h-[90%] overflow-y-auto rounded-t-3xl border-t border-white/10 bg-[#050817] p-5 shadow-2xl'
          }`}>
            <CreateHub initialWorkspace={activeEditor} onClose={() => setActiveEditor(null)} />
          </div>
        </div>
      )}

      {/* RESPONSIVE TOUCH NAVIGATION DRAWER (Screen 30 Reference Layout) */}
      <AnimatePresence>
        {isSideDrawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSideDrawerOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-[4px] z-40"
            />

            {/* Slider menu body */}
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 260, damping: 25 }}
              className="absolute left-0 top-0 bottom-0 w-[280px] bg-[#040815]/95 border-r border-white/10 p-5 z-50 flex flex-col justify-between shadow-[20px_0_40px_rgba(0,0,0,0.5)]"
            >
              <div>
                {/* Header Profile element with Verified stamp */}
                <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-5">
                  <div className="flex items-center gap-2.5">
                    <img src={currentUser.profilePic} className="w-9 h-9 rounded-full ring-2 ring-cyan-400" />
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold text-white block leading-none">{currentUser.displayName}</span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400/10 stroke-[2.5]" />
                      </div>
                      <span className="text-[9px] font-mono text-gray-500 block mt-0.5">@{currentUser.username}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsSideDrawerOpen(false)}
                    className="p-1 rounded-full bg-white/5 text-gray-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Crypto balance info card */}
                <div className="bg-gradient-to-tr from-cyan-500/10 to-pink-500/5 border border-cyan-400/20 rounded-2xl p-3 mb-5 text-left relative overflow-hidden">
                  <div className="absolute right-[-10px] top-[-10px] w-12 h-12 bg-cyan-400/10 rounded-full blur-lg pointer-events-none"></div>
                  <span className="text-[8px] font-mono text-cyan-400 tracking-wider block font-bold uppercase leading-none">Wallet Net Worth</span>
                  <div className="text-base font-display font-extrabold text-white mt-1">$3,125.46 <span className="text-[9px] text-pink-400 font-mono font-bold">PRO LEVEL</span></div>
                  <div className="text-[8px] font-mono text-gray-500 mt-1 uppercase">Crypto Key ID: cx_enclave_{currentUser.id.substring(5,11)}</div>
                </div>

                {/* Shortcuts Items */}
                <div className="flex flex-col gap-1 text-left">
                  <span className="text-[8px] font-mono tracking-widest text-gray-500 uppercase block mb-1">Direct Nav shortcuts</span>
                  {itemsWithAdmin.map(item => {
                    const IconComp = item.icon;
                    return (
                      <button
                        key={item.name}
                        onClick={() => {
                          setIsSideDrawerOpen(false);
                          if (item.name === 'Profile') {
                            setViewedUserId(currentUser.id);
                          } else {
                            setViewedUserId(null);
                          }

                          // Reset state on navigation
                          setCreateOpen(false);
                          setActiveEditor(null);
                          setSelectedTrendTopic(null);
                          setActiveStoryUserId(null);

                          if (item.name === 'Home') {
                            setHomeFeedSearch('');
                            if (typeof (window as any).resetHomeFeed === 'function') {
                              (window as any).resetHomeFeed();
                            }
                          }

                          setActiveTab(item.name);
                        }}
                        className={`w-full py-2.5 px-3 rounded-xl flex items-center justify-between text-xs font-semibold hover:bg-white/5 transition-all outline-none cursor-pointer ${activeTab === item.name ? 'text-cyan-400 bg-white/5 border border-white/5' : 'text-gray-400'}`}
                      >
                        <div className="flex items-center gap-2.5">
                          <IconComp className="w-4 h-4" />
                          <span>{item.label}</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 opacity-40 text-white" />
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Secure logout footer node */}
              <button
                onClick={() => {
                  setIsSideDrawerOpen(false);
                  logout();
                }}
                className="w-full py-3 border border-red-500/20 hover:bg-red-500/10 text-red-400 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all outline-none cursor-pointer"
              >
                <LogOut className="w-4 h-4" /> LOGOUT NODE CREDENTIALS
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* TRANSITIONAL TREND INDEX DETAILED METRIC MODULE */}
      <AnimatePresence>
        {selectedTrendTopic && (
          <TrendDetailsModal 
            topicText={selectedTrendTopic} 
            onClose={() => setSelectedTrendTopic(null)} 
            onHashtagAutoInject={(hashtag) => {
              navigator.clipboard.writeText(hashtag).then(() => {
                alert(`Hashtag index "${hashtag}" cloned safely to your secure clipboard. Paste it inside your next post!`);
              }).catch(() => {
                alert(`Hashtag index copy exception. Use key "${hashtag}" inside posts!`);
              });
            }}
          />
        )}
      </AnimatePresence>

      <UnifiedShareModal
        isOpen={shareOpen && sharedItem !== null}
        onClose={() => setShareOpen(false)}
        item={sharedItem!}
        contentType={sharedItemType}
      />

      {/* GLOSS GLASS FLOATING TOAST STACK */}
      <div className="absolute top-12 inset-x-3.5 z-50 flex flex-col gap-1.5 pointer-events-none items-center">
        <AnimatePresence>
          {toasts.map((toast) => {
            const isSuccess = toast.type === 'success';
            const isError = toast.type === 'error';
            const isWarning = toast.type === 'warning';
            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: -20, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ type: 'spring', stiffness: 320, damping: 22 }}
                className="w-full max-w-sm pointer-events-auto rounded-xl border bg-slate-950/85 backdrop-blur-md p-3 shadow-2xl flex items-center gap-3 select-none relative overflow-hidden"
                style={{
                  borderColor: isSuccess 
                    ? 'rgba(34, 211, 238, 0.4)' 
                    : isError 
                    ? 'rgba(244, 63, 94, 0.4)' 
                    : isWarning 
                    ? 'rgba(245, 158, 11, 0.4)' 
                    : 'rgba(255, 255, 255, 0.2)'
                }}
              >
                {/* Accent line on left */}
                <div 
                  className="absolute left-0 top-3 bottom-3 w-1 rounded-r-md"
                  style={{
                    backgroundColor: isSuccess 
                      ? '#22d3ee' 
                      : isError 
                      ? '#f43f5e' 
                      : isWarning 
                      ? '#f59e0b' 
                      : '#8b5cf6'
                  }}
                />

                <div className="flex-1 flex flex-col ml-1 text-left">
                  <span className="text-[9.5px] font-bold text-white tracking-wide font-mono">
                    {isSuccess ? '✅ SYSTEM OUTCOME' : isError ? '❌ EXCEPTION REPORT' : isWarning ? '⚠️ SYSTEM ADVISORY' : 'ℹ️ INFORMATION NODE'}
                  </span>
                  <span className="text-[10px] text-gray-250 mt-0.5 leading-snug font-sans">
                    {toast.message}
                  </span>
                </div>

                <button
                  onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                  className="p-1 rounded-full hover:bg-white/10 text-gray-400 hover:text-white cursor-pointer shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

    </div>
  );
}

// 4K PRESENTATION DECK WRAPPER (Visual design system showcase around physical viewport frame)
export default function App() {
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Triggering force controls on simulator via exposed window variables
  const forceOnboardingStep = (stepIdx: number, signupMethod?: any) => {
    if ((window as any).executeLogout) {
      (window as any).executeLogout();
    }
    setTimeout(() => {
      if ((window as any).overrideAuthWizard) {
        (window as any).overrideAuthWizard(stepIdx, signupMethod, false);
      }
    }, 120);
  };

  const forceLoginTab = (tabName: string, secondaryAction?: () => void) => {
    if ((window as any).executeLoginAsKavin) {
      (window as any).executeLoginAsKavin();
    }
    setTimeout(() => {
      if ((window as any).overrideActiveTab) {
        (window as any).overrideActiveTab(tabName);
      }
      if ((window as any).overrideCreateOpen) (window as any).overrideCreateOpen(false);
      if ((window as any).overrideActiveEditor) (window as any).overrideActiveEditor(null);
      if ((window as any).overrideStoryActiveUser) (window as any).overrideStoryActiveUser(null);
      
      if (secondaryAction) {
        setTimeout(secondaryAction, 100);
      }
    }, 120);
  };

  const forceLoginEditor = (editorType: 'writeup' | 'post' | 'clips' | 'video' | 'stories') => {
    if ((window as any).executeLoginAsKavin) {
      (window as any).executeLoginAsKavin();
    }
    setTimeout(() => {
      if ((window as any).overrideActiveEditor) {
        (window as any).overrideActiveEditor(editorType);
      }
      if ((window as any).overrideCreateOpen) (window as any).overrideCreateOpen(false);
    }, 120);
  };

  const forceHomeFilter = (filterType: any) => {
    if ((window as any).overrideHomeFeedFilter) {
      (window as any).overrideHomeFeedFilter(filterType);
    }
  };

  const forceSettingsTab = (section: 'profile' | 'app', subItem?: string) => {
    if ((window as any).overrideSettingsSection) {
      (window as any).overrideSettingsSection(section, subItem);
    }
  };

  const forceStoryViewer = () => {
    forceLoginTab('Home');
    setTimeout(() => {
      if ((window as any).overrideStoryActiveUser) {
        (window as any).overrideStoryActiveUser('user_priya');
      }
    }, 200);
  };

  const forceAlertToast = () => {
    forceLoginTab('Home');
    setTimeout(() => {
      const mockNotifyTrigger = document.getElementById('cx_notif_icon_trigger');
      if (mockNotifyTrigger) mockNotifyTrigger.click();
    }, 200);
  };

  const forceCreateSheet = () => {
    forceLoginTab('Home');
    setTimeout(() => {
      if ((window as any).overrideCreateOpen) {
        (window as any).overrideCreateOpen(true);
      }
    }, 200);
  };

  const forceDrawerMenu = () => {
    forceLoginTab('Home');
    setTimeout(() => {
      const devDrawerTrigger = document.getElementById('cx_drawer_menu_trigger');
      if (devDrawerTrigger) devDrawerTrigger.click();
    }, 200);
  };

  const handleCopyPalette = (hex: string, name: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedToken(name);
    setTimeout(() => setCopiedToken(null), 1500);
  };

  const showcaseScreens = [
    {
      category: '1. ONBOARDING SEQUENCE',
      screens: [
        { id: 'welcome', name: '1. Welcome Screen Layout', action: () => forceOnboardingStep(0) },
        { id: 'choose', name: '2. Choose Auth Accounts', action: () => forceOnboardingStep(1) },
        { id: 'otp', name: '3. Email OTPVerification', action: () => forceOnboardingStep(2, 'email') },
        { id: 'username', name: '4. Create Username Page', action: () => forceOnboardingStep(3) },
        { id: 'password', name: '5. Create Password Rule', action: () => forceOnboardingStep(4) },
        { id: 'dob', name: '6. Date of Birth Picker', action: () => forceOnboardingStep(5) },
        { id: 'photo', name: '7. Photo upload widget', action: () => forceOnboardingStep(6) },
        { id: 'bio', name: '8. Create Bio Signature', action: () => forceOnboardingStep(7) },
        { id: 'interests', name: '9. Choose Interests grid', action: () => forceOnboardingStep(8) },
        { id: 'success', name: '10. Onboarding Success', action: () => forceOnboardingStep(9) },
        { id: 'fb_sync', name: '11. Social FB/IG Sync flow', action: () => forceOnboardingStep(10, 'facebook') },
        { id: 'fb_otp', name: '12. Social SMS Verification', action: () => forceOnboardingStep(2, 'facebook') },
        { id: 'fb_ok_step', name: '13. Sync Account Success', action: () => forceOnboardingStep(9, 'facebook') },
      ]
    },
    {
      category: '2. SOCIAL FEEDS & VIEWER VIEWS',
      screens: [
        { id: 'home', name: '14. Home Feed (Streams)', action: () => forceLoginTab('Home', () => forceHomeFilter('All')) },
        { id: 'create_post', name: '15. Create Post Editor (WriteUp)', action: () => forceLoginEditor('writeup') },
        { id: 'images', name: '16. Images Feed (Liquid masonry)', action: () => forceLoginTab('Images') },
        { id: 'reels_feed', name: '17. Reels Feed (Full Screen loop)', action: () => forceLoginTab('Reels') },
        { id: 'videos_vlog', name: '18. Videos Feed (ConnectX TV)', action: () => forceLoginTab('Videos') },
        { id: 'story_viewer', name: '19. Stories Viewer overlay', action: () => forceStoryViewer() },
        { id: 'connections', name: '20. Connections Hub (Node Peers)', action: () => forceLoginTab('Connects') },
        { id: 'notifications', name: '21. Alerts notifications center', action: () => forceAlertToast() },
      ]
    },
    {
      category: '3. CREATOR MONETIZATION CENTER',
      screens: [
        { id: 'monetize', name: '22. Monetization Dashboard', action: () => forceLoginTab('Monetize') },
        { id: 'earnings', name: '29. Earnings Line Graph Charts', action: () => forceLoginTab('Monetize') },
      ]
    },
    {
      category: '4. SETTINGS & ASSETS PIPELINE',
      screens: [
        { id: 'profile', name: '23. Profile canvas matrix', action: () => forceLoginTab('Profile') },
        { id: 'prof_set', name: '24. Profile Settings list', action: () => forceLoginTab('Settings', () => forceSettingsTab('profile')) },
        { id: 'app_set', name: '25. App Settings options', action: () => forceLoginTab('Settings', () => forceSettingsTab('app')) },
        { id: 'edit_profile_form', name: '24b. Edit Profile Subform', action: () => forceLoginTab('Settings', () => forceSettingsTab('profile', 'Edit Profile')) },
        { id: 'connected_accounts_form', name: '24b. Snyc Connected accounts', action: () => forceLoginTab('Settings', () => forceSettingsTab('profile', 'Connected Accounts')) },
        { id: 'download_data_form', name: '24c. Download encrypted data', action: () => forceLoginTab('Settings', () => forceSettingsTab('profile', 'Download Your Data')) },
        { id: 'create_menu', name: '26. Create Bottom Sheet Grid', action: () => forceCreateSheet() },
        { id: 'upload_reel', name: '27. Upload Reel Studio TIMELINE', action: () => forceLoginEditor('clips') },
        { id: 'upload_video_bar', name: '28. Video uploading Status bar', action: () => forceLoginEditor('video') },
        { id: 'nav_drawer', name: '30. Slider Navigation Drawer', action: () => forceDrawerMenu() },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[#020308] text-white flex select-none overflow-hidden font-sans">
      
      {/* LEFT SPLIT: BEHANCE 4K CONTROLLERS FOR DESKTOP VIEWS (Hidden on narrow viewports) */}
      <aside className="w-[380px] xl:w-[485px] bg-[#030612] border-r border-white/10 hidden lg:flex flex-col justify-start p-5 gap-4 overflow-y-auto shrink-0 select-none">
        
        {/* LOGO & ETHOS HEADER */}
        <div className="flex flex-col gap-1 text-left border-b border-white/5 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-cyan-400 to-pink-500 flex items-center justify-center font-display font-extrabold text-[12px] text-black">X</div>
            <h1 className="text-sm font-display font-black tracking-widest bg-gradient-to-r from-cyan-400 via-blue-500 to-pink-500 bg-clip-text text-transparent">
              CONNECTX SHOWCASE
            </h1>
          </div>
          <span className="text-[10px] text-gray-400 font-mono tracking-wider font-semibold capitalize mt-1">4K High-Fidelity Prototype Navigation Deck</span>
          <span className="text-[9px] text-[#A6E22E] font-mono block tracking-wide mt-0.5">🚀 30/30 Screens Verified Compiling ✓</span>
        </div>

        {/* ACOUSTIC NEON THEME GRADIENTS DISPLAY */}
        <div className="flex flex-col gap-2 bg-black/40 border border-white/5 p-3 rounded-2xl text-left">
          <span className="text-[8.5px] font-mono text-gray-500 uppercase tracking-widest font-black block">🎨 ACOUSTIC NEON PALETTE</span>
          <div className="grid grid-cols-2 gap-1.5 mt-1 font-mono text-[9px]">
            <button 
              onClick={() => handleCopyPalette('#22d3ee', 'CYAN')}
              className="bg-neutral-900 border border-white/5 hover:border-cyan-400/35 p-1.5 rounded-lg flex items-center gap-2 transition-all cursor-pointer text-left group"
            >
              <div className="w-5 h-5 rounded-md bg-[#22d3ee] shadow-[0_0_10px_rgba(34,211,238,0.3)] shrink-0"></div>
              <div>
                <span className="text-gray-400 font-bold block text-[8px] leading-none">Cyber Cyan</span>
                <span className="text-cyan-400 block font-light text-[8px] mt-0.5 group-hover:underline">#22d3ee {copiedToken === 'CYAN' ? '✓' : ''}</span>
              </div>
            </button>

            <button 
              onClick={() => handleCopyPalette('#ec4899', 'PINK')}
              className="bg-neutral-900 border border-white/5 hover:border-pink-400/35 p-1.5 rounded-lg flex items-center gap-2 transition-all cursor-pointer text-left group"
            >
              <div className="w-5 h-5 rounded-md bg-[#ec4899] shadow-[0_0_10px_rgba(236,72,153,0.3)] shrink-0"></div>
              <div>
                <span className="text-gray-400 font-bold block text-[8px] leading-none">Vibe Pink</span>
                <span className="text-pink-400 block font-light text-[8px] mt-0.5 group-hover:underline">#ec4899 {copiedToken === 'PINK' ? '✓' : ''}</span>
              </div>
            </button>
          </div>
        </div>

        {/* INTERACTIVE NAVIGATION CONTROL BUTTON GRID */}
        <div className="flex-grow flex flex-col gap-3 py-1 text-left select-none">
          {showcaseScreens.map((cat, cIdx) => (
            <div key={cIdx} className="flex flex-col gap-1.5">
              <span className="text-[9px] font-mono tracking-widest text-[#66d9ef] uppercase font-black block mb-0.5">{cat.category}</span>
              <div className="grid grid-cols-2 gap-1 text-xs">
                {cat.screens.map((sc) => (
                  <button
                    key={sc.id}
                    onClick={() => {
                      sc.action();
                    }}
                    className="py-1.5 px-2.5 bg-[#050b18] border border-white/5 hover:border-[#ec4899]/35 hover:bg-[#ec4899]/5 rounded-xl transition-all font-semibold font-sans text-left text-gray-300 hover:text-white cursor-pointer hover:shadow-[0_0_8px_rgba(236,72,153,0.08)] scale-100 active:scale-[0.98] leading-tight select-none"
                  >
                    {sc.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* HARDWARE DIRECTIVE FOOTER */}
        <div className="border-t border-white/5 pt-3 text-[9px] font-mono text-gray-500 text-left flex items-center justify-between">
          <span>PIXEL PERFECT FRAME: IPHONE 15 PRO</span>
          <span className="text-cyan-400 tracking-widest animate-pulse uppercase font-bold">● STANDALONE OK</span>
        </div>

      </aside>

      {/* CENTRAL CORE: DYNAMIC PHONE CONTAINER FRAME */}
      <section className="flex-1 min-h-screen bg-[#010205] flex items-center justify-center p-3 sm:p-5 relative overflow-hidden select-none">
        
        {/* Soft immersive ambient cyber colors glow circles in mockup view block */}
        <div className="absolute top-[20%] left-[30%] w-[450px] h-[450px] bg-cyan-400/5 rounded-full blur-[120px] pointer-events-none select-none"></div>
        <div className="absolute bottom-[20%] right-[30%] w-[450px] h-[450px] bg-pink-500/5 rounded-full blur-[140px] pointer-events-none select-none"></div>

        {/* Physical vector mock model bezel around ConnectX container frame */}
        <div className="w-full max-w-[393px] aspect-[393/852] max-h-[92vh] sm:max-h-[852px] bg-black rounded-[48px] p-2.5 ring-12 ring-neutral-900 border-4 border-neutral-700/60 shadow-[0_20px_50px_rgba(0,0,0,0.95)] relative overflow-hidden select-none scale-95 sm:scale-100 transition-transform flex flex-col justify-stretch">
          
          {/* Ambient Titanium frame light reflections inside phone edges */}
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400/25 to-transparent pointer-events-none"></div>
          <div className="absolute bottom-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-pink-500/25 to-transparent pointer-events-none"></div>

          {/* RUN DYNAMIC SECURED NODE REACT APP COMPONENT */}
          <div className="w-full h-full bg-[#020510] rounded-[38px] overflow-hidden flex flex-col relative select-none">
            <ConnectXProvider>
              <AppContent />
            </ConnectXProvider>
          </div>

        </div>

      </section>

    </div>
  );
}
