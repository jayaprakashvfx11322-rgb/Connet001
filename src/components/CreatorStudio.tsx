/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useConnectX } from '../utils/stateManager';
import { 
  Sparkles, Calendar, ShieldCheck, AlertCircle, BarChart3, Clock, 
  Send, Compass, CheckCircle2, RefreshCw, Archive, Trash2,
  RotateCcw, Star, Pin, Eye, Heart, Plus, Check, X
} from 'lucide-react';
import { MOCK_IMAGES } from '../utils/mockData';

export const CreatorStudio: React.FC = () => {
  const { 
    posts, reels, videos, currentUser, stories, archiveStories, 
    archiveStory, repostStoryFromArchive, toggleHighlightStory, deleteArchivedStory 
  } = useConnectX();

  const [activeTab, setActiveTab] = useState<'overview' | 'scheduler' | 'copyright' | 'archive'>('overview');
  
  // Story highlights inline form state
  const [highlightingStoryId, setHighlightingStoryId] = useState<string | null>(null);
  const [highlightTitleText, setHighlightTitleText] = useState('');

  // Toast / notification feedback state for actions
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const triggerFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 3500);
  };
  
  // Scheduling state
  const [scheduledDrafts, setScheduledDrafts] = useState([
    { id: 1, title: 'Summer Cinematic Drone Vlog - 4K edit', type: 'video', time: 'June 10, 2026 - 06:00 PM' },
    { id: 2, title: 'Tech setup overhaul photoshoot (#mechanicalkeyboard)', type: 'post', time: 'June 12, 2026 - 10:00 AM' }
  ]);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftType, setDraftType] = useState('video');
  const [draftTime, setDraftTime] = useState('June 15, 2026 - 08:00 PM');

  // Copyright checking tool state
  const [checkingFile, setCheckingFile] = useState(false);
  const [checkResult, setCheckResult] = useState<{ status: 'idle' | 'scanning' | 'passed' | 'failed', message: string }>({ status: 'idle', message: '' });

  const handleCreateDraft = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftTitle.trim()) return;
    setScheduledDrafts(prev => [
      ...prev,
      { id: Date.now(), title: draftTitle.trim(), type: draftType, time: draftTime }
    ]);
    setDraftTitle('');
    alert("Draft scheduled successfully! Credentials indexed.");
  };

  const handleCopyrightCheck = () => {
    setCheckResult({ status: 'scanning', message: "AES fingerprint scanner indexing metadata..." });
    setTimeout(() => {
      const items = [
        { status: 'passed' as const, message: "CRITICAL:_No licenses triggered._Clean. Safe for all worldwide advertisement monetization." },
        { status: 'passed' as const, message: "CRITICAL:_No matching profiles discovered._Passed copyright scans checks." },
        { status: 'failed' as const, message: "WARNING:_Licensed audioroll detected._'Priya Original' conflicts with international label registers. Manual approval or ad sharing required." }
      ];
      const selected = items[Math.floor(Math.random() * items.length)];
      setCheckResult(selected);
    }, 2000);
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-5 pb-20 px-2 font-sans selection:bg-pink-500">
      
      {/* 1. HEADER ROW */}
      <div className="flex items-center justify-between border-b border-white/5 pb-2">
        <div>
          <span className="text-[10px] font-mono tracking-wider font-bold text-gray-500 uppercase">Creator Ecosystem</span>
          <h2 className="text-2xl font-display font-extrabold text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-pink-500" /> Creator Studio
          </h2>
        </div>
      </div>

      {/* 2. CHOOSE ACTION TAB SWITCHERS */}
      <div className="grid grid-cols-4 gap-1 p-1 bg-neutral-950 rounded-xl border border-white/5 text-center">
        {(['overview', 'scheduler', 'copyright', 'archive'] as const).map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 rounded-lg text-[9px] sm:text-3xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                isActive 
                  ? 'bg-white/10 text-cyan-400 border border-white/10' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab === 'overview' ? 'Insights' : tab === 'scheduler' ? 'Scheduler' : tab === 'copyright' ? 'Audits' : 'Archive'}
            </button>
          );
        })}
      </div>

      {/* 3. CONDITIONAL BODY CONTENT RENDERS */}
      <div className="flex flex-col gap-3">
        
        {/* TAB 1: CONTENT PERFORMANCE OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="flex flex-col gap-4">
            
            <div className="grid grid-cols-3 gap-2 text-center text-white">
              <div className="bg-white/5 border border-white/10 p-3 rounded-2xl flex flex-col gap-1 shadow-md">
                <BarChart3 className="w-5 h-5 text-cyan-400 mx-auto" />
                <span className="text-4xs text-gray-400 font-mono">AVG REACH RECIP</span>
                <span className="text-sm font-extrabold font-mono text-cyan-400">84.2%</span>
              </div>
              <div className="bg-white/5 border border-white/10 p-3 rounded-2xl flex flex-col gap-1 shadow-md">
                <Clock className="w-5 h-5 text-pink-400 mx-auto" />
                <span className="text-4xs text-gray-400 font-mono font-bold">WATCH_SECONDS</span>
                <span className="text-sm font-extrabold font-mono text-pink-400">42,520h</span>
              </div>
              <div className="bg-white/5 border border-white/10 p-3 rounded-2xl flex flex-col gap-1 shadow-md">
                <RefreshCw className="w-5 h-5 text-yellow-400 mx-auto" />
                <span className="text-4xs text-gray-400 font-mono">RETENTION</span>
                <span className="text-sm font-extrabold font-mono text-yellow-400">81.5%</span>
              </div>
            </div>

            {/* List of currently active creations and audit details */}
            <div className="glass-panel rounded-2xl p-4 border-white/10">
              <h3 className="text-xs font-bold text-white mb-3 text-left">Creations Analytics Logs</h3>
              <div className="flex flex-col gap-3">
                
                {videos.map(vid => (
                  <div key={vid.id} className="flex justify-between items-center bg-black/40 p-2.5 rounded-xl border border-white/5 text-left">
                    <div className="overflow-hidden grow">
                      <span className="font-bold text-xs text-white truncate block">{vid.title}</span>
                      <span className="text-[10px] text-gray-500 font-mono">{vid.category} • {vid.views.toLocaleString()} impressions</span>
                    </div>
                    <span className="text-3xs font-mono text-cyan-400 font-bold shrink-0 ml-4">
                      +{(vid.views * 0.05).toFixed(0)} reach
                    </span>
                  </div>
                ))}

              </div>
            </div>

          </div>
        )}

        {/* TAB 2: POST / VIDEO SCHEDULER */}
        {activeTab === 'scheduler' && (
          <div className="glass-panel rounded-2xl p-5 border-white/10 flex flex-col gap-5 text-left">
            
            <div>
              <h3 className="text-xs font-bold text-white mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-pink-400 font-bold" /> Schedule Publication
              </h3>
              <p className="text-[11px] text-gray-400">Lock and schedule automatically publishing long-form videos, reels, or photo text logs.</p>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateDraft} className="flex flex-col gap-3.5 bg-black/45 p-4 rounded-xl border border-white/5">
              <div>
                <label className="text-4xs uppercase tracking-wider font-mono text-gray-400 block mb-1">Creation Draft Title</label>
                <input
                  type="text"
                  placeholder="Ex: Cinematic Vlog Pt. III"
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  className="w-full py-2 px-3 bg-white/5 border border-white/10 focus:border-cyan-400 outline-none text-xs text-white rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-4xs uppercase tracking-wider font-mono text-gray-400 block mb-1">Type</label>
                  <select
                    value={draftType}
                    onChange={(e) => setDraftType(e.target.value)}
                    className="w-full py-2 px-2 bg-neutral-900 border border-white/10 text-white rounded-lg outline-none text-xs"
                  >
                    <option value="video">Long-Form Video</option>
                    <option value="reel">Reel (9:16)</option>
                    <option value="post">Image Post</option>
                  </select>
                </div>
                <div>
                  <label className="text-4xs uppercase tracking-wider font-mono text-gray-400 block mb-1">Schedule date Time</label>
                  <input
                    type="text"
                    value={draftTime}
                    onChange={(e) => setDraftTime(e.target.value)}
                    className="w-full py-2 px-3 bg-white/5 border border-white/10 focus:border-cyan-400 outline-none text-xs text-white rounded-lg font-mono"
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="py-2.5 bg-gradient-to-r from-blue-500 to-pink-500 rounded-xl text-white font-semibold hover:opacity-90 active:scale-95 transition-all text-xs cursor-pointer shadow-md"
              >
                Schedule Release
              </button>
            </form>

            {/* Listing Drafts */}
            <div className="mt-2 text-left">
              <span className="text-4xs font-mono font-bold text-gray-400 tracking-widest uppercase">Pending Draft Queue</span>
              <div className="flex flex-col gap-2 mt-2">
                {scheduledDrafts.map((draft) => (
                  <div key={draft.id} className="flex justify-between items-center bg-black/40 border border-white/5 p-3 rounded-xl">
                    <div>
                      <div className="text-xs font-bold text-white">{draft.title}</div>
                      <span className="text-4xs font-mono text-gray-500">TYPE: {draft.type.toUpperCase()} • SCHEDULED TIME: {draft.time}</span>
                    </div>
                    <button 
                      onClick={() => {
                        setScheduledDrafts(prev => prev.filter(d => d.id !== draft.id));
                        alert("Scheduled release removed successfully.");
                      }}
                      className="text-4xs font-semibold hover:text-red-400 text-gray-500"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: COPYRIGHT INTELLIGENCE scanner */}
        {activeTab === 'copyright' && (
          <div className="glass-panel rounded-2xl p-5 border-white/10 flex flex-col gap-4 text-left">
            
            <div>
              <h3 className="text-xs font-bold text-white mb-1 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-cyan-400" /> Automated Copyright Intelligence
              </h3>
              <p className="text-[11px] text-gray-400">Scan metadata, audio feeds, and pixels of your scheduled file against international copyright registers.</p>
            </div>

            <div className="bg-black/40 border border-white/5 p-4 rounded-xl text-center">
              <span className="text-3xs font-mono text-gray-400 block mb-3.5 uppercase">Audit checking tools</span>
              
              <button
                onClick={handleCopyrightCheck}
                disabled={checkResult.status === 'scanning'}
                className="py-2.5 px-6 bg-cyan-400 hover:bg-cyan-500 text-black font-semibold rounded-full active:scale-95 transition-all text-xs disabled:opacity-40"
              >
                {checkResult.status === 'scanning' ? 'Scanning Metadata...' : 'Scan Selected Files'}
              </button>

              {/* Checks response display panels */}
              {checkResult.status !== 'idle' && (
                <div className={`mt-5 p-3.5 rounded-xl border flex gap-3 text-left items-start ${
                  checkResult.status === 'scanning'
                    ? 'bg-blue-950/20 border-blue-500/25 text-blue-400'
                    : checkResult.status === 'passed'
                      ? 'bg-green-500/10 border-green-500/25 text-green-400'
                      : 'bg-red-500/10 border-red-500/25 text-red-400 animate-bounce'
                }`}>
                  {checkResult.status === 'scanning' ? (
                    <RefreshCw className="w-5 h-5 text-blue-400 animate-spin shrink-0 mt-0.5" />
                  ) : checkResult.status === 'passed' ? (
                    <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="text-3xs font-mono uppercase font-bold block mb-1">
                      {checkResult.status.toUpperCase()}
                    </span>
                    <p className="text-3xs leading-relaxed text-gray-200">{checkResult.message}</p>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 4: PRIVATE STORY ARCHIVE & REUSE GALLERY */}
        {activeTab === 'archive' && (
          <div className="flex flex-col gap-5">
            
            {/* Feedback / Toast notification */}
            {feedbackMsg && (
              <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-cyan-400 text-black py-2 px-4 rounded-full text-2xs sm:text-xs font-mono font-black uppercase tracking-widest shadow-[0_0_20px_rgba(34,211,238,0.4)] z-50 flex items-center gap-1.5 animate-bounce">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>{feedbackMsg}</span>
              </div>
            )}

            {/* Subheader info panel */}
            <div className="glass-panel rounded-2xl p-4.5 border-white/10 flex flex-col gap-1.5 text-left bg-neutral-950/60">
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Archive className="w-4 h-4 text-pink-400" /> Story Archive & Profile Highlights
              </h3>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                Your expired stories are automatically saved here privately. Repost them to your live feed at any time to boost retention, or toggle them as Highlights to showcase on your profile.
              </p>
            </div>

            {/* 1. ACTIVE STORIES SECTION (MANUAL ARCHIVING) */}
            <div className="glass-panel rounded-2xl p-4 border-white/10 text-left flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-black text-cyan-400 uppercase tracking-wider">
                  Active Live Stories
                </span>
                <span className="text-4xs font-mono text-gray-500">Visible on main feed (24h limit)</span>
              </div>

              {(() => {
                const myActive = stories.filter(s => s.user.id === currentUser?.id);
                if (myActive.length === 0) {
                  return (
                    <div className="bg-black/30 p-4 rounded-xl border border-white/5 text-center py-6">
                      <span className="text-3xs font-mono text-gray-500 block">No live active stories right now.</span>
                      <p className="text-4xs text-gray-600 mt-1">Post a story on the main feed to see engagement metrics and manual archive options here!</p>
                    </div>
                  );
                }

                return (
                  <div className="flex flex-col gap-2.5">
                    {myActive.map((story) => (
                      <div key={story.id} className="flex items-center justify-between bg-black/40 border border-white/5 p-3 rounded-xl gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <img 
                            src={story.mediaUrl} 
                            alt="story thumbnail" 
                            className="w-10 h-10 object-cover rounded-lg border border-white/10 shrink-0"
                            referrerPolicy="no-referrer"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate max-w-[200px] sm:max-w-[320px]">
                              {story.caption || 'Active Story'}
                            </p>
                            <span className="text-4xs font-mono text-gray-500 flex items-center gap-2">
                              <span>Published: {story.timestamp}</span>
                              <span>•</span>
                              <span className="text-cyan-400 flex items-center gap-0.5">
                                <Eye className="w-2.5 h-2.5" /> {story.viewers.length} views
                              </span>
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            archiveStory(story.id);
                            triggerFeedback("Story archived manually!");
                          }}
                          className="py-1.5 px-3 rounded-lg bg-yellow-400/10 hover:bg-yellow-400 text-yellow-400 hover:text-black border border-yellow-400/25 hover:border-transparent text-4xs font-mono font-black uppercase tracking-wider cursor-pointer transition-all active:scale-95 shrink-0"
                        >
                          Archive Now
                        </button>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* 2. PRIVATE ARCHIVE GALLERY */}
            <div className="glass-panel rounded-2xl p-4 border-white/10 text-left flex flex-col gap-3">
              <span className="text-[10px] font-mono font-black text-pink-400 uppercase tracking-wider">
                Private Archive Gallery ({archiveStories.filter(s => s.user.id === currentUser?.id).length})
              </span>

              {(() => {
                const myArchived = archiveStories.filter(s => s.user.id === currentUser?.id);
                if (myArchived.length === 0) {
                  return (
                    <div className="bg-black/30 p-8 rounded-xl border border-white/5 text-center">
                      <Archive className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                      <span className="text-3xs font-mono text-gray-400 block uppercase">No archived stories yet</span>
                      <p className="text-4xs text-gray-600 mt-1 max-w-xs mx-auto">Once your stories expire after 24 hours, they will automatically be cached here for safe re-use!</p>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {myArchived.map((story) => (
                      <div 
                        key={story.id} 
                        className="relative rounded-2xl overflow-hidden border border-white/5 aspect-[9/14] bg-neutral-900 flex flex-col justify-end group shadow-lg hover:border-pink-500/20 transition-all duration-300"
                      >
                        {/* Background Thumbnail Image */}
                        <img 
                          src={story.mediaUrl} 
                          alt="Archived story" 
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-60"
                          referrerPolicy="no-referrer"
                        />

                        {/* Top dark gradient and Highlight Indicator */}
                        <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-transparent to-black/90 flex flex-col justify-between p-2.5">
                          
                          <div className="flex items-start justify-between gap-1.5">
                            {story.isHighlighted ? (
                              <div className="bg-yellow-400/20 border border-yellow-400/40 text-yellow-300 font-mono font-black text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                                <Star className="w-2.5 h-2.5 fill-yellow-300 text-yellow-300" />
                                <span className="truncate max-w-[50px]">{story.highlightTitle || 'Highlights'}</span>
                              </div>
                            ) : (
                              <div className="bg-black/60 border border-white/10 text-gray-400 font-mono text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded-full">
                                Private Archive
                              </div>
                            )}

                            {/* Views badge */}
                            <div className="bg-black/50 border border-white/5 text-[8px] text-gray-400 font-mono py-0.5 px-1.5 rounded-full shrink-0 flex items-center gap-0.5">
                              <Eye className="w-2.5 h-2.5 text-cyan-400" />
                              <span>{story.viewers?.length || 0}</span>
                            </div>
                          </div>

                          {/* Inline Highlight title naming form */}
                          {highlightingStoryId === story.id && (
                            <div className="absolute inset-0 bg-black/95 backdrop-blur-sm flex flex-col items-center justify-center p-3 text-center rounded-2xl z-20 gap-2.5 border border-yellow-400/35">
                              <span className="text-[9px] font-mono font-black text-yellow-400 uppercase tracking-widest flex items-center gap-1">
                                <Star className="w-3 h-3 fill-yellow-400" /> Choose Title
                              </span>
                              <input 
                                type="text" 
                                maxLength={12}
                                placeholder="e.g., Summer, Setup"
                                value={highlightTitleText}
                                onChange={e => setHighlightTitleText(e.target.value)}
                                className="w-full bg-white/5 border border-white/15 text-white rounded-lg px-2 py-1.5 text-2xs outline-none text-center focus:border-yellow-400 tracking-wider font-semibold"
                                autoFocus
                              />
                              <div className="flex gap-1 w-full mt-0.5">
                                <button 
                                  onClick={() => {
                                    toggleHighlightStory(story.id, highlightTitleText.trim() || 'Highlights');
                                    setHighlightingStoryId(null);
                                    setHighlightTitleText('');
                                    triggerFeedback(`Added to "${highlightTitleText.trim() || 'Highlights'}" highlights! ⭐`);
                                  }}
                                  className="flex-1 py-1 bg-yellow-400 text-black font-mono font-black text-[8px] uppercase rounded-md cursor-pointer hover:bg-yellow-300 active:scale-95 transition-all"
                                >
                                  Save
                                </button>
                                <button 
                                  onClick={() => {
                                    setHighlightingStoryId(null);
                                    setHighlightTitleText('');
                                  }}
                                  className="flex-1 py-1 bg-white/5 text-gray-400 font-mono font-bold text-[8px] uppercase rounded-md cursor-pointer hover:bg-white/10"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Story metadata details */}
                          <div className="flex flex-col gap-2.5 mt-auto">
                            {story.caption && (
                              <p className="text-[10px] text-gray-200 line-clamp-2 leading-relaxed font-sans px-0.5 text-left drop-shadow-md">
                                {story.caption}
                              </p>
                            )}

                            {/* Options action row */}
                            <div className="grid grid-cols-2 gap-1.5 mt-1 border-t border-white/5 pt-2">
                              {/* Highlight Button */}
                              <button 
                                onClick={() => {
                                  if (story.isHighlighted) {
                                    toggleHighlightStory(story.id);
                                    triggerFeedback("Removed from profile highlights! ⭐");
                                  } else {
                                    setHighlightingStoryId(story.id);
                                    setHighlightTitleText(story.highlightTitle || 'Highlights');
                                  }
                                }}
                                className={`py-1 px-1 rounded-lg border text-[8px] font-mono font-black uppercase flex items-center justify-center gap-1 cursor-pointer transition-all ${
                                  story.isHighlighted 
                                    ? 'bg-yellow-400 border-transparent text-black shadow-md' 
                                    : 'bg-black/45 border-white/15 text-yellow-400 hover:bg-black/70'
                                }`}
                              >
                                <Star className={`w-2.5 h-2.5 ${story.isHighlighted ? 'fill-black text-black' : 'text-yellow-400'}`} />
                                <span>{story.isHighlighted ? 'Pinned' : 'Highlight'}</span>
                              </button>

                              {/* Repost Button */}
                              <button 
                                onClick={() => {
                                  repostStoryFromArchive(story.id);
                                  triggerFeedback("Reposted story to your feed! 🚀");
                                }}
                                className="py-1 px-1 rounded-lg bg-cyan-400/10 hover:bg-cyan-400 text-cyan-400 hover:text-black border border-cyan-400/20 hover:border-transparent text-[8px] font-mono font-black uppercase flex items-center justify-center gap-1 cursor-pointer transition-all"
                              >
                                <RotateCcw className="w-2.5 h-2.5" />
                                <span>Repost</span>
                              </button>
                            </div>

                            {/* Permanently Delete Button overlaying when hovered */}
                            <button
                              onClick={() => {
                                if (confirm("Permanently delete this archived story? This cannot be undone.")) {
                                  deleteArchivedStory(story.id);
                                  triggerFeedback("Deleted story from archive!");
                                }
                              }}
                              className="w-full py-1 text-center bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-lg text-[8px] font-mono uppercase tracking-wider transition-all border border-red-500/10 hover:border-transparent cursor-pointer"
                            >
                              Permanently Delete
                            </button>

                          </div>

                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

          </div>
        )}

      </div>

    </div>
  );
};
