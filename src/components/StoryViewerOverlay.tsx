import React, { useState, useEffect, useRef } from 'react';
import { useConnectX } from '../utils/stateManager';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trash2, Eye, Send, Play, Pause, AlertCircle, Smile, BarChart3, TrendingUp, Heart, Zap, Share2, Sparkles, Rocket, Target, Coins, Plus, Music, Disc } from 'lucide-react';
import { useHapticFeedback } from '../hooks/useHapticFeedback';

const getThemeStyles = (theme?: string) => {
  switch (theme) {
    case 'cyberpunk':
      return {
        card: 'bg-gradient-to-br from-pink-950/90 via-[#0a0520]/95 to-indigo-950/90 border-pink-500/30 text-white shadow-[0_0_25px_rgba(236,72,153,0.15)]',
        badge: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
        title: 'text-white',
        buttonVoted: 'bg-gradient-to-r from-pink-500 to-indigo-500 text-white border-transparent shadow-[0_0_15px_rgba(236,72,153,0.3)]',
        percent: 'text-pink-400 font-extrabold'
      };
    case 'neon':
      return {
        card: 'bg-gradient-to-br from-[#021d15]/95 via-neutral-950/98 to-[#021d1d]/95 border-emerald-500/30 text-white shadow-[0_0_25px_rgba(16,185,129,0.15)]',
        badge: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        title: 'text-white',
        buttonVoted: 'bg-gradient-to-r from-emerald-400 to-teal-500 text-black border-transparent font-black shadow-[0_0_15px_rgba(52,211,153,0.3)]',
        percent: 'text-emerald-400 font-extrabold'
      };
    case 'sunset':
      return {
        card: 'bg-gradient-to-br from-[#1e0d07]/95 via-neutral-950/98 to-[#1e0712]/95 border-amber-500/30 text-white shadow-[0_0_25px_rgba(245,158,11,0.15)]',
        badge: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
        title: 'text-white',
        buttonVoted: 'bg-gradient-to-r from-amber-400 to-rose-500 text-black border-transparent font-black shadow-[0_0_15px_rgba(245,158,11,0.3)]',
        percent: 'text-amber-400 font-extrabold'
      };
    case 'cosmic':
      return {
        card: 'bg-gradient-to-br from-purple-950/90 via-[#03061c]/95 to-blue-950/90 border-purple-500/30 text-white shadow-[0_0_25px_rgba(168,85,247,0.15)]',
        badge: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
        title: 'text-white',
        buttonVoted: 'bg-gradient-to-r from-purple-600 to-blue-600 text-white border-transparent shadow-[0_0_15px_rgba(168,85,247,0.3)]',
        percent: 'text-purple-300 font-extrabold'
      };
    case 'minimal':
    default:
      return {
        card: 'bg-black/85 border-white/10 text-white shadow-2xl',
        badge: 'text-gray-400 bg-white/5 border-white/10',
        title: 'text-white',
        buttonVoted: 'bg-white text-black border-transparent shadow-lg',
        percent: 'text-white font-extrabold'
      };
  }
};

const BACKGROUND_MUSIC_LIBRARY = [
  { id: 'lofi_chill', title: 'Lofi Chillout Beats', artist: 'Zenith', duration: '1:30', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', genre: 'Lofi / Chill' },
  { id: 'synth_sunset', title: 'Sunset Horizon', artist: 'Glitch Mobius', duration: '2:15', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', genre: 'Synthwave' },
  { id: 'cyber_groove', title: 'Neon Grid Runner', artist: 'Cyberpunk Syndicate', duration: '1:45', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3', genre: 'Electronic' },
  { id: 'cosmic_dream', title: 'Nebula Stardust', artist: 'Astral Echoes', duration: '2:40', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3', genre: 'Ambient / Space' },
  { id: 'acoustic_breeze', title: 'Sunday Coffee', artist: 'Sunny Fields', duration: '1:20', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3', genre: 'Acoustic' },
];

export const StoryViewerOverlay: React.FC = () => {
  const { 
    activeStoryUserId, 
    setActiveStoryUserId, 
    stories, 
    currentUser, 
    deleteStory, 
    viewStory, 
    updateStoryStats, 
    setViewedUserId,
    users,
    updateProfile
  } = useConnectX();

  const [storyIndex, setStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showViewers, setShowViewers] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const [showBoostModal, setShowBoostModal] = useState(false);
  const [selectedBoostTier, setSelectedBoostTier] = useState<'spark' | 'turbo' | 'supernova'>('turbo');
  const [isBoosting, setIsBoosting] = useState(false);
  const [questionReply, setQuestionReply] = useState('');
  const [justVoted, setJustVoted] = useState<{[storyId: string]: number}>({});

  const triggerHaptic = useHapticFeedback();
  const [floatingReactions, setFloatingReactions] = useState<{ id: string; emoji: string; x: number; scale: number }[]>([]);
  const [storyReply, setStoryReply] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Interactive Poll Sticker Creator States
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptionA, setPollOptionA] = useState('Yes');
  const [pollOptionB, setPollOptionB] = useState('No');
  const [pollTheme, setPollTheme] = useState<'cyberpunk' | 'neon' | 'sunset' | 'cosmic' | 'minimal'>('cyberpunk');
  const [pollDuration, setPollDuration] = useState<number>(60); // in seconds
  const [pollHasExpiration, setPollHasExpiration] = useState<boolean>(true);
  const [now, setNow] = useState<number>(Date.now());

  // Background Music States & Ref
  const [showMusicSelector, setShowMusicSelector] = useState(false);
  const [isMusicMuted, setIsMusicMuted] = useState(false);
  const [originalMusic, setOriginalMusic] = useState<any>(null);
  const [previewTrackId, setPreviewTrackId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const REACTION_EMOJIS = [
    { emoji: '❤️', label: 'Love' },
    { emoji: '🔥', label: 'Fire' },
    { emoji: '😂', label: 'Haha' },
    { emoji: '😮', label: 'Wow' },
    { emoji: '👏', label: 'Clap' },
    { emoji: '🎉', label: 'Party' },
    { emoji: '🚀', label: 'Rocket' },
    { emoji: '💯', label: '100' },
  ];

  const handleReact = (emoji: string) => {
    triggerHaptic('medium');
    const id = 'react_' + Date.now() + Math.random();
    setFloatingReactions(prev => [
      ...prev,
      {
        id,
        emoji,
        x: (Math.random() - 0.5) * 180,
        scale: 0.8 + Math.random() * 0.7
      }
    ]);

    const currentLikes = activeStory?.likesCount || 0;
    updateStoryStats(activeStory.id, {
      likesCount: currentLikes + 1
    });

    setTimeout(() => {
      setFloatingReactions(prev => prev.filter(r => r.id !== id));
    }, 2000);
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!storyReply.trim()) return;

    triggerHaptic('success');
    setToastMsg(`Reply sent to @${activeStory.user.username}! 📤`);
    setStoryReply('');
    setTimeout(() => {
      setToastMsg(null);
    }, 2500);
  };

  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Touch gesture state for swipe-down to close
  const touchStartY = useRef<number>(0);
  const touchStartX = useRef<number>(0);

  // Get and sort this user's stories chronologically
  const userStories = stories
    .filter(s => s.user.id === activeStoryUserId)
    .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));

  const activeStory = userStories[storyIndex];

  // Periodically refresh `now` for active story polls with an expiration
  useEffect(() => {
    if (!activeStory?.poll?.expiresAt) return;
    
    // Set immediate initial timestamp
    setNow(Date.now());

    const interval = setInterval(() => {
      setNow(Date.now());
    }, 500);

    return () => clearInterval(interval);
  }, [activeStory?.poll?.expiresAt, activeStory?.id]);

  // 1. Initial configuration or load first unviewed story slide
  useEffect(() => {
    if (userStories.length > 0) {
      // Find the first story slide that has NOT been viewed by the current user
      const firstUnviewedIdx = userStories.findIndex(
        s => !s.viewers.some(v => v.userId === currentUser?.id)
      );
      setStoryIndex(firstUnviewedIdx !== -1 ? firstUnviewedIdx : 0);
      setProgress(0);
    }
  }, [activeStoryUserId]);

  // 2. View story hook - when slide changes, view the story
  useEffect(() => {
    if (activeStory) {
      viewStory(activeStory.id);
      setProgress(0);
    }
  }, [storyIndex, activeStory?.id]);

  // Handle slide transitions
  const handleNextStory = () => {
    if (storyIndex < userStories.length - 1) {
      setStoryIndex(prev => prev + 1);
      setProgress(0);
    } else {
      // No more stories for this user -> Close auto
      setActiveStoryUserId(null);
    }
  };

  const handlePrevStory = () => {
    if (storyIndex > 0) {
      setStoryIndex(prev => prev - 1);
      setProgress(0);
    }
  };

  // 3. Autoplay and timer interval
  useEffect(() => {
    if (!activeStory || isPaused || showViewers || showInsights || showBoostModal || showMusicSelector) {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      return;
    }

    const isVideo = activeStory.mediaType === 'video';
    const totalDuration = isVideo ? 12000 : 5000; // 12s for video, 5s for image
    const stepTime = 100; // Check every 100ms
    const totalSteps = totalDuration / stepTime;

    progressIntervalRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressIntervalRef.current!);
          handleNextStory();
          return 0;
        }
        return prev + (100 / totalSteps);
      });
    }, stepTime);

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [activeStory?.id, isPaused, showViewers, showInsights, showBoostModal, showMusicSelector, storyIndex]);

  // Synchronize playing states of custom video ref if active story has video
  useEffect(() => {
    if (videoRef.current) {
      if (isPaused || showViewers || showInsights || showBoostModal || showMusicSelector) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {});
      }
    }
  }, [isPaused, activeStory?.id, showViewers, showInsights, showBoostModal, showMusicSelector]);

  // Synchronize playing states of background music
  useEffect(() => {
    if (audioRef.current) {
      const shouldPlay = activeStory?.music && !isPaused && !showViewers && !showInsights && !showBoostModal && !showMusicSelector && !isMusicMuted;
      if (shouldPlay) {
        audioRef.current.play().catch(() => {});
      } else {
        audioRef.current.pause();
      }
    }
  }, [
    activeStory?.music?.audioUrl,
    isPaused,
    showViewers,
    showInsights,
    showBoostModal,
    showMusicSelector,
    isMusicMuted,
    activeStoryUserId
  ]);

  if (!activeStoryUserId || userStories.length === 0) {
    return null;
  }

  const isOwner = currentUser?.id === activeStoryUserId;

  // Swipe gesture listeners
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchStartX.current = e.touches[0].clientX;
    // Pause story on hold
    setIsPaused(true);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setIsPaused(false);
    const endY = e.changedTouches[0].clientY;
    const endX = e.changedTouches[0].clientX;
    const diffY = endY - touchStartY.current;
    const diffX = endX - touchStartX.current;

    // Detect solid swipe down (Y-axis diff > 80 pixels)
    if (diffY > 80 && Math.abs(diffY) > Math.abs(diffX)) {
      setActiveStoryUserId(null); // Close
    }
  };

  // Interactive Poll Voting Functionality
  const handleVote = (optionIndex: number) => {
    if (!activeStory.poll || justVoted[activeStory.id] !== undefined) return;

    // Reject voting if the poll timer has expired
    const isExpired = activeStory.poll.expiresAt ? Date.now() >= activeStory.poll.expiresAt : false;
    if (isExpired) {
      triggerHaptic('error');
      return;
    }

    // Update poll counts
    const updatedOptions = activeStory.poll.options.map((opt, oidx) => {
      if (oidx === optionIndex) {
        return { ...opt, votes: opt.votes + 1 };
      }
      return opt;
    });

    updateStoryStats(activeStory.id, {
      poll: {
        ...activeStory.poll,
        options: updatedOptions
      }
    });

    setJustVoted(prev => ({ ...prev, [activeStory.id]: optionIndex }));
  };

  // Interactive Question Sticker Answer Submission
  const handleQuestionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionReply.trim()) return;

    // Simulate appending a viewer response under story statistics securely
    const viewerResponse = {
      userId: currentUser?.id || 'demo_user',
      username: currentUser?.username || 'viewer',
      profilePic: currentUser?.profilePic || '',
      timestamp: 'Just now',
      message: questionReply
    };

    triggerHaptic('success');
    setToastMsg(`Answer sent to @${activeStory.user.username}! 📬`);
    setQuestionReply('');
    setTimeout(() => {
      setToastMsg(null);
    }, 2500);
  };

  // Interactive Poll Sticker Attachment
  const handleAttachPoll = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pollQuestion.trim() || !pollOptionA.trim() || !pollOptionB.trim()) return;

    const expiresAt = pollHasExpiration ? Date.now() + (pollDuration * 1000) : undefined;

    triggerHaptic('success');
    updateStoryStats(activeStory.id, {
      poll: {
        question: pollQuestion.trim(),
        options: [
          { text: pollOptionA.trim(), votes: 0 },
          { text: pollOptionB.trim(), votes: 0 }
        ],
        theme: pollTheme,
        expiresAt,
        durationSeconds: pollHasExpiration ? pollDuration : undefined
      }
    });

    setToastMsg(pollHasExpiration ? `Poll Sticker attached with ${pollDuration}s timer! 📊` : 'Interactive Poll Sticker attached! 📊');
    setShowPollCreator(false);
    setIsPaused(false);

    // Clear inputs
    setPollQuestion('');
    setPollOptionA('Yes');
    setPollOptionB('No');
    setPollTheme('cyberpunk');
    setPollDuration(60);
    setPollHasExpiration(true);

    setTimeout(() => {
      setToastMsg(null);
    }, 2500);
  };

  // Story slide deletion handler
  const handleDeleteSlide = () => {
    const storyIdToDelete = activeStory.id;
    deleteStory(storyIdToDelete);
    
    // Adjust indices or auto close
    if (userStories.length <= 1) {
      setActiveStoryUserId(null);
    } else {
      if (storyIndex >= userStories.length - 1) {
        setStoryIndex(userStories.length - 2);
      }
      setProgress(0);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-[#000000] z-50 flex flex-col justify-between items-center py-6 px-4 select-none animate-in fade-in duration-200"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={() => setIsPaused(true)}
      onMouseUp={() => setIsPaused(false)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Ambient background blur backing visual shadows */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/90 z-10 pointer-events-none"></div>
      <div className="absolute w-[600px] h-[600px] rounded-full bg-yellow-500/5 blur-[150px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

      {/* Floating Add Story Button in top-left area */}
      <div className="absolute top-16 left-4 md:left-8 z-30 pointer-events-auto">
        <button
          id="btn-add-story-floating"
          onClick={(e) => {
            e.stopPropagation();
            triggerHaptic('medium');
            setActiveStoryUserId(null); // Close the story viewer
            if ((window as any).overrideActiveEditor) {
              (window as any).overrideActiveEditor('stories');
            } else if ((window as any).overrideCreateOpen) {
              (window as any).overrideCreateOpen(true);
            }
          }}
          className="flex items-center gap-1.5 px-3 py-2 bg-black/60 hover:bg-black/80 active:scale-95 transition-all border border-white/10 rounded-full text-[10px] font-mono font-bold text-white shadow-[0_4px_12px_rgba(0,0,0,0.5)] backdrop-blur-md cursor-pointer hover:border-pink-500/40 hover:shadow-[0_0_15px_rgba(236,72,153,0.15)] group"
          title="Post a new Story immediately"
        >
          <Plus className="w-3.5 h-3.5 text-pink-500 group-hover:text-pink-400 group-hover:rotate-90 transition-all duration-300 stroke-[3]" />
          <span>Add Story</span>
        </button>
      </div>

      {/* Top Banner Control Panel (Progress indicators and Author Info Row) */}
      <header className="w-full max-w-md z-20 flex flex-col gap-3 pointer-events-auto">
        {/* Progress Bars (Multiple Story indicator bars) */}
        <div className="w-full flex gap-1 h-[2.5px]">
          {userStories.map((st, i) => {
            let barWidth = '0%';
            if (i < storyIndex) barWidth = '100%';
            if (i === storyIndex) barWidth = `${progress}%`;

            return (
              <div key={st.id} className="flex-1 bg-white/20 rounded-full h-full overflow-hidden">
                <div 
                  className="bg-yellow-400 h-full transition-all duration-100 ease-linear"
                  style={{ width: barWidth }}
                ></div>
              </div>
            );
          })}
        </div>

        {/* Profile Card & Info Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              onClick={(e) => {
                e.stopPropagation();
                setViewedUserId(activeStory.user.id);
                setActiveStoryUserId(null);
              }}
              className="w-9 h-9 rounded-full border border-white/25 cursor-pointer hover:scale-103 transition-transform overflow-hidden"
            >
              <img src={activeStory.user.profilePic} className="w-full h-full object-cover" alt="story owner" />
            </div>
            <div className="text-left">
              <h4 
                onClick={(e) => {
                  e.stopPropagation();
                  setViewedUserId(activeStory.user.id);
                  setActiveStoryUserId(null);
                }}
                className="text-xs font-bold text-white leading-none cursor-pointer hover:text-yellow-400 transition-colors"
              >
                {activeStory.user.displayName}
              </h4>
              <span 
                className="text-[10px] font-mono text-gray-400 tracking-wide block mt-0.5"
              >
                @{activeStory.user.username} • {activeStory.timestamp}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
            {/* Add Poll Sticker (Owner only, if no poll exists yet) */}
            {isOwner && !activeStory.poll && (
              <button 
                onClick={() => {
                  triggerHaptic('medium');
                  setShowPollCreator(true);
                  setIsPaused(true);
                }}
                className="flex items-center gap-1 px-2.5 py-1 bg-yellow-400/20 hover:bg-yellow-400/35 border border-yellow-400/35 rounded-full text-[10px] font-mono font-bold text-yellow-400 active:scale-95 transition-all cursor-pointer shadow-sm"
                title="Attach Interactive Poll Sticker"
              >
                <span>📊 Add Poll</span>
              </button>
            )}

            {/* Background Music Selector (Owner only) */}
            {isOwner && (
              <button 
                onClick={() => {
                  triggerHaptic('medium');
                  setOriginalMusic(activeStory.music || null);
                  setPreviewTrackId(activeStory.music?.id || null);
                  setShowMusicSelector(true);
                  setIsPaused(true);
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold active:scale-95 transition-all cursor-pointer shadow-sm border ${
                  activeStory.music 
                    ? 'bg-cyan-500/25 border-cyan-400 text-cyan-300' 
                    : 'bg-cyan-500/15 hover:bg-cyan-500/30 border-cyan-500/35 text-cyan-400'
                }`}
                title={activeStory.music ? "Change Background Music" : "Add Background Music"}
              >
                <Music className="w-3.5 h-3.5" />
                <span>{activeStory.music ? 'Music Attached' : 'Add Music'}</span>
              </button>
            )}

            {/* Viewers panel toggle button (Owner only) */}
            {isOwner && (
              <button 
                onClick={() => setShowViewers(prev => !prev)}
                className="flex items-center gap-1.5 px-3 py-1 bg-white/5 hover:bg-white/10 active:scale-95 transition-all border border-white/10 rounded-full text-[10px] font-mono text-gray-200"
              >
                <Eye className="w-3.5 h-3.5 text-gray-300" />
                <span>{activeStory.viewers?.length || 0}</span>
              </button>
            )}

            {/* Story Insights button (Owner only) */}
            {isOwner && (
              <button 
                onClick={() => {
                  triggerHaptic('medium');
                  setShowInsights(true);
                  setIsPaused(true);
                }}
                className="flex items-center gap-1 px-2.5 py-1 bg-cyan-400/20 hover:bg-cyan-400/35 border border-cyan-400/35 rounded-full text-[10px] font-mono font-bold text-cyan-400 active:scale-95 transition-all cursor-pointer shadow-sm"
                title="View Story Insights"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Insights</span>
              </button>
            )}

            {/* Story Boost button (Owner only) */}
            {isOwner && (
              <button 
                onClick={() => {
                  triggerHaptic('medium');
                  setShowBoostModal(true);
                  setIsPaused(true);
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold active:scale-95 transition-all cursor-pointer shadow-sm border ${
                  activeStory.isBoosted 
                    ? 'bg-purple-500/25 border-purple-400 text-purple-300' 
                    : 'bg-purple-500/15 hover:bg-purple-500/30 border-purple-500/35 text-purple-400'
                }`}
                title="Boost Story Visibility"
              >
                <Zap className={`w-3.5 h-3.5 ${activeStory.isBoosted ? 'fill-purple-400' : ''}`} />
                <span>{activeStory.isBoosted ? 'Boosted' : 'Boost'}</span>
              </button>
            )}

            {/* Global Share button (All users) */}
            <button 
              onClick={() => {
                triggerHaptic('medium');
                setIsPaused(true);
                if ((window as any).triggerGlobalShare) {
                  (window as any).triggerGlobalShare(activeStory.id, 'story');
                } else if (navigator.share) {
                  navigator.share({
                    title: activeStory.caption || 'ConnectX Story',
                    text: activeStory.caption || 'Check out this ConnectX Story!',
                    url: window.location.href
                  }).catch(err => console.log(err));
                } else {
                  navigator.clipboard.writeText(window.location.href);
                  alert("Link copied to clipboard!");
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-[10px] font-mono text-gray-200 active:scale-95 transition-all cursor-pointer shadow-sm"
              title="Share this Story"
            >
              <Share2 className="w-3.5 h-3.5 text-gray-300" />
              <span>Share</span>
            </button>

            {/* Delete button (Owner only) */}
            {isOwner && (
              <button 
                onClick={handleDeleteSlide}
                className="p-1.5 rounded-full bg-white/5 hover:bg-red-500/20 text-gray-300 hover:text-red-400 transition-colors"
                title="Delete this Story"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            {/* Close Overlay button */}
            <button 
              onClick={() => setActiveStoryUserId(null)}
              className="p-1.5 rounded-full bg-white/5 text-gray-300 hover:text-white hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Core Media Display Slide Container (Split Left/Right sides for Navigation) */}
      <div className="flex-1 w-full max-w-md flex flex-col justify-center items-center z-20 relative p-4">
        {/* Left Side Tab Navigation Overlay (30% width) */}
        <div 
          onClick={(e) => { e.stopPropagation(); handlePrevStory(); }}
          className="absolute left-0 top-0 bottom-0 w-[30%] z-20 cursor-pointer pointer-events-auto"
        />

        {/* Right Side Tab Navigation Overlay (70% width, except for interactive buttons) */}
        <div 
          onClick={(e) => { e.stopPropagation(); handleNextStory(); }}
          className="absolute right-0 top-0 bottom-0 w-[70%] z-10 cursor-pointer pointer-events-auto"
        />

        {/* Autoplay Pause indicators overlay */}
        {isPaused && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md border border-white/10 rounded-full py-1 px-3 z-30 flex items-center gap-1 pointer-events-none">
            <Pause className="w-2.5 h-2.5 text-yellow-400 animate-pulse" />
            <span className="text-[8px] font-mono font-bold text-gray-300 uppercase tracking-widest">Hold Paused</span>
          </div>
        )}

        {/* Actual background audio player element */}
        <audio 
          ref={audioRef} 
          src={activeStory?.music?.audioUrl} 
          loop 
          muted={isMusicMuted} 
        />

        {/* Floating Background Music Sticker */}
        {activeStory.music && (
          <div 
            onClick={(e) => {
              e.stopPropagation();
              triggerHaptic('light');
              setIsMusicMuted(!isMusicMuted);
            }}
            className="absolute top-4 right-4 bg-black/60 hover:bg-black/85 border border-white/10 rounded-full py-1.5 pl-2 pr-3.5 z-30 flex items-center gap-2 pointer-events-auto shadow-[0_4px_12px_rgba(0,0,0,0.5)] backdrop-blur-md cursor-pointer group hover:border-cyan-500/30 transition-all active:scale-95 select-none"
            title="Click to Mute/Unmute Background Music"
          >
            {/* Spinning vinyl record icon */}
            <div className="relative flex items-center justify-center">
              <motion.div
                animate={{ rotate: isMusicMuted ? 0 : 360 }}
                transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                className="w-7 h-7 rounded-full bg-neutral-900 border border-neutral-700 shadow-md flex items-center justify-center overflow-hidden"
              >
                <Disc className={`w-5 h-5 ${isMusicMuted ? 'text-gray-500' : 'text-cyan-400'} stroke-[2]`} />
                {/* Center hole of the record */}
                <div className="absolute w-1.5 h-1.5 rounded-full bg-black border border-neutral-800" />
              </motion.div>
              {/* Music notes animation when playing */}
              {!isMusicMuted && (
                <>
                  <motion.span
                    animate={{ y: [-5, -15], x: [0, -5], opacity: [0, 1, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5, delay: 0 }}
                    className="absolute text-[8px] text-cyan-300 pointer-events-none"
                  >
                    🎵
                  </motion.span>
                  <motion.span
                    animate={{ y: [-5, -12], x: [0, 5], opacity: [0, 1, 0] }}
                    transition={{ repeat: Infinity, duration: 1.8, delay: 0.6 }}
                    className="absolute text-[8px] text-pink-300 pointer-events-none"
                  >
                    🎶
                  </motion.span>
                </>
              )}
            </div>

            <div className="flex flex-col text-left leading-tight">
              <span className="text-[9px] font-bold text-white max-w-[100px] truncate">
                {activeStory.music.title}
              </span>
              <span className="text-[7px] text-gray-400 font-mono">
                {activeStory.music.artist} {isMusicMuted ? '• Muted' : ''}
              </span>
            </div>
          </div>
        )}

        {/* Media elements */}
        {activeStory.mediaType === 'video' ? (
          <video
            ref={videoRef}
            src={activeStory.mediaUrl}
            autoPlay
            playsInline
            controls={false}
            className="w-full h-[65vh] object-cover rounded-3xl border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.8)] z-0"
            onEnded={handleNextStory}
            referrerPolicy="no-referrer"
          />
        ) : (
          <img 
            src={activeStory.mediaUrl} 
            alt="Story Content" 
            className="w-full h-[65vh] object-cover rounded-3xl border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.8)] z-0" 
            referrerPolicy="no-referrer"
          />
        )}

        {/* Floating Reactions Canvas */}
        <div className="absolute inset-x-0 bottom-6 top-0 pointer-events-none z-30 overflow-hidden rounded-3xl">
          <AnimatePresence>
            {floatingReactions.map((reaction) => (
              <motion.div
                key={reaction.id}
                initial={{ 
                  opacity: 0, 
                  y: '100%', 
                  x: reaction.x, 
                  scale: 0.2, 
                  rotate: 0 
                }}
                animate={{ 
                  opacity: [0, 1, 1, 0],
                  y: ['100%', '60%', '30%', '-20%'],
                  x: [reaction.x, reaction.x + 30, reaction.x - 20, reaction.x + 10],
                  scale: [0.2, reaction.scale, reaction.scale * 1.15, reaction.scale * 0.75],
                  rotate: [0, (Math.random() - 0.5) * 60, (Math.random() - 0.5) * 120]
                }}
                exit={{ opacity: 0 }}
                transition={{ 
                  duration: 2.2, 
                  ease: "easeOut"
                }}
                className="absolute left-1/2 -translate-x-1/2 text-5xl select-none filter drop-shadow-[0_4px_15px_rgba(0,0,0,0.6)]"
              >
                {reaction.emoji}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Floating Story Caption Overlay */}
        {activeStory.caption && (
          <div className="absolute bottom-8 left-6 right-6 p-4 rounded-2xl bg-black/70 backdrop-blur-md border border-white/10 z-30 pointer-events-auto shadow-2xl">
            <p className="text-xs leading-relaxed text-white text-center font-semibold">
              {activeStory.caption}
            </p>
          </div>
        )}

        {/* Interactive Poll Sticker Layer */}
        {activeStory.poll && (() => {
          const styles = getThemeStyles(activeStory.poll.theme);
          const expiresAt = activeStory.poll.expiresAt;
          const isExpired = expiresAt ? now >= expiresAt : false;
          const timeLeftMs = expiresAt ? Math.max(0, expiresAt - now) : 0;
          const totalSecs = Math.ceil(timeLeftMs / 1000);
          
          let timerString = '';
          if (expiresAt) {
            if (isExpired) {
              timerString = 'Expired 🔴';
            } else if (totalSecs >= 3600) {
              const hrs = Math.floor(totalSecs / 3600);
              const mins = Math.floor((totalSecs % 3600) / 60);
              const secs = totalSecs % 60;
              timerString = `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
            } else {
              const mins = Math.floor(totalSecs / 60);
              const secs = totalSecs % 60;
              timerString = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
            }
          }

          const hasVoted = justVoted[activeStory.id] !== undefined;
          const shouldShowResults = hasVoted || isExpired || isOwner;

          return (
            <div 
              onClick={e => e.stopPropagation()}
              className={`absolute top-1/3 left-6 right-6 p-4 rounded-2xl border backdrop-blur-xl shadow-2xl flex flex-col gap-3 z-30 pointer-events-auto transition-all duration-300 ${styles.card}`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[8px] uppercase tracking-widest font-mono font-black py-0.5 px-2 rounded border leading-none ${styles.badge}`}>
                  Interactive Poll
                </span>
                
                {/* Real-time total vote counter badge & Timer badge */}
                <div className="flex items-center gap-1.5">
                  {expiresAt && (
                    <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded flex items-center gap-1 border leading-none ${
                      isExpired 
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' 
                        : 'bg-yellow-400/10 border-yellow-400/30 text-yellow-300 animate-pulse'
                    }`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      <span>{isExpired ? 'Frozen' : timerString}</span>
                    </span>
                  )}

                  <div className="text-[8px] font-mono font-bold text-gray-400 flex items-center gap-1 leading-none">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <span>
                      {activeStory.poll.options.reduce((sum, o) => sum + o.votes, 0)} votes
                    </span>
                  </div>
                </div>
              </div>
              
              <h5 className={`text-xs font-bold text-center leading-normal px-2 ${styles.title}`}>
                {activeStory.poll.question}
              </h5>
              
              <div className="grid grid-cols-2 gap-2 mt-1">
                {activeStory.poll.options.map((opt, oindex) => {
                  const votedForThis = justVoted[activeStory.id] === oindex;

                  // Total votes calculations
                  const baseTotal = activeStory.poll!.options.reduce((sum, o) => sum + o.votes, 0);
                  const percent = baseTotal > 0 ? Math.round((opt.votes / baseTotal) * 100) : 0;

                  return (
                    <button
                      key={oindex}
                      disabled={shouldShowResults}
                      onClick={() => handleVote(oindex)}
                      className={`relative overflow-hidden py-3 px-3 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                        votedForThis
                          ? styles.buttonVoted + ' animate-pulse'
                          : shouldShowResults
                            ? 'bg-white/5 border-white/5 text-gray-400'
                            : 'bg-white/5 border-white/10 text-gray-200 hover:bg-white/10'
                      } ${shouldShowResults ? 'cursor-default' : 'hover:scale-102 active:scale-98'}`}
                    >
                      {/* Animated vote progress background bar if voted or expired */}
                      {shouldShowResults && (
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percent}%` }}
                          transition={{ duration: 0.6, ease: 'easeOut' }}
                          className={`absolute inset-y-0 left-0 opacity-15 pointer-events-none ${
                            votedForThis ? 'bg-white' : 'bg-yellow-400'
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      )}

                      <div className="relative z-10 flex flex-col items-center">
                        <span className="truncate max-w-full text-center block w-full">{opt.text}</span>
                        {shouldShowResults && (
                          <span className={`text-[10px] font-mono mt-0.5 ${votedForThis ? 'text-inherit opacity-90 font-black' : styles.percent}`}>
                            {percent}%
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Countdown Visual Progress Bar */}
              {expiresAt && !isExpired && activeStory.poll.durationSeconds && (
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mt-1">
                  <motion.div 
                    initial={false}
                    animate={{ width: `${(totalSecs / activeStory.poll.durationSeconds) * 100}%` }}
                    transition={{ duration: 0.5, ease: 'linear' }}
                    className="h-full bg-gradient-to-r from-yellow-400 to-amber-500"
                  />
                </div>
              )}

              {/* Creator Real-time Poll Visual Bar Chart */}
              {isOwner && (
                <div className="mt-2.5 pt-2.5 border-t border-white/10 flex flex-col gap-2 text-left">
                  <div className="flex items-center justify-between">
                    <span className={`text-[9px] font-mono font-black uppercase tracking-wider flex items-center gap-1.5 ${
                      activeStory.poll.theme === 'sunset' ? 'text-orange-400' :
                      activeStory.poll.theme === 'neon' ? 'text-pink-400' :
                      activeStory.poll.theme === 'cosmic' ? 'text-violet-400' :
                      activeStory.poll.theme === 'minimal' ? 'text-white' : 'text-cyan-400'
                    }`}>
                      <BarChart3 className="w-3.5 h-3.5 animate-pulse" /> Real-time Response Bar Chart
                    </span>
                    <span className="text-[8px] font-mono text-gray-400 font-bold">
                      {activeStory.poll.options.reduce((sum, o) => sum + o.votes, 0)} total votes
                    </span>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    {activeStory.poll.options.map((opt, oindex) => {
                      const baseTotal = activeStory.poll!.options.reduce((sum, o) => sum + o.votes, 0);
                      const percent = baseTotal > 0 ? Math.round((opt.votes / baseTotal) * 100) : 0;
                      
                      // Theme-based bar color gradients
                      let barColorClass = "bg-gradient-to-r from-cyan-500 to-blue-500 shadow-[0_0_8px_rgba(6,182,212,0.2)]";
                      let textColorClass = "text-cyan-400";
                      
                      if (activeStory.poll!.theme === 'sunset') {
                        barColorClass = "bg-gradient-to-r from-orange-500 to-rose-500 shadow-[0_0_8px_rgba(249,115,22,0.2)]";
                        textColorClass = "text-orange-400";
                      } else if (activeStory.poll!.theme === 'neon') {
                        barColorClass = "bg-gradient-to-r from-pink-500 to-purple-500 shadow-[0_0_8px_rgba(236,72,153,0.2)]";
                        textColorClass = "text-pink-400";
                      } else if (activeStory.poll!.theme === 'cosmic') {
                        barColorClass = "bg-gradient-to-r from-violet-500 to-fuchsia-500 shadow-[0_0_8px_rgba(139,92,246,0.2)]";
                        textColorClass = "text-violet-400";
                      } else if (activeStory.poll!.theme === 'minimal') {
                        barColorClass = "bg-gradient-to-r from-gray-400 to-white shadow-[0_0_8px_rgba(255,255,255,0.1)]";
                        textColorClass = "text-white";
                      }

                      return (
                        <div key={oindex} className="flex flex-col gap-1">
                          <div className="flex items-center justify-between text-[10px] font-bold">
                            <span className="text-gray-200 truncate max-w-[70%]">{opt.text}</span>
                            <span className={`font-mono font-black ${textColorClass}`}>
                              {opt.votes} ({percent}%)
                            </span>
                          </div>
                          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden border border-white/5 relative">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${percent}%` }}
                              transition={{ duration: 0.8, ease: "easeOut" }}
                              className={`h-full rounded-full ${barColorClass}`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Expired Status footer */}
              {expiresAt && isExpired && (
                <div className="text-center text-[9px] text-rose-400 font-mono font-bold mt-1 uppercase tracking-wider bg-rose-500/10 py-1.5 rounded-lg border border-rose-500/20">
                  ⚠️ Poll Expiration reached. Voting frozen.
                </div>
              )}
            </div>
          );
        })()}

        {/* Interactive Ask Sticker Question Layer */}
        {activeStory.questionPrompt && (
          <div 
            onClick={e => e.stopPropagation()}
            className="absolute top-1/4 left-6 right-6 p-4 rounded-2xl bg-gradient-to-tr from-neutral-900 via-[#0a0f24] to-neutral-950 border border-white/15 backdrop-blur-xl shadow-2xl flex flex-col gap-3 items-center z-30 pointer-events-auto"
          >
            <div className="w-8 h-8 rounded-full bg-yellow-400/10 border border-yellow-400/25 flex items-center justify-center animate-pulse shadow-sm">
              <Smile className="w-4 h-4 text-yellow-400" />
            </div>
            <span className="text-[8px] uppercase tracking-widest text-yellow-400 font-mono font-bold leading-none">Creator Question</span>
            <h5 className="text-xs font-bold text-white text-center leading-normal px-2 mt-0.5">{activeStory.questionPrompt}</h5>
            
            <form onSubmit={handleQuestionSubmit} className="w-full flex gap-1 bg-white/5 border border-white/10 rounded-xl px-2.5 py-1.5 focus-within:border-yellow-400 transition-colors">
              <input
                type="text"
                placeholder="Type response anonymously..."
                value={questionReply}
                onChange={(e) => setQuestionReply(e.target.value)}
                className="bg-transparent border-none text-xs text-white grow outline-none placeholder:text-gray-500"
              />
              <button
                type="submit"
                disabled={!questionReply.trim()}
                className="p-1 px-2.5 bg-yellow-400 rounded-lg text-[9px] font-bold text-black hover:bg-yellow-500 disabled:opacity-45 transition-all"
              >
                Send
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Slide-Up Viewer Draw Panel layout (Story details & viewers ledger) */}
      <AnimatePresence>
        {showViewers && isOwner && (
          <motion.div 
            initial={{ translateY: '100%' }}
            animate={{ translateY: '0%' }}
            exit={{ translateY: '100%' }}
            transition={{ type: 'spring', damping: 20 }}
            onClick={e => e.stopPropagation()}
            className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-neutral-950 border-t border-white/15 rounded-t-3xl z-40 p-5 pb-8 flex flex-col gap-4 text-left shadow-2xl pointer-events-auto"
          >
            <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-yellow-400 animate-pulse" />
                <h3 className="text-xs font-extrabold text-white uppercase tracking-wider font-mono">Story Viewers Ledger</h3>
              </div>
              <button 
                onClick={() => setShowViewers(false)}
                className="p-1 rounded-full bg-white/5 text-gray-400 hover:text-white text-xs font-mono px-2"
              >
                Dismiss
              </button>
            </div>

            <div className="overflow-y-auto max-h-[30vh] flex flex-col gap-2 no-scrollbar pr-1">
              {!activeStory.viewers || activeStory.viewers.length === 0 ? (
                <div className="py-6 text-center text-gray-500 text-5xs font-mono uppercase tracking-widest flex flex-col gap-1 items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-neutral-600 mb-1" />
                  <span>No viewers yet index</span>
                  <span className="text-[8px] text-gray-600 normal-case mt-0.5">Share with connects to begin streaming metrics.</span>
                </div>
              ) : (
                activeStory.viewers.map((viewer) => {
                  const matchingUser = users.find(u => u.id === viewer.userId);
                  return (
                    <div 
                      key={viewer.userId} 
                      className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 hover:bg-white/10 transition-all cursor-pointer"
                      onClick={() => {
                        setViewedUserId(viewer.userId);
                        setActiveStoryUserId(null); // Close story viewer
                        setShowViewers(false);
                      }}
                    >
                      <div className="flex items-center gap-2.5">
                        <img src={viewer.profilePic} className="w-7 h-7 rounded-full object-cover border border-white/10" alt="viewer profile pic" />
                        <div>
                          <span className="font-bold text-xs text-white block leading-none">{viewer.username}</span>
                          <span className="text-[9px] text-gray-450 font-mono mt-0.5 block">Node ID Connect</span>
                        </div>
                      </div>
                      <span className="text-5xs text-gray-500 font-mono">{viewer.timestamp || 'Just now'}</span>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Slide-Up Story Insights Panel */}
      <AnimatePresence>
        {showInsights && isOwner && (
          <motion.div 
            initial={{ translateY: '100%' }}
            animate={{ translateY: '0%' }}
            exit={{ translateY: '100%' }}
            transition={{ type: 'spring', damping: 20 }}
            onClick={e => e.stopPropagation()}
            className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-neutral-950 border-t border-white/15 rounded-t-3xl z-50 p-5 pb-8 flex flex-col gap-4 text-left shadow-2xl pointer-events-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-cyan-400 animate-pulse" />
                <h3 className="text-xs font-extrabold text-white uppercase tracking-wider font-mono">Story Performance Insights</h3>
              </div>
              <button 
                onClick={() => {
                  triggerHaptic('light');
                  setShowInsights(false);
                  setIsPaused(false);
                }}
                className="p-1.5 rounded-full bg-white/5 text-gray-400 hover:text-white text-xs font-mono px-3 cursor-pointer"
              >
                Dismiss
              </button>
            </div>

            {/* Content Body */}
            <div className="flex flex-col gap-4 overflow-y-auto max-h-[45vh] no-scrollbar">
              
              {/* Highlight Cards Row */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="bg-white/5 border border-white/5 p-3 rounded-xl flex flex-col gap-1 text-center">
                  <span className="text-[9px] uppercase tracking-wider text-gray-400 font-mono">Total Views</span>
                  <span className="text-base font-extrabold text-cyan-400 font-mono">{activeStory.viewers?.length || 0}</span>
                  <span className="text-[8px] text-gray-500 font-mono">Unique connects</span>
                </div>
                <div className="bg-white/5 border border-white/5 p-3 rounded-xl flex flex-col gap-1 text-center">
                  <span className="text-[9px] uppercase tracking-wider text-gray-400 font-mono">Completion</span>
                  <span className="text-base font-extrabold text-yellow-400 font-mono">
                    {activeStory ? (85 + (activeStory.id.charCodeAt(activeStory.id.length - 1) || 0) % 13) : 90}%
                  </span>
                  <span className="text-[8px] text-gray-500 font-mono">Full-duration</span>
                </div>
                <div className="bg-white/5 border border-white/5 p-3 rounded-xl flex flex-col gap-1 text-center">
                  <span className="text-[9px] uppercase tracking-wider text-gray-400 font-mono">Impressions</span>
                  <span className="text-base font-extrabold text-pink-400 font-mono">
                    {Math.round((activeStory.viewers?.length || 0) * 1.35)}
                  </span>
                  <span className="text-[8px] text-gray-500 font-mono">Total reach</span>
                </div>
              </div>

              {/* Completion Progress Bar */}
              <div className="bg-white/5 border border-white/5 p-3.5 rounded-xl flex flex-col gap-2">
                <div className="flex items-center justify-between text-[10px] font-mono uppercase font-bold text-gray-300">
                  <span className="flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5 text-yellow-400" /> View Retention</span>
                  <span className="text-yellow-400">
                    {activeStory ? (85 + (activeStory.id.charCodeAt(activeStory.id.length - 1) || 0) % 13) : 90}% Completion Rate
                  </span>
                </div>
                <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${activeStory ? (85 + (activeStory.id.charCodeAt(activeStory.id.length - 1) || 0) % 13) : 90}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="bg-gradient-to-r from-yellow-400 to-amber-500 h-full rounded-full"
                  />
                </div>
                <p className="text-[9px] text-gray-400 leading-normal">
                  Most viewers stayed through the entire {activeStory.mediaType === 'video' ? '12-second video' : '5-second slide'}! Your story is performing in the <span className="text-yellow-400 font-bold">top 15%</span> of design creators.
                </p>
              </div>

              {/* Reaction Breakdown Panel */}
              <div className="bg-white/5 border border-white/5 p-3.5 rounded-xl flex flex-col gap-3">
                <span className="text-[10px] font-mono font-bold uppercase text-gray-300 flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-pink-500" /> Reaction Breakdown
                </span>
                
                {(() => {
                  const likes = activeStory.likesCount || 0;
                  if (likes === 0) {
                    return (
                      <div className="py-4 text-center text-gray-500 text-[10px] font-mono normal-case">
                        No active reactions yet on this slide. Viewers can react using the tray below!
                      </div>
                    );
                  }

                  const loveReacts = Math.ceil(likes * 0.45);
                  const fireReacts = Math.floor(likes * 0.30);
                  const wowReacts = Math.floor(likes * 0.15);
                  const clapReacts = Math.max(0, likes - (loveReacts + fireReacts + wowReacts));

                  return (
                    <div className="flex flex-col gap-2">
                      {[
                        { emoji: '❤️', label: 'Love / Like', count: loveReacts, color: 'bg-red-500' },
                        { emoji: '🔥', label: 'Fire', count: fireReacts, color: 'bg-orange-500' },
                        { emoji: '😮', label: 'Wow', count: wowReacts, color: 'bg-yellow-500' },
                        { emoji: '👏', label: 'Clap', count: clapReacts, color: 'bg-purple-500' },
                      ].map((react) => {
                        const pct = Math.round((react.count / likes) * 100) || 0;
                        return (
                          <div key={react.emoji} className="flex items-center justify-between gap-3 text-xs font-medium">
                            <div className="flex items-center gap-2 w-24 shrink-0">
                              <span className="text-sm">{react.emoji}</span>
                              <span className="text-[10px] text-gray-300 font-semibold truncate">{react.label}</span>
                            </div>
                            
                            <div className="grow bg-white/10 h-1.5 rounded-full overflow-hidden">
                              <div className={`${react.color} h-full rounded-full`} style={{ width: `${pct}%` }} />
                            </div>

                            <span className="w-12 text-right text-[10px] font-mono font-bold text-gray-300">
                              {react.count} ({pct}%)
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              {/* Extended Metrics: Shares, Question Replies, and Poll statistics */}
              <div className="bg-white/5 border border-white/5 p-3.5 rounded-xl flex flex-col gap-2.5">
                <span className="text-[10px] font-mono font-bold uppercase text-gray-300 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-cyan-400" /> Interactive Stickiness
                </span>
                
                <div className="grid grid-cols-2 gap-3 mt-1 text-xs">
                  <div className="flex justify-between items-center bg-black/35 border border-white/5 p-2 rounded-lg">
                    <span className="text-gray-400 text-[10px] font-medium">Shares</span>
                    <span className="font-mono font-bold text-white text-xs">{activeStory.sharesCount || 0}</span>
                  </div>
                  <div className="flex justify-between items-center bg-black/35 border border-white/5 p-2 rounded-lg">
                    <span className="text-gray-400 text-[10px] font-medium">Replies Received</span>
                    <span className="font-mono font-bold text-white text-xs">{activeStory.repliesCount || 0}</span>
                  </div>
                  
                  {activeStory.poll && (
                    <div className="col-span-2 flex justify-between items-center bg-black/35 border border-white/5 p-2 rounded-lg">
                      <span className="text-gray-400 text-[10px] font-medium">Interactive Poll Votes</span>
                      <span className="font-mono font-bold text-yellow-400 text-xs">
                        {activeStory.poll.options.reduce((sum: number, opt: any) => sum + opt.votes, 0)} total (
                        {activeStory.viewers?.length > 0 ? Math.round((activeStory.poll.options.reduce((sum: number, opt: any) => sum + opt.votes, 0) / activeStory.viewers.length) * 100) : 0}% Response)
                      </span>
                    </div>
                  )}

                  {activeStory.questionPrompt && (
                    <div className="col-span-2 flex justify-between items-center bg-black/35 border border-white/5 p-2 rounded-lg">
                      <span className="text-gray-400 text-[10px] font-medium">Ask Sticker Answer Rate</span>
                      <span className="font-mono font-bold text-yellow-400 text-xs">
                        {activeStory.viewers?.length > 0 ? Math.round(((activeStory.repliesCount || 0) / activeStory.viewers.length) * 100) : 0}% Engagement
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Poll Visual Response Bar Chart */}
              {activeStory.poll && (
                <div className="bg-white/5 border border-white/5 p-3.5 rounded-xl flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase text-gray-300 flex items-center gap-1.5">
                      <BarChart3 className="w-3.5 h-3.5 text-yellow-400 animate-pulse" /> Poll Results Chart
                    </span>
                    <span className="text-[10px] font-mono font-bold text-yellow-400">
                      {activeStory.poll.options.reduce((sum: number, o: any) => sum + o.votes, 0)} total votes
                    </span>
                  </div>

                  <div className="bg-black/40 border border-white/5 p-3 rounded-lg flex flex-col gap-3.5">
                    <div className="flex flex-col gap-1">
                      <span className="text-[8px] font-mono font-black uppercase tracking-widest text-gray-500">Poll Question</span>
                      <h4 className="text-xs font-bold text-white leading-normal">
                        "{activeStory.poll.question}"
                      </h4>
                    </div>

                    <div className="flex flex-col gap-3">
                      {activeStory.poll.options.map((opt: any, oidx: number) => {
                        const totalVotes = activeStory.poll!.options.reduce((sum: number, o: any) => sum + o.votes, 0);
                        const pct = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
                        
                        // Select a unique professional gradient for each bar in the chart
                        const barColors = [
                          'bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-500 shadow-[0_0_12px_rgba(34,211,238,0.2)]',
                          'bg-gradient-to-r from-pink-400 via-rose-500 to-red-500 shadow-[0_0_12px_rgba(244,63,94,0.2)]',
                          'bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 shadow-[0_0_12px_rgba(245,158,11,0.2)]',
                          'bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                        ];
                        const textColors = [
                          'text-cyan-400',
                          'text-pink-400',
                          'text-amber-400',
                          'text-emerald-400'
                        ];
                        
                        const barColor = barColors[oidx % barColors.length];
                        const textColor = textColors[oidx % textColors.length];

                        return (
                          <div key={oidx} className="flex flex-col gap-1.5">
                            <div className="flex items-center justify-between text-xs font-medium">
                              <span className="text-gray-200 truncate max-w-[65%] font-bold">{opt.text}</span>
                              <span className={`font-mono text-[10px] font-black ${textColor}`}>
                                {opt.votes} {opt.votes === 1 ? 'vote' : 'votes'} ({pct}%)
                              </span>
                            </div>
                            
                            <div className="w-full bg-white/5 h-3 rounded-full overflow-hidden border border-white/5 relative">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 1.0, delay: oidx * 0.15, ease: "easeOut" }}
                                className={`h-full rounded-full ${barColor}`}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  <p className="text-[9px] text-gray-400 leading-normal text-center italic mt-0.5 font-mono">
                    💡 This visual bar chart updates in real-time as users cast votes.
                  </p>
                </div>
              )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Slide-Up Background Music Selection Panel */}
      <AnimatePresence>
        {showMusicSelector && isOwner && (
          <motion.div 
            initial={{ translateY: '100%' }}
            animate={{ translateY: '0%' }}
            exit={{ translateY: '100%' }}
            transition={{ type: 'spring', damping: 20 }}
            onClick={e => e.stopPropagation()}
            className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-neutral-950 border-t border-white/15 rounded-t-3xl z-50 p-5 pb-8 flex flex-col gap-4 text-left shadow-2xl pointer-events-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4 text-cyan-400 animate-pulse" />
                <h3 className="text-xs font-extrabold text-white uppercase tracking-wider font-mono">Select Background Music</h3>
              </div>
              <button 
                onClick={() => {
                  triggerHaptic('light');
                  // Revert to original music track
                  updateStoryStats(activeStory.id, {
                    music: originalMusic || undefined
                  });
                  setShowMusicSelector(false);
                  setIsPaused(false);
                }}
                className="p-1.5 rounded-full bg-white/5 text-gray-400 hover:text-white text-xs font-mono px-3 cursor-pointer"
              >
                Cancel
              </button>
            </div>

            {/* List of Tracks */}
            <div className="flex flex-col gap-2.5 overflow-y-auto max-h-[40vh] no-scrollbar py-1">
              {/* Option to clear/remove music */}
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('medium');
                  setPreviewTrackId(null);
                  updateStoryStats(activeStory.id, {
                    music: undefined
                  });
                }}
                className={`flex items-center justify-between p-3 rounded-2xl border transition-all text-left ${
                  previewTrackId === null
                    ? 'bg-red-500/10 border-red-500/40 text-red-400 font-extrabold'
                    : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:border-white/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">No Background Music</h4>
                    <p className="text-[10px] text-gray-500 font-mono mt-0.5">Remove soundtrack from this story slide</p>
                  </div>
                </div>
                {previewTrackId === null && (
                  <span className="text-[9px] font-mono font-black text-red-400 uppercase tracking-widest bg-red-500/15 px-2 py-0.5 rounded border border-red-500/20">Selected</span>
                )}
              </button>

              {/* Music Catalog list */}
              {BACKGROUND_MUSIC_LIBRARY.map((track) => {
                const isSelected = previewTrackId === track.id;
                return (
                  <button
                    key={track.id}
                    type="button"
                    onClick={() => {
                      triggerHaptic('medium');
                      setPreviewTrackId(track.id);
                      updateStoryStats(activeStory.id, {
                        music: track
                      });
                    }}
                    className={`flex items-center justify-between p-3 rounded-2xl border transition-all text-left ${
                      isSelected
                        ? 'bg-cyan-500/10 border-cyan-400 text-cyan-300 font-bold'
                        : 'bg-white/5 border-white/5 text-gray-300 hover:bg-white/10 hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Album Art mockup */}
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center relative overflow-hidden ${
                        isSelected 
                          ? 'bg-cyan-500/20 border border-cyan-400/30' 
                          : 'bg-white/5 border border-white/10'
                      }`}>
                        <Disc className={`w-5 h-5 ${isSelected ? 'text-cyan-400 animate-spin' : 'text-gray-400'}`} style={{ animationDuration: '3s' }} />
                        {/* Tiny music note badge */}
                        <div className="absolute bottom-0 right-0 bg-neutral-950 p-0.5 rounded-tl-md">
                          <Music className="w-2 h-2 text-cyan-400" />
                        </div>
                      </div>

                      <div className="flex flex-col">
                        <h4 className="text-xs font-bold text-white flex items-center gap-1.5 leading-none">
                          {track.title}
                        </h4>
                        <span className="text-[10px] text-gray-400 font-mono mt-1">
                          {track.artist} • <span className="text-cyan-400/80">{track.genre}</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-mono text-gray-500">{track.duration}</span>
                      {isSelected && (
                        <div className="flex items-center gap-1">
                          {/* Cute animated CSS visualizer bar graph */}
                          <div className="flex gap-0.5 items-end h-2.5">
                            <span className="w-0.5 bg-cyan-400 rounded-full animate-bounce" style={{ height: '100%', animationDelay: '0.1s', animationDuration: '0.8s' }} />
                            <span className="w-0.5 bg-cyan-400 rounded-full animate-bounce" style={{ height: '70%', animationDelay: '0.3s', animationDuration: '0.6s' }} />
                            <span className="w-0.5 bg-cyan-400 rounded-full animate-bounce" style={{ height: '85%', animationDelay: '0.2s', animationDuration: '0.7s' }} />
                          </div>
                          <span className="text-[8px] font-mono uppercase tracking-widest bg-cyan-400/20 text-cyan-300 border border-cyan-400/30 px-1.5 py-0.5 rounded ml-1 leading-none">
                            Playing
                          </span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Bottom Actions Row */}
            <div className="flex items-center gap-2.5 border-t border-white/5 pt-3.5 mt-1.5">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  // Revert to original music state
                  updateStoryStats(activeStory.id, {
                    music: originalMusic || undefined
                  });
                  setShowMusicSelector(false);
                  setIsPaused(false);
                }}
                className="flex-1 py-3 rounded-xl border border-white/10 text-center text-xs font-bold font-mono text-gray-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
              >
                Cancel & Revert
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic('success');
                  // Keep whatever is currently selected/playing
                  setToastMsg(previewTrackId ? 'Background Music added successfully! 🎵' : 'Background Music removed successfully!');
                  setShowMusicSelector(false);
                  setIsPaused(false);
                  setTimeout(() => setToastMsg(null), 3000);
                }}
                className="flex-1 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 active:scale-98 text-center text-xs font-bold text-black transition-all cursor-pointer shadow-lg shadow-cyan-500/10"
              >
                Confirm & Apply
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Slide-Up Story Boost Panel */}
      <AnimatePresence>
        {showBoostModal && isOwner && (
          <motion.div 
            initial={{ translateY: '100%' }}
            animate={{ translateY: '0%' }}
            exit={{ translateY: '100%' }}
            transition={{ type: 'spring', damping: 20 }}
            onClick={e => e.stopPropagation()}
            className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-neutral-950 border-t border-white/15 rounded-t-3xl z-50 p-5 pb-8 flex flex-col gap-4 text-left shadow-2xl pointer-events-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-purple-400 animate-pulse" />
                <h3 className="text-xs font-extrabold text-white uppercase tracking-wider font-mono">Boost Story Visibility</h3>
              </div>
              <button 
                onClick={() => {
                  triggerHaptic('light');
                  setShowBoostModal(false);
                  setIsPaused(false);
                }}
                className="p-1.5 rounded-full bg-white/5 text-gray-400 hover:text-white text-xs font-mono px-3 cursor-pointer"
              >
                Dismiss
              </button>
            </div>

            {/* Content Body */}
            <div className="flex flex-col gap-4 overflow-y-auto max-h-[50vh] no-scrollbar">
              
              {/* Wallet Info Banner */}
              <div className="bg-purple-950/20 border border-purple-500/20 p-3.5 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                    <Coins className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-purple-300 font-mono font-bold uppercase tracking-wider">Creator Balance</span>
                    <span className="text-[9px] text-gray-400 leading-none mt-0.5">Accrued ConnectX earnings</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-base font-black text-purple-400 font-mono">
                    {(currentUser?.totalEarnings || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-[9px] text-gray-400 font-mono block">CTX Tokens</span>
                </div>
              </div>

              {/* Explainer */}
              <p className="text-[11px] text-gray-400 leading-relaxed font-sans">
                Pay CTX tokens directly from your earnings to place this story at the top of trending streams globally. Increases unique impressions, simulated views, and audience reaction ratios.
              </p>

              {/* Tiers List */}
              <div className="flex flex-col gap-2.5">
                {[
                  {
                    id: 'spark',
                    title: 'Starter Spark Boost',
                    desc: 'Quick kickstart for your creative slide',
                    cost: 10,
                    metrics: [
                      { icon: Target, label: '+500 Impressions Reach', color: 'text-cyan-400' },
                      { icon: Eye, label: '+15 Guaranteed Views', color: 'text-emerald-400' },
                      { icon: Heart, label: '+5 Love Reactions', color: 'text-pink-400' },
                    ]
                  },
                  {
                    id: 'turbo',
                    title: 'Creator Turbo Boost',
                    desc: 'Maximize engagement & climb the trending streams',
                    cost: 25,
                    isPopular: true,
                    metrics: [
                      { icon: Target, label: '+2,500 Impressions Reach', color: 'text-cyan-400' },
                      { icon: Eye, label: '+45 Guaranteed Views', color: 'text-emerald-400' },
                      { icon: Heart, label: '+15 Burning Reactions', color: 'text-pink-400' },
                    ]
                  },
                  {
                    id: 'supernova',
                    title: 'Viral Supernova Boost',
                    desc: 'Absolute visibility takeover on Feed Streams',
                    cost: 50,
                    metrics: [
                      { icon: Target, label: '+8,000 Impressions Reach', color: 'text-cyan-400' },
                      { icon: Eye, label: '+120 Guaranteed Views', color: 'text-emerald-400' },
                      { icon: Heart, label: '+40 Mixed Reactions', color: 'text-pink-400' },
                    ]
                  }
                ].map(tier => {
                  const isSelected = selectedBoostTier === tier.id;
                  const canAfford = (currentUser?.totalEarnings || 0) >= tier.cost;
                  return (
                    <div 
                      key={tier.id}
                      onClick={() => {
                        if (isBoosting) return;
                        triggerHaptic('light');
                        setSelectedBoostTier(tier.id as any);
                      }}
                      className={`relative p-3.5 border rounded-xl flex flex-col gap-2.5 transition-all cursor-pointer select-none active:scale-[0.99] ${
                        isSelected 
                          ? 'bg-purple-950/15 border-purple-500 shadow-[0_0_15px_rgba(147,51,234,0.1)]' 
                          : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
                      }`}
                    >
                      {tier.isPopular && (
                        <div className="absolute -top-2 right-4 bg-purple-500 text-white font-extrabold text-[8px] uppercase tracking-wider py-0.5 px-2.5 rounded-full shadow-md">
                          Most Popular
                        </div>
                      )}

                      {/* Header row */}
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-white">{tier.title}</span>
                          <span className="text-[10px] text-gray-400 mt-0.5 leading-tight">{tier.desc}</span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className={`text-sm font-black font-mono ${isSelected ? 'text-purple-400' : 'text-gray-300'}`}>
                            {tier.cost}
                          </span>
                          <span className="text-[9px] text-gray-500 font-mono ml-1">CTX</span>
                        </div>
                      </div>

                      {/* Metrics checklist */}
                      <div className="grid grid-cols-3 gap-1.5 border-t border-white/5 pt-2">
                        {tier.metrics.map((m, idx) => {
                          const IconComp = m.icon;
                          return (
                            <div key={idx} className="flex items-center gap-1">
                              <IconComp className={`w-3 h-3 ${m.color}`} />
                              <span className="text-[9px] text-gray-300 font-mono truncate">{m.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Action Button */}
              {(() => {
                const selectedCost = selectedBoostTier === 'spark' ? 10 : selectedBoostTier === 'turbo' ? 25 : 50;
                const canAfford = (currentUser?.totalEarnings || 0) >= selectedCost;
                
                return (
                  <button
                    disabled={isBoosting || !canAfford}
                    onClick={() => {
                      if (!currentUser || !activeStory) return;
                      
                      let cost = 10;
                      let extraViews = 15;
                      let extraLikes = 5;
                      let tierName = 'Spark';
                      
                      if (selectedBoostTier === 'turbo') {
                        cost = 25;
                        extraViews = 45;
                        extraLikes = 15;
                        tierName = 'Creator Turbo';
                      } else if (selectedBoostTier === 'supernova') {
                        cost = 50;
                        extraViews = 120;
                        extraLikes = 40;
                        tierName = 'Viral Supernova';
                      }

                      triggerHaptic('heavy');
                      setIsBoosting(true);

                      setTimeout(() => {
                        // 1. Deduct tokens
                        updateProfile({ totalEarnings: currentUser.totalEarnings - cost });

                        // 2. Select mock users to add as viewers
                        const currentViewerIds = new Set((activeStory.viewers || []).map(v => v.userId));
                        const availableUsers = users.filter(u => u.id !== currentUser.id && !currentViewerIds.has(u.id));
                        const shuffled = [...availableUsers].sort(() => 0.5 - Math.random());
                        const usersToAppend = shuffled.slice(0, extraViews);

                        const addedViewers = usersToAppend.map(u => ({
                          userId: u.id,
                          username: u.username,
                          profilePic: u.profilePic || '',
                          timestamp: 'Just now'
                        }));

                        const nextViewers = [...(activeStory.viewers || []), ...addedViewers];
                        const nextLikes = (activeStory.likesCount || 0) + extraLikes;

                        // 3. Update story stats with boosted state and new viewers
                        updateStoryStats(activeStory.id, {
                          isBoosted: true,
                          boosts: {
                            cost,
                            tier: selectedBoostTier,
                            timestamp: Date.now(),
                            tierName
                          },
                          viewers: nextViewers,
                          likesCount: nextLikes
                        });

                        // 4. Reset state & show Toast success
                        setIsBoosting(false);
                        setShowBoostModal(false);
                        setIsPaused(false);
                        setToastMsg(`Campaign Launched! Successfully boosted with ${tierName} ⚡`);
                        
                        setTimeout(() => {
                          setToastMsg(null);
                        }, 3000);
                      }, 1200);
                    }}
                    className={`w-full py-3.5 rounded-xl font-bold font-mono text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98] ${
                      isBoosting 
                        ? 'bg-purple-900/40 text-purple-400 border border-purple-500/20 cursor-wait'
                        : !canAfford
                          ? 'bg-neutral-800 border border-neutral-700 text-gray-500 cursor-not-allowed'
                          : 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white shadow-lg shadow-purple-500/25 border border-purple-400/20'
                    }`}
                  >
                    {isBoosting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                        <span>Initializing Campaign...</span>
                      </>
                    ) : !canAfford ? (
                      <>
                        <AlertCircle className="w-4 h-4" />
                        <span>Insufficient CTX Balance</span>
                      </>
                    ) : (
                      <>
                        <Rocket className="w-4 h-4" />
                        <span>Launch Boost Campaign ⚡</span>
                      </>
                    )}
                  </button>
                );
              })()}

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Slide-Up Interactive Poll Sticker Creator Panel */}
      <AnimatePresence>
        {showPollCreator && isOwner && (
          <motion.div
            initial={{ translateY: '100%' }}
            animate={{ translateY: '0%' }}
            exit={{ translateY: '100%' }}
            transition={{ type: 'spring', damping: 20 }}
            onClick={e => e.stopPropagation()}
            className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-neutral-950 border-t border-white/15 rounded-t-3xl z-50 p-5 pb-8 flex flex-col gap-4 text-left shadow-2xl pointer-events-auto animate-in"
          >
            <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="text-sm">📊</span>
                <h3 className="text-xs font-black text-white font-mono uppercase tracking-wider">Create Interactive Poll</h3>
              </div>
              <button 
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setShowPollCreator(false);
                  setIsPaused(false);
                }}
                className="p-1 rounded-full bg-white/5 text-gray-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handleAttachPoll} className="flex flex-col gap-4 mt-1">
              {/* Question Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider text-gray-400 font-bold">Poll Question</label>
                <input
                  type="text"
                  placeholder="Ask your viewers something..."
                  required
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-gray-600 outline-none focus:border-yellow-400/50 focus:bg-white/10 transition-all font-medium"
                />
              </div>

              {/* Options Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-gray-400 font-bold">Option A</label>
                  <input
                    type="text"
                    required
                    value={pollOptionA}
                    onChange={(e) => setPollOptionA(e.target.value)}
                    placeholder="Yes"
                    className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-gray-600 outline-none focus:border-yellow-400/50 focus:bg-white/10 transition-all font-medium"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-gray-400 font-bold">Option B</label>
                  <input
                    type="text"
                    required
                    value={pollOptionB}
                    onChange={(e) => setPollOptionB(e.target.value)}
                    placeholder="No"
                    className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-gray-600 outline-none focus:border-yellow-400/50 focus:bg-white/10 transition-all font-medium"
                  />
                </div>
              </div>

              {/* Theme Picker */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider text-gray-400 font-bold">Sticker Theme</label>
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { id: 'cyberpunk', name: 'Cyber', bg: 'bg-gradient-to-r from-pink-500 to-indigo-500', text: 'text-white' },
                    { id: 'neon', name: 'Neon', bg: 'bg-gradient-to-r from-emerald-400 to-cyan-500', text: 'text-black' },
                    { id: 'sunset', name: 'Sunset', bg: 'bg-gradient-to-r from-amber-400 to-rose-500', text: 'text-black' },
                    { id: 'cosmic', name: 'Cosmic', bg: 'bg-gradient-to-r from-purple-600 to-blue-600', text: 'text-white' },
                    { id: 'minimal', name: 'Dark', bg: 'bg-neutral-800 border border-white/20', text: 'text-white' },
                  ].map((theme) => (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        setPollTheme(theme.id as any);
                      }}
                      className={`py-2 px-1 rounded-lg text-[9px] font-mono font-black text-center transition-all ${theme.bg} ${theme.text} ${
                        pollTheme === theme.id 
                          ? 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-black scale-105 font-bold' 
                          : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      {theme.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Poll Expiration Timer settings */}
              <div className="flex flex-col gap-2 border-t border-white/5 pt-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-gray-400 font-bold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse" />
                    Poll Expiration Timer
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      setPollHasExpiration(!pollHasExpiration);
                    }}
                    className={`text-[9px] font-mono px-2 py-0.5 rounded border transition-all cursor-pointer font-black ${
                      pollHasExpiration 
                        ? 'bg-yellow-400/20 border-yellow-400 text-yellow-300' 
                        : 'bg-white/5 border-white/10 text-gray-400'
                    }`}
                  >
                    {pollHasExpiration ? 'ENABLED' : 'DISABLED'}
                  </button>
                </div>

                {pollHasExpiration && (
                  <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="grid grid-cols-4 gap-1.5">
                      {[
                        { label: '30s', value: 30 },
                        { label: '1m', value: 60 },
                        { label: '5m', value: 300 },
                        { label: '15m', value: 900 },
                        { label: '1h', value: 3600 },
                        { label: '6h', value: 21600 },
                        { label: '12h', value: 43200 },
                        { label: '24h', value: 86400 },
                      ].map((preset) => (
                        <button
                          key={preset.value}
                          type="button"
                          onClick={() => {
                            triggerHaptic('light');
                            setPollDuration(preset.value);
                          }}
                          className={`py-1.5 rounded-lg text-[10px] font-mono font-bold text-center border transition-all cursor-pointer ${
                            pollDuration === preset.value
                              ? 'bg-yellow-400 text-black border-yellow-400 shadow-sm font-extrabold'
                              : 'bg-white/5 border-white/5 text-gray-300 hover:bg-white/10 hover:border-white/10'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                    <p className="text-[9px] text-gray-500 italic">
                      Poll ends independently from story slide in {pollDuration >= 3600 ? `${pollDuration/3600}h` : pollDuration >= 60 ? `${pollDuration/60}m` : `${pollDuration}s`}. Voting freezes automatically.
                    </p>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!pollQuestion.trim()}
                className="w-full py-3 mt-2 bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl hover:from-yellow-500 hover:to-amber-600 active:scale-98 transition-all disabled:opacity-40 disabled:pointer-events-none shadow-lg cursor-pointer"
              >
                Attach Poll to Story 🚀
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dynamic Animated Story Reactions Tray & Reply Input footer */}
      <footer 
        onClick={e => e.stopPropagation()} 
        className="w-full max-w-md z-30 pointer-events-auto flex flex-col gap-3 px-2 mt-auto relative"
      >
        {/* Toast Notification */}
        <AnimatePresence>
          {toastMsg && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.85 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -15, scale: 0.85 }}
              className="absolute -top-12 left-1/2 -translate-x-1/2 bg-yellow-400 text-black font-extrabold text-[10px] uppercase tracking-wider py-1.5 px-4 rounded-full shadow-[0_4px_15px_rgba(234,179,8,0.3)] flex items-center gap-1.5 z-40 border border-yellow-300"
            >
              <span>{toastMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reaction Pill Row */}
        <div className="w-full flex justify-between items-center gap-1 bg-black/60 backdrop-blur-xl border border-white/10 p-1.5 rounded-full shadow-2xl relative overflow-visible">
          <div className="absolute -top-4 left-4 bg-[#0a0a0c] border border-white/10 text-[7px] text-gray-400 font-mono font-bold tracking-wider uppercase px-2 py-0.5 rounded-md pointer-events-none">
            Quick Reactions
          </div>
          
          <div className="flex-1 flex justify-around items-center px-1 overflow-visible">
            {REACTION_EMOJIS.map((item) => (
              <motion.button
                key={item.label}
                type="button"
                whileHover={{ scale: 1.4, y: -6, filter: 'drop-shadow(0 0 8px rgba(234,179,8,0.5))' }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleReact(item.emoji)}
                className="text-2xl p-1.5 hover:bg-white/5 rounded-full transition-colors cursor-pointer select-none focus:outline-none relative group"
                title={item.label}
              >
                <span>{item.emoji}</span>
                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-black border border-white/10 text-[8px] text-gray-300 rounded px-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                  {item.label}
                </span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Reply Message Input & Interactions */}
        <div className="flex items-center gap-2 w-full pb-2">
          <form 
            onSubmit={handleSendReply}
            className="flex-1 flex items-center bg-white/5 border border-white/10 rounded-full px-4 py-2 hover:bg-white/10 focus-within:border-yellow-400/50 transition-all shadow-inner"
          >
            <input
              type="text"
              placeholder={`Reply to @${activeStory.user.username}...`}
              value={storyReply}
              onChange={(e) => setStoryReply(e.target.value)}
              onFocus={() => setIsPaused(true)}
              onBlur={() => setIsPaused(false)}
              className="bg-transparent border-none text-xs text-white grow outline-none placeholder:text-gray-500 font-medium pr-2"
            />
            <button
              type="submit"
              disabled={!storyReply.trim()}
              className="p-1.5 bg-yellow-400 disabled:bg-white/5 text-black disabled:text-gray-600 rounded-full hover:bg-yellow-500 transition-all cursor-pointer disabled:cursor-not-allowed"
              title="Send Reply"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Story Likes Count indicator badge */}
          <motion.div 
            animate={activeStory.likesCount ? { scale: [1, 1.2, 1] } : {}}
            className="px-3.5 py-2 rounded-full bg-white/5 border border-white/10 flex items-center gap-1.5 select-none"
          >
            <span className="text-xs text-red-500 animate-pulse">❤️</span>
            <span className="text-[10px] font-mono font-bold text-gray-300">{activeStory.likesCount || 0}</span>
          </motion.div>
        </div>
      </footer>
    </div>
  );
};
