/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, Camera, Upload, Download, Smile, Music, Sparkles, Trash2, 
  Type, Sticker, Check, Play, Pause, RefreshCw, X, ChevronLeft, ChevronRight, 
  MapPin, AtSign, Crop, Palette, PenTool, CheckCircle2, Save, Send, Eye,
  Scissors, Volume2, Mic, Settings, Search, Globe, Users, Heart, Film, Flame
} from 'lucide-react';
import { MOCK_VIDEOS } from '../utils/mockData';

interface User {
  id: string;
  username: string;
  displayName: string;
  profilePic: string;
}

interface ReelWorkspaceProps {
  users: User[];
  currentUser: any;
  addReel: (
    caption: string,
    videoUrl: string,
    audioTitle: string,
    hashtags: string[],
    allowDownloads?: boolean
  ) => void;
  triggerSuccessParty: (msg: string) => void;
  triggerHaptic: (style: 'light' | 'medium' | 'heavy' | 'selection' | 'success') => void;
  onClose: () => void;
  initialVideoUrl?: string;
}

interface FloatingElement {
  id: string;
  type: 'text' | 'sticker';
  content: string;
  x: number;
  y: number;
  scale: number;
}

export default function ReelWorkspace({
  users,
  currentUser,
  addReel,
  triggerSuccessParty,
  triggerHaptic,
  onClose,
  initialVideoUrl
}: ReelWorkspaceProps) {
  // Step tracker: 'picker' | 'editor' | 'publish'
  const [step, setStep] = useState<'picker' | 'editor' | 'publish'>(initialVideoUrl ? 'editor' : 'picker');
  
  // Videos list & selected states
  const [videoAssets] = useState<string[]>(Object.values(MOCK_VIDEOS));
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string>(initialVideoUrl || Object.values(MOCK_VIDEOS)[0]);

  // Camera active states
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordProgress, setRecordProgress] = useState(0);

  // Video loading, retry, and permission verification states
  const [videoLoadStatus, setVideoLoadStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [retryCount, setRetryCount] = useState(0);
  const [permissionStatus, setPermissionStatus] = useState<'requesting' | 'granted' | 'denied'>('requesting');

  // Reset video loading state on selection change
  useEffect(() => {
    if (selectedVideoUrl) {
      setVideoLoadStatus('loading');
    }
  }, [selectedVideoUrl, retryCount]);

  // Simulate camera permission validation
  useEffect(() => {
    setPermissionStatus('requesting');
    const t = setTimeout(() => {
      setPermissionStatus('granted');
    }, 450);
    return () => clearTimeout(t);
  }, [isCameraActive]);

  // Editor configuration
  const [playProgress, setPlayProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState<0.5 | 1 | 2 | 3>(1);
  const [activeFilter, setActiveFilter] = useState<string>('normal');
  const [activeEffect, setActiveEffect] = useState<string>('none');

  // Multi-channel volume controls
  const [volumeOriginal, setVolumeOriginal] = useState(80);
  const [volumeMusic, setVolumeMusic] = useState(50);
  const [volumeVoiceover, setVolumeVoiceover] = useState(0);

  // Trimming states
  const [trimStart, setTrimStart] = useState(0); // seconds
  const [trimEnd, setTrimEnd] = useState(15); // seconds
  const [splitPoint, setSplitPoint] = useState(7.5); // seconds
  const [isTrimActive, setIsTrimActive] = useState(false);
  const [isSplitActive, setIsSplitActive] = useState(false);

  // Voiceover & Subtitles states
  const [isRecordingVoiceover, setIsRecordingVoiceover] = useState(false);
  const [hasVoiceover, setHasVoiceover] = useState(false);
  const [showCaptions, setShowCaptions] = useState(false);
  const [captionsGenerated, setCaptionsGenerated] = useState(false);
  const [isGeneratingCaptions, setIsGeneratingCaptions] = useState(false);

  // Audio / Music choice state
  const [selectedAudioTrack, setSelectedAudioTrack] = useState('Chill Lofi Vibe - Beats HQ');

  // Text / Stickers
  const [elements, setElements] = useState<FloatingElement[]>([]);
  const [activeElementId, setActiveElementId] = useState<string | null>(null);

  // Cover Selection State
  const [coverIndex, setCoverIndex] = useState(2); // frame thumbnail
  const [isCoverModalOpen, setIsCoverModalOpen] = useState(false);

  // Sub-modal triggers
  const [isTextModalOpen, setIsTextModalOpen] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [isStickerModalOpen, setIsStickerModalOpen] = useState(false);
  const [isAudioModalOpen, setIsAudioModalOpen] = useState(false);
  const [isVolumeModalOpen, setIsVolumeModalOpen] = useState(false);

  // Publish form elements
  const [caption, setCaption] = useState('');
  const [taggedPeople, setTaggedPeople] = useState<string[]>([]);
  const [location, setLocation] = useState('');
  const [audience, setAudience] = useState<'Everyone' | 'Close Friends'>('Everyone');
  const [shareToStory, setShareToStory] = useState(true);
  const [crossPostFB, setCrossPostFB] = useState(false);
  const [allowDownloads, setAllowDownloads] = useState(true);

  // HTML references
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const filtersList = [
    { id: 'normal', name: 'Normal', filterClass: '' },
    { id: 'neon', name: 'Cyber Neon', filterClass: 'hue-rotate-60 contrast-125 saturate-150' },
    { id: 'vhs', name: 'VHS Tape', filterClass: 'contrast-[0.9] saturate-[1.2] brightness-[1.05] sepia-[0.1]' },
    { id: 'retro', name: 'Vintage 70s', filterClass: 'sepia-[0.35] brightness-[1.05] contrast-[0.95]' },
    { id: 'mono', name: 'Monochrome', filterClass: 'grayscale contrast-125' },
  ];

  const audioLibrary = [
    { title: 'Chill Lofi Vibe', artist: 'Beats HQ', useCount: '24.1K Reels' },
    { title: 'Cyberpunk Chase', artist: 'Hyper Synth', useCount: '109.4K Reels' },
    { title: 'Summer Breeze', artist: 'Sunny Chords', useCount: '8.5K Reels' },
    { title: 'Sunset Boulevard', artist: 'Golden Hour', useCount: '412.3K Reels' },
    { title: 'Phonk Drill Beat', artist: 'Shadow Kid', useCount: '87.6K Reels' },
  ];

  const coverFrames = [
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150', // audio frame
    'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=150', // party frame
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=150', // studio frame
    'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=150', // dance frame
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=150', // stage frame
  ];

  // Auto loop/simulation of play progress if playing
  useEffect(() => {
    let interval: any;
    if (isPlaying && step === 'editor') {
      interval = setInterval(() => {
        setPlayProgress(prev => {
          const nextVal = prev + (0.5 * speed);
          if (nextVal >= trimEnd) {
            return trimStart; // loop
          }
          return nextVal;
        });
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isPlaying, step, speed, trimStart, trimEnd]);

  // Video controller mapping
  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying, selectedVideoUrl, step]);

  // Handle simulated camera recording progress
  useEffect(() => {
    let recordInterval: any;
    if (isRecording) {
      recordInterval = setInterval(() => {
        setRecordProgress(prev => {
          if (prev >= 100) {
            handleStopRecording();
            return 100;
          }
          return prev + 5;
        });
      }, 300);
    }
    return () => clearInterval(recordInterval);
  }, [isRecording]);

  const handleStartRecording = () => {
    triggerHaptic('heavy');
    setIsRecording(true);
    setRecordProgress(0);
  };

  const handleStopRecording = () => {
    triggerHaptic('success');
    setIsRecording(false);
    // simulated recorded file
    const randomVideo = Object.values(MOCK_VIDEOS)[Math.floor(Math.random() * Object.values(MOCK_VIDEOS).length)];
    setSelectedVideoUrl(randomVideo);
    setIsCameraActive(false);
    setStep('editor');
  };

  const handleAddText = () => {
    if (!textInput.trim()) return;
    const newEl: FloatingElement = {
      id: `text_${Date.now()}`,
      type: 'text',
      content: textInput,
      x: 0,
      y: -10,
      scale: 1
    };
    setElements([...elements, newEl]);
    setTextInput('');
    setIsTextModalOpen(false);
    triggerHaptic('medium');
  };

  const handleAddEmoji = (emoji: string) => {
    const newEl: FloatingElement = {
      id: `sticker_${Date.now()}`,
      type: 'sticker',
      content: emoji,
      x: 0,
      y: 0,
      scale: 1.2
    };
    setElements([...elements, newEl]);
    setIsStickerModalOpen(false);
    triggerHaptic('light');
  };

  const handleTriggerCaptions = () => {
    if (captionsGenerated) {
      setShowCaptions(!showCaptions);
      triggerHaptic('light');
      return;
    }
    setIsGeneratingCaptions(true);
    triggerHaptic('medium');
    setTimeout(() => {
      setIsGeneratingCaptions(false);
      setCaptionsGenerated(true);
      setShowCaptions(true);
      triggerHaptic('success');
      triggerSuccessParty("AI has auto-transcribed video vocals into captions!");
    }, 2000);
  };

  const handleSimulateVoiceover = () => {
    setIsRecordingVoiceover(true);
    triggerHaptic('medium');
    setTimeout(() => {
      setIsRecordingVoiceover(false);
      setHasVoiceover(true);
      setVolumeVoiceover(80);
      triggerHaptic('success');
      triggerSuccessParty("Voiceover recording layer overlaid successfully.");
    }, 2500);
  };

  const handlePublish = () => {
    triggerHaptic('success');
    const hashtags = caption.match(/#\w+/g)?.map(h => h.substring(1)) || ['clips', 'loops'];
    addReel(
      caption || 'Simulated Creative Reel Loop!',
      selectedVideoUrl,
      selectedAudioTrack,
      hashtags,
      allowDownloads
    );
    triggerSuccessParty("Your Reel has been uploaded to Feed!");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-[#020204] text-white z-50 flex flex-col font-sans select-none overflow-hidden md:max-w-md md:mx-auto md:border-x md:border-white/10 md:shadow-2xl">
      
      {/* Header bar */}
      <div className="flex justify-between items-center px-4 py-3 border-b border-white/5 bg-[#08080c] shrink-0 z-30">
        <button 
          onClick={() => {
            triggerHaptic('light');
            if (step === 'editor') setStep('picker');
            else if (step === 'publish') setStep('editor');
            else onClose();
          }}
          className="p-1.5 hover:bg-white/5 active:scale-90 transition-all rounded-full"
        >
          <ArrowLeft className="w-5 h-5 text-gray-300" />
        </button>
        <span className="text-[11px] font-mono tracking-[0.2em] font-extrabold uppercase text-gray-400 bg-white/5 py-1 px-3 rounded-full">
          {step === 'picker' ? 'Select Video' : step === 'editor' ? 'Reel Studio' : 'Post Reel'}
        </span>
        <div className="flex items-center gap-1">
          {step === 'picker' && (
            <button
              onClick={() => {
                triggerHaptic('light');
                setStep('editor');
              }}
              className="text-xs font-bold text-sky-400 py-1.5 px-3 bg-sky-500/10 rounded-full hover:bg-sky-500/20"
            >
              Next
            </button>
          )}
          {step === 'editor' && (
            <button
              onClick={() => {
                triggerHaptic('light');
                setStep('publish');
              }}
              className="text-xs font-bold text-sky-400 py-1.5 px-3 bg-sky-500/10 rounded-full hover:bg-sky-500/20"
            >
              Next
            </button>
          )}
          {step === 'publish' && (
            <button
              onClick={handlePublish}
              className="text-xs font-extrabold text-black py-1.5 px-4 bg-sky-400 rounded-full hover:brightness-110 active:scale-95"
            >
              Share
            </button>
          )}
        </div>
      </div>

      <div className="flex-grow overflow-y-auto relative flex flex-col">
        <AnimatePresence mode="wait">
          
          {/* STEP 1: VIDEO SELECTION OR RECORDER */}
          {step === 'picker' && (
            <motion.div 
              key="picker"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="flex-grow flex flex-col h-full bg-[#030307]"
            >
              {/* Camera recording pane */}
              {isCameraActive ? (
                <div className="relative aspect-[9/16] bg-black flex flex-col justify-between p-4 flex-grow border-b border-white/5">
                  {permissionStatus === 'requesting' ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#030307] z-35">
                      <RefreshCw className="w-8 h-8 text-pink-400 animate-spin mb-3" />
                      <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-gray-400">Verifying Lens Hardware...</span>
                      <span className="text-[9px] text-gray-500 mt-1">Acquiring sandbox video sensor stream</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-center text-xs text-white/70">
                        <span className="font-mono bg-red-600 px-2.5 py-1 rounded-full text-white font-extrabold flex items-center gap-1 animate-pulse">
                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                          REC
                        </span>
                        <span className="font-mono bg-white/10 px-2.5 py-1 rounded-full text-white">
                          {Math.floor(recordProgress / 10)}s
                        </span>
                      </div>

                      {/* Shutter panel */}
                      <div className="flex flex-col items-center gap-4 py-4 shrink-0">
                        {/* Linear recording bar indicator */}
                        <div className="w-40 h-1 bg-white/20 rounded-full overflow-hidden">
                          <div className="h-full bg-red-500 transition-all duration-300" style={{ width: `${recordProgress}%` }} />
                        </div>

                        <div className="flex items-center gap-6">
                          <button 
                            onClick={() => { triggerHaptic('light'); setIsCameraActive(false); }}
                            className="w-10 h-10 rounded-full bg-white/10 border border-white/15 flex items-center justify-center"
                          >
                            <X className="w-4 h-4" />
                          </button>

                          <button 
                            onMouseDown={handleStartRecording}
                            onMouseUp={handleStopRecording}
                            onTouchStart={handleStartRecording}
                            onTouchEnd={handleStopRecording}
                            className={`w-18 h-18 rounded-full border-4 p-1.5 transition-all duration-300 ${
                              isRecording ? 'border-red-500 bg-red-500/20 scale-110' : 'border-white bg-transparent hover:scale-105'
                            }`}
                            title="HOLD TO RECORD VIDEO"
                          >
                            <div className={`w-full h-full rounded-full ${isRecording ? 'bg-red-500 rounded-md scale-75' : 'bg-white'}`} />
                          </button>

                          <button 
                            onClick={() => { triggerHaptic('light'); }}
                            className="w-10 h-10 rounded-full bg-white/10 border border-white/15 flex items-center justify-center"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        </div>
                        <span className="text-[8.5px] font-mono tracking-wider text-gray-400">HOLD RED SHUTTER TO RECORD REEL SEQUENCE</span>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="flex-grow flex flex-col h-full bg-[#030307]">
                  {/* Big Video loop display */}
                  <div className="relative aspect-[9/16] bg-neutral-950 flex items-center justify-center overflow-hidden max-h-[360px] border-b border-white/5 shrink-0">
                    {videoLoadStatus === 'error' ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950 p-4 text-center z-20">
                        <span className="text-rose-500 font-bold text-xs mb-1">Failed to buffer video clip</span>
                        <span className="text-[10px] text-gray-400 mb-4 max-w-[200px]">The media path could not be loaded. Please retry below.</span>
                        <button 
                          onClick={() => {
                            setVideoLoadStatus('loading');
                            setRetryCount(prev => prev + 1);
                          }}
                          className="px-4 py-2 bg-pink-500 hover:bg-pink-400 text-black text-[10px] font-black uppercase tracking-wider rounded-full transition-all"
                        >
                          Retry Caching
                        </button>
                      </div>
                    ) : (
                      <div className="w-full h-full relative">
                        {/* Instant video thumbnail poster while video buffers */}
                        {videoLoadStatus === 'loading' && (
                          <img 
                            src={coverFrames[coverIndex] || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800"} 
                            className="absolute inset-0 w-full h-full object-cover z-10 opacity-70 filter blur-[2px]"
                            alt="Reel Placeholder"
                          />
                        )}
                        
                        <video 
                          ref={videoRef}
                          key={`${selectedVideoUrl}-${retryCount}-picker`}
                          src={selectedVideoUrl} 
                          onLoadStart={() => setVideoLoadStatus('loading')}
                          onLoadedData={() => setVideoLoadStatus('loaded')}
                          onCanPlay={() => setVideoLoadStatus('loaded')}
                          onError={(e) => {
                            e.currentTarget.src = "https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4";
                          }}
                          className={`w-full h-full object-cover transition-all duration-300 ${videoLoadStatus === 'loading' ? 'opacity-30 scale-95 blur-sm' : 'opacity-100 scale-100 blur-0'}`} 
                          autoPlay 
                          loop 
                          muted 
                          playsInline
                        />
                        
                        {videoLoadStatus === 'loading' && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 z-20 gap-2">
                            <RefreshCw className="w-6 h-6 text-pink-400 animate-spin" />
                            <span className="text-[9px] font-mono text-gray-400 uppercase tracking-widest">Caching Sequence...</span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Floating camera active button */}
                    <button
                      onClick={() => {
                        triggerHaptic('medium');
                        setIsCameraActive(true);
                      }}
                      className="absolute bottom-4 right-4 p-3.5 bg-black/85 border border-white/15 rounded-full text-white shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 z-20"
                    >
                      <Camera className="w-4 h-4" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Shoot</span>
                    </button>
                  </div>

                  {/* Horizontal scrolling grid lists */}
                  <div className="p-4 flex-grow flex flex-col gap-3">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400 px-1">Reels Clip Vault</span>
                    <div className="grid grid-cols-2 gap-3 overflow-y-auto max-h-[220px] pb-8">
                      {videoAssets.map((vid, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            triggerHaptic('selection');
                            setSelectedVideoUrl(vid);
                          }}
                          className={`relative aspect-[9/16] rounded-xl overflow-hidden cursor-pointer border transition-all ${
                            selectedVideoUrl === vid 
                              ? 'border-sky-400 ring-2 ring-sky-400/20 scale-98' 
                              : 'border-white/5 hover:border-white/20'
                          }`}
                        >
                          <video src={vid} className="w-full h-full object-cover" muted playsInline />
                          <div className="absolute top-2 left-2 bg-black/60 px-1.5 py-0.5 rounded text-[8px] font-mono text-gray-300">
                            0:15
                          </div>
                          {selectedVideoUrl === vid && (
                            <div className="absolute inset-0 bg-sky-500/10 flex items-center justify-center">
                              <CheckCircle2 className="w-6 h-6 text-sky-400" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* STEP 2: IMMERSIVE REELS MULTI-LAYER EDITOR */}
          {step === 'editor' && (
            <motion.div 
              key="editor"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-grow flex flex-col relative h-full bg-black"
            >
              {/* Media viewport container (Vertical phone mockup style aspect ratio) */}
              <div className="flex-grow flex items-center justify-center relative p-3 bg-black">
                <div className="relative w-full max-w-[285px] aspect-[9/16] bg-neutral-950 rounded-[28px] border border-white/10 overflow-hidden shadow-2xl flex items-center justify-center">
                   {videoLoadStatus === 'error' ? (
                     <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950 p-4 text-center z-20">
                       <span className="text-rose-500 font-bold text-xs mb-1">Failed to load video buffer</span>
                       <span className="text-[10px] text-gray-400 mb-4 max-w-[200px]">The editor could not render this video stream safely.</span>
                       <button 
                         onClick={() => {
                           setVideoLoadStatus('loading');
                           setRetryCount(prev => prev + 1);
                         }}
                         className="px-4 py-2 bg-pink-500 hover:bg-pink-400 text-black text-[10px] font-black uppercase tracking-wider rounded-full transition-all"
                       >
                         Retry Caching
                       </button>
                     </div>
                   ) : (
                     <div className="w-full h-full relative">
                       {/* Instant video thumbnail poster while video buffers */}
                       {videoLoadStatus === 'loading' && (
                         <img 
                           src={coverFrames[coverIndex] || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800"} 
                           className="absolute inset-0 w-full h-full object-cover z-10 opacity-70 filter blur-[2px]"
                           alt="Reel Placeholder"
                         />
                       )}
                       
                       <video 
                         ref={videoRef}
                         key={`${selectedVideoUrl}-${retryCount}-editor`}
                         src={selectedVideoUrl} 
                         onLoadStart={() => setVideoLoadStatus('loading')}
                         onLoadedData={() => setVideoLoadStatus('loaded')}
                         onCanPlay={() => setVideoLoadStatus('loaded')}
                         onError={(e) => {
                           e.currentTarget.src = "https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4";
                         }}
                         className={`w-full h-full object-cover transition-all duration-300 ${
                           filtersList.find(f => f.id === activeFilter)?.filterClass
                         } ${videoLoadStatus === 'loading' ? 'opacity-30 scale-95 blur-sm' : 'opacity-100 scale-100 blur-0'}`} 
                         autoPlay 
                         loop 
                         muted 
                         playsInline
                       />
                       
                       {videoLoadStatus === 'loading' && (
                         <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 z-20 gap-2">
                           <RefreshCw className="w-6 h-6 text-pink-400 animate-spin" />
                           <span className="text-[9px] font-mono text-gray-400 uppercase tracking-widest">Applying Workspace Canvas...</span>
                         </div>
                       )}
                     </div>
                   )}

                  {/* Sparkle effects overlay */}
                  {activeEffect === 'sparkles' && (
                    <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-yellow-300/15 via-transparent to-pink-500/15 mix-blend-screen">
                      <div className="absolute top-10 left-12 text-yellow-300 text-[10px] animate-bounce">✨</div>
                      <div className="absolute bottom-24 right-10 text-yellow-300 text-xs animate-bounce delay-100">✨</div>
                    </div>
                  )}
                  {activeEffect === 'neon' && (
                    <div className="absolute inset-0 pointer-events-none border border-cyan-400/30 shadow-[inset_0_0_40px_rgba(6,182,212,0.45)]" />
                  )}

                  {/* AI Auto-Generated Subtitles Cap Overlay */}
                  {showCaptions && captionsGenerated && (
                    <div className="absolute bottom-24 inset-x-4 text-center pointer-events-none z-30 animate-pulse">
                      <span className="px-3.5 py-1.5 rounded-lg bg-yellow-400 text-black text-[11px] font-black uppercase tracking-wider shadow-lg">
                        {playProgress < 5 ? "🔥 Let's sync this loop sequence!" : 
                         playProgress < 10 ? "⚡️ Feeling highly aesthetic!" : 
                         "🌌 Studio live. Sync synchronized!"}
                      </span>
                    </div>
                  )}

                  {/* Draggable text & emoji elements overlay */}
                  <div className="absolute inset-0 z-20 pointer-events-none">
                    {elements.map((el) => {
                      const isSel = activeElementId === el.id;
                      return (
                        <motion.div
                          key={el.id}
                          drag
                          dragMomentum={false}
                          className="absolute pointer-events-auto cursor-grab active:cursor-grabbing"
                          style={{ left: '40%', top: '45%' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveElementId(isSel ? null : el.id);
                          }}
                        >
                          <div className="relative group">
                            {el.type === 'text' ? (
                              <span className="px-3 py-1.5 rounded-lg bg-black/65 border border-white/10 text-[10px] font-black uppercase text-white tracking-wider block shadow-md">
                                {el.content}
                              </span>
                            ) : (
                              <span className="text-3xl select-none block transform active:scale-115">
                                {el.content}
                              </span>
                            )}

                            {isSel && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setElements(elements.filter(x => x.id !== el.id));
                                }}
                                className="absolute -top-3 -right-3 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px] font-bold border border-white"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Bottom info: Music playing sticker inside mockup */}
                  <div className="absolute bottom-3 inset-x-3 bg-black/65 backdrop-blur-md p-2 rounded-xl border border-white/5 flex items-center justify-between z-20 pointer-events-auto">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div className="w-6 h-6 rounded-full bg-sky-500/10 border border-sky-400/20 flex items-center justify-center animate-spin shrink-0">
                        <Music className="w-3 h-3 text-sky-400" />
                      </div>
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-[8.5px] font-extrabold truncate text-sky-400">{selectedAudioTrack}</span>
                        <span className="text-[7.5px] text-gray-400 uppercase tracking-widest font-mono">Original Audio Layer</span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* VERTICAL FLOATING TOOL SHELF (Instagram style editor tools) */}
              <div className="absolute right-4 top-4 flex flex-col gap-3.5 z-30">
                <button 
                  onClick={() => { triggerHaptic('light'); setIsTextModalOpen(true); }}
                  className="w-9 h-9 rounded-full bg-black/75 border border-white/10 flex items-center justify-center text-white shadow-lg active:scale-95 transition-all"
                  title="Add Text"
                >
                  <Type className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => { triggerHaptic('light'); setIsStickerModalOpen(true); }}
                  className="w-9 h-9 rounded-full bg-black/75 border border-white/10 flex items-center justify-center text-white shadow-lg active:scale-95 transition-all"
                  title="Sticker"
                >
                  <Smile className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => { triggerHaptic('light'); setIsAudioModalOpen(true); }}
                  className="w-9 h-9 rounded-full bg-black/75 border border-white/10 flex items-center justify-center text-white shadow-lg active:scale-95 transition-all"
                  title="Audio Sync"
                >
                  <Music className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => { triggerHaptic('light'); setIsVolumeModalOpen(true); }}
                  className="w-9 h-9 rounded-full bg-black/75 border border-white/10 flex items-center justify-center text-white shadow-lg active:scale-95 transition-all"
                  title="Volume Controls"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={handleSimulateVoiceover}
                  className={`w-9 h-9 rounded-full border shadow-lg active:scale-95 transition-all flex items-center justify-center ${
                    isRecordingVoiceover ? 'bg-red-500 border-red-400 animate-pulse' : 'bg-black/75 border-white/10 text-white'
                  }`}
                  title="Voiceover"
                >
                  <Mic className="w-4 h-4" />
                </button>
                <button 
                  onClick={handleTriggerCaptions}
                  className={`w-9 h-9 rounded-full border shadow-lg active:scale-95 transition-all flex items-center justify-center ${
                    isGeneratingCaptions ? 'bg-amber-500 animate-spin border-amber-400' :
                    showCaptions ? 'bg-yellow-400 border-yellow-300 text-black font-extrabold' : 'bg-black/75 border-white/10 text-white'
                  }`}
                  title="Auto Subtitles"
                >
                  {isGeneratingCaptions ? <RefreshCw className="w-4 h-4" /> : <span className="text-[8px] font-mono font-black">CC</span>}
                </button>
                <button 
                  onClick={() => setIsCoverModalOpen(true)}
                  className="w-9 h-9 rounded-full bg-black/75 border border-white/10 flex items-center justify-center text-white shadow-lg active:scale-95 transition-all"
                  title="Cover Frame Select"
                >
                  <Film className="w-4 h-4" />
                </button>
              </div>

              {/* TIMELINE UTILITIES SLIDE-IN (Trim / Split / Speed) */}
              <div className="bg-[#08080d] border-t border-white/5 py-3.5 px-4 flex flex-col gap-3 shrink-0">
                
                {/* Trim & Split timeline panel */}
                <div className="flex flex-col gap-1 bg-black/40 border border-white/5 rounded-xl p-2.5">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">Reels Timeline (15s Max)</span>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => { triggerHaptic('light'); setIsTrimActive(!isTrimActive); setIsSplitActive(false); }}
                        className={`text-[8.5px] font-mono uppercase px-2 py-0.5 rounded ${isTrimActive ? 'bg-sky-500 text-black font-bold' : 'bg-white/5 text-gray-400'}`}
                      >
                        Trim
                      </button>
                      <button 
                        onClick={() => { triggerHaptic('light'); setIsSplitActive(!isSplitActive); setIsTrimActive(false); }}
                        className={`text-[8.5px] font-mono uppercase px-2 py-0.5 rounded ${isSplitActive ? 'bg-sky-500 text-black font-bold' : 'bg-white/5 text-gray-400'}`}
                      >
                        Split
                      </button>
                    </div>
                  </div>

                  {/* The interactive timeline visualizer */}
                  <div className="relative h-6 bg-white/5 rounded-lg border border-white/5 mt-1.5 flex items-center overflow-hidden">
                    {/* Simulated video film strip striping */}
                    <div className="absolute inset-0 opacity-15 flex justify-between pointer-events-none">
                      {[...Array(10)].map((_, i) => (
                        <div key={i} className="w-1.5 h-full bg-white/40 border-r border-black" />
                      ))}
                    </div>

                    {/* Dynamic Trim Selection Mask */}
                    {isTrimActive && (
                      <div 
                        className="absolute h-full bg-sky-500/25 border-x-2 border-sky-400 z-10"
                        style={{
                          left: `${(trimStart / 15) * 100}%`,
                          right: `${100 - (trimEnd / 15) * 100}%`
                        }}
                      />
                    )}

                    {/* Split Cut point Indicator */}
                    {isSplitActive && (
                      <div 
                        className="absolute h-full w-0.5 bg-yellow-400 z-20 shadow-lg shadow-yellow-400"
                        style={{ left: `${(splitPoint / 15) * 100}%` }}
                      >
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[7.5px] font-black text-yellow-400">CUT</span>
                      </div>
                    )}

                    {/* Playhead progress pointer */}
                    <div 
                      className="absolute h-full w-0.5 bg-white z-10"
                      style={{ left: `${(playProgress / 15) * 100}%` }}
                    />
                  </div>

                  {/* Detailed interactive input sliders */}
                  {isTrimActive && (
                    <div className="flex items-center justify-between gap-4 mt-2 px-1">
                      <div className="flex flex-col gap-0.5 w-1/2">
                        <span className="text-[8px] text-gray-500">Trim Start: {trimStart}s</span>
                        <input 
                          type="range" 
                          min={0} 
                          max={10} 
                          step={0.5}
                          value={trimStart} 
                          onChange={(e) => { setTrimStart(parseFloat(e.target.value)); triggerHaptic('light'); }}
                          className="w-full accent-sky-400 bg-white/10 h-1 rounded-lg"
                        />
                      </div>
                      <div className="flex flex-col gap-0.5 w-1/2">
                        <span className="text-[8px] text-gray-500">Trim End: {trimEnd}s</span>
                        <input 
                          type="range" 
                          min={11} 
                          max={15} 
                          step={0.5}
                          value={trimEnd} 
                          onChange={(e) => { setTrimEnd(parseFloat(e.target.value)); triggerHaptic('light'); }}
                          className="w-full accent-sky-400 bg-white/10 h-1 rounded-lg"
                        />
                      </div>
                    </div>
                  )}

                  {isSplitActive && (
                    <div className="flex flex-col gap-1 mt-2 px-1">
                      <div className="flex justify-between items-center">
                        <span className="text-[8px] text-gray-500">Select split frame index: {splitPoint}s</span>
                        <button 
                          onClick={() => {
                            triggerHaptic('success');
                            triggerSuccessParty(`Reel split at ${splitPoint}s into Segment A and Segment B!`);
                            setIsSplitActive(false);
                          }}
                          className="text-[8px] font-mono font-bold uppercase text-yellow-400 bg-yellow-400/10 py-0.5 px-2 rounded border border-yellow-400/20"
                        >
                          Cut Segment
                        </button>
                      </div>
                      <input 
                        type="range" 
                        min={1} 
                        max={14} 
                        step={0.1}
                        value={splitPoint} 
                        onChange={(e) => { setSplitPoint(parseFloat(e.target.value)); triggerHaptic('light'); }}
                        className="w-full accent-yellow-400 bg-white/10 h-1 rounded-lg mt-0.5"
                      />
                    </div>
                  )}
                </div>

                {/* Speed Controls + Color Filters */}
                <div className="flex items-center justify-between gap-3 mt-1">
                  <div className="flex flex-col gap-1">
                    <span className="text-[8.5px] font-mono text-gray-500 uppercase tracking-widest px-1">Speed Playback</span>
                    <div className="flex gap-1.5 bg-black/40 border border-white/5 rounded-full p-0.5">
                      {([0.5, 1, 2, 3] as const).map(sp => (
                        <button
                          key={sp}
                          onClick={() => { triggerHaptic('selection'); setSpeed(sp); }}
                          className={`w-7 h-7 rounded-full text-[9px] font-bold font-mono transition-all flex items-center justify-center ${
                            speed === sp ? 'bg-white text-black font-extrabold' : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          {sp}x
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex-grow flex flex-col gap-1 text-right">
                    <span className="text-[8.5px] font-mono text-gray-500 uppercase tracking-widest px-1">Studio Color Filters</span>
                    <div className="flex gap-1 justify-end">
                      {filtersList.slice(0, 4).map(flt => (
                        <button
                          key={flt.id}
                          onClick={() => { triggerHaptic('selection'); setActiveFilter(flt.id); }}
                          className={`py-1 px-2.5 rounded-full text-[9px] font-bold border transition-all ${
                            activeFilter === flt.id 
                              ? 'bg-sky-500 text-black border-sky-400 font-extrabold' 
                              : 'bg-white/5 text-gray-400 border-white/5'
                          }`}
                        >
                          {flt.name.split(' ')[0]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {/* STEP 3: HIGH FIDELITY REELS PUBLISH SCREEN */}
          {step === 'publish' && (
            <motion.div 
              key="publish"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-grow flex flex-col h-full bg-[#030307] p-4 gap-4 overflow-y-auto"
            >
              {/* Media Preview & Caption Section */}
              <div className="flex gap-4 bg-[#08080c] border border-white/5 rounded-2xl p-4 shadow-xl">
                {/* 9:16 Media Thumbnail with frame cover & edit button */}
                <div className="w-18 aspect-[9/16] rounded-xl overflow-hidden bg-neutral-950 border border-white/10 shrink-0 relative flex items-center justify-center">
                  <img 
                    src={coverFrames[coverIndex]} 
                    className="w-full h-full object-cover"
                    alt="Reel Cover"
                  />
                  <button 
                    onClick={() => setIsCoverModalOpen(true)}
                    className="absolute inset-x-0 bottom-0 py-1 bg-black/75 text-[7px] font-black uppercase text-sky-400 border-t border-white/5"
                  >
                    Edit Cover
                  </button>
                </div>

                {/* Caption Field */}
                <div className="flex-grow flex flex-col">
                  <textarea
                    placeholder="Write a caption for your Reel... Add trending #hashtags and mention collaborators!"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    className="w-full h-24 bg-transparent text-xs text-white placeholder-gray-500 border-0 focus:ring-0 resize-none outline-none font-sans mt-1"
                  />
                </div>
              </div>

              {/* Quick Reels Hashtag Suggestions */}
              <div className="flex flex-col gap-1 px-1">
                <span className="text-[8.5px] font-mono text-gray-500 uppercase tracking-wider">Reels Hot Tags</span>
                <div className="flex flex-wrap gap-1.5 mt-0.5">
                  {['#reelsviral', '#trendingclips', '#creativelife', '#loophacks', '#soundson', '#bts', '#lofi'].map(tag => (
                    <button
                      key={tag}
                      onClick={() => {
                        triggerHaptic('light');
                        if (!caption.includes(tag)) {
                          setCaption(prev => prev.trim() + ' ' + tag);
                        }
                      }}
                      className="py-1 px-2.5 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 text-[9px] font-semibold text-pink-400"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tag Collaborators */}
              <div className="flex flex-col gap-2.5 bg-[#08080c] border border-white/5 rounded-2xl p-4 shadow-xl">
                <span className="text-[10px] font-mono tracking-wider text-gray-400 uppercase">Tag People / Collaborators</span>
                <div className="flex gap-2 overflow-x-auto py-0.5 scrollbar-none">
                  {users.map(u => {
                    const isTagged = taggedPeople.includes(u.id);
                    return (
                      <button
                        key={u.id}
                        onClick={() => {
                          triggerHaptic('selection');
                          if (isTagged) {
                            setTaggedPeople(taggedPeople.filter(id => id !== u.id));
                          } else {
                            setTaggedPeople([...taggedPeople, u.id]);
                            setCaption(prev => prev.trim() + ` @${u.username}`);
                          }
                        }}
                        className={`flex items-center gap-1.5 py-1 px-3 rounded-full text-[9px] font-bold border transition-all ${
                          isTagged 
                            ? 'bg-pink-500 text-black border-pink-400' 
                            : 'bg-white/5 text-gray-300 border-white/5 hover:bg-white/10'
                        }`}
                      >
                        <img src={u.profilePic} className="w-3.5 h-3.5 rounded-full object-cover" alt="" />
                        <span>@{u.username}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Add Location */}
              <div className="flex flex-col gap-2 bg-[#08080c] border border-white/5 rounded-2xl p-4 shadow-xl">
                <span className="text-[10px] font-mono tracking-wider text-gray-400 uppercase">Location</span>
                <div className="flex gap-2 overflow-x-auto py-0.5 scrollbar-none">
                  {['Mumbai, India', 'Bangalore Tech Park', 'Creative Arena', 'Lonavala Hills', 'Goa beach'].map(loc => (
                    <button
                      key={loc}
                      onClick={() => {
                        triggerHaptic('selection');
                        setLocation(loc === location ? '' : loc);
                      }}
                      className={`py-1 px-3 rounded-full text-[9px] font-bold border transition-all ${
                        location === loc 
                          ? 'bg-white text-black border-white' 
                          : 'bg-white/5 text-gray-300 border-white/5 hover:bg-white/10'
                      }`}
                    >
                      {loc}
                    </button>
                  ))}
                </div>
              </div>

              {/* Advanced Reels parameters */}
              <div className="bg-[#08080c] border border-white/5 rounded-2xl p-4 flex flex-col gap-3.5 shadow-xl">
                
                {/* Share to Stories toggle */}
                <div className="flex justify-between items-center">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-bold">Syndicate to Story Feed</span>
                    <span className="text-[8px] text-gray-400">Post this reel snippet directly to story</span>
                  </div>
                  <button
                    onClick={() => { triggerHaptic('light'); setShareToStory(!shareToStory); }}
                    className={`w-9 h-5 rounded-full transition-all flex items-center p-0.5 cursor-pointer ${
                      shareToStory ? 'bg-pink-500 justify-end' : 'bg-gray-700 justify-start'
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full bg-black shadow-md" />
                  </button>
                </div>

                {/* Cross post to FB toggle */}
                <div className="flex justify-between items-center">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-bold">Recommend on Facebook</span>
                    <span className="text-[8px] text-gray-400">Syndicate algorithms cross-platform</span>
                  </div>
                  <button
                    onClick={() => { triggerHaptic('light'); setCrossPostFB(!crossPostFB); }}
                    className={`w-9 h-5 rounded-full transition-all flex items-center p-0.5 cursor-pointer ${
                      crossPostFB ? 'bg-pink-500 justify-end' : 'bg-gray-700 justify-start'
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full bg-black shadow-md" />
                  </button>
                </div>

                {/* Allow Downloads toggle */}
                <div className="flex justify-between items-center">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-bold">Allow Downloads</span>
                    <span className="text-[8px] text-gray-400">Allow users to remix or download offline</span>
                  </div>
                  <button
                    onClick={() => { triggerHaptic('light'); setAllowDownloads(!allowDownloads); }}
                    className={`w-9 h-5 rounded-full transition-all flex items-center p-0.5 cursor-pointer ${
                      allowDownloads ? 'bg-pink-500 justify-end' : 'bg-gray-700 justify-start'
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full bg-black shadow-md" />
                  </button>
                </div>
              </div>

              {/* Save draft */}
              <div className="flex gap-2.5 mt-2 pb-8">
                <button
                  onClick={() => {
                    triggerHaptic('success');
                    triggerSuccessParty("Reel sequence template synced offline inside Local Drafts");
                    onClose();
                  }}
                  className="flex-grow py-3 bg-[#08080d] hover:bg-[#0c0c14] active:scale-95 transition-all border border-white/5 text-[10px] font-extrabold uppercase rounded-full text-center tracking-widest text-gray-400 flex items-center justify-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5 text-gray-400" />
                  <span>Save Draft</span>
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* TEXT CREATION OVERLAY */}
      <AnimatePresence>
        {isTextModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/95 z-50 flex flex-col p-4 justify-between"
          >
            <div className="flex justify-between items-center">
              <button onClick={() => setIsTextModalOpen(false)} className="text-xs text-gray-400">Cancel</button>
              <button onClick={handleAddText} className="text-xs font-bold text-sky-400">Done</button>
            </div>
            <div className="flex-grow flex items-center justify-center">
              <textarea
                autoFocus
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Type dynamic subtitle..."
                className="w-full max-w-sm bg-transparent border-0 text-center font-black uppercase tracking-wider text-white text-2xl outline-none focus:ring-0 resize-none"
              />
            </div>
            <div className="h-10" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* STICKERS / EMOJIS OVERLAY */}
      <AnimatePresence>
        {isStickerModalOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="absolute inset-x-0 bottom-0 max-h-[75%] bg-[#08080d]/95 border-t border-white/15 rounded-t-[32px] z-50 p-5 flex flex-col gap-4 shadow-2xl"
          >
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400 font-mono">Select Emoji Sticker</span>
              <button onClick={() => setIsStickerModalOpen(false)} className="p-1 text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-4 gap-4 py-4 overflow-y-auto max-h-[300px]">
              {['🔥', '✨', '👾', '🎉', '💖', '👀', '💯', '🌈', '⚡️', '🌟', '💀', '🍕'].map(emoji => (
                <button
                  key={emoji}
                  onClick={() => handleAddEmoji(emoji)}
                  className="text-4xl py-2 hover:bg-white/5 active:scale-90 transition-all rounded-xl"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AUDIO LIBRARY SELECTOR OVERLAY */}
      <AnimatePresence>
        {isAudioModalOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="absolute inset-x-0 bottom-0 max-h-[75%] bg-[#08080d]/95 border-t border-white/15 rounded-t-[32px] z-50 p-5 flex flex-col gap-4 shadow-2xl"
          >
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400 font-mono">Instagram Music Library</span>
              <button onClick={() => setIsAudioModalOpen(false)} className="p-1 text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex flex-col gap-2 overflow-y-auto max-h-[320px]">
              {audioLibrary.map(track => (
                <button
                  key={track.title}
                  onClick={() => {
                    triggerHaptic('success');
                    setSelectedAudioTrack(`${track.title} - ${track.artist}`);
                    setIsAudioModalOpen(false);
                  }}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 text-left transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-pink-500/10 border border-pink-500/20 flex items-center justify-center shrink-0">
                      <Music className="w-4 h-4 text-pink-400" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold">{track.title}</span>
                      <span className="text-[10px] text-gray-400">{track.artist}</span>
                    </div>
                  </div>
                  <span className="text-[8px] font-mono text-pink-400 bg-pink-500/10 px-1.5 py-0.5 rounded font-black">
                    {track.useCount}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MULTI-CHANNEL VOLUME PANEL */}
      <AnimatePresence>
        {isVolumeModalOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="absolute inset-x-0 bottom-0 bg-[#08080d]/95 border-t border-white/15 rounded-t-[32px] z-50 p-6 flex flex-col gap-4 shadow-2xl"
          >
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400 font-mono">Volume Mixer Controls</span>
              <button onClick={() => setIsVolumeModalOpen(false)} className="p-1 text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex flex-col gap-4 py-4">
              {/* Original audio */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-gray-300">Original Camera Audio</span>
                  <span className="font-mono text-gray-400">{volumeOriginal}%</span>
                </div>
                <input 
                  type="range"
                  min={0}
                  max={100}
                  value={volumeOriginal}
                  onChange={(e) => setVolumeOriginal(parseInt(e.target.value))}
                  className="w-full accent-sky-400 bg-white/10 h-1.5 rounded-lg"
                />
              </div>

              {/* Added music */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-gray-300">Added Music Track</span>
                  <span className="font-mono text-gray-400">{volumeMusic}%</span>
                </div>
                <input 
                  type="range"
                  min={0}
                  max={100}
                  value={volumeMusic}
                  onChange={(e) => setVolumeMusic(parseInt(e.target.value))}
                  className="w-full accent-pink-500 bg-white/10 h-1.5 rounded-lg"
                />
              </div>

              {/* Voiceover track */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-gray-300">Voiceover Record Layer</span>
                  {hasVoiceover ? (
                    <span className="font-mono text-gray-400">{volumeVoiceover}%</span>
                  ) : (
                    <span className="text-[8px] font-mono uppercase bg-red-500/10 text-red-400 px-1 py-0.5 rounded">NO LAYER RECORDED</span>
                  )}
                </div>
                <input 
                  type="range"
                  min={0}
                  max={100}
                  disabled={!hasVoiceover}
                  value={volumeVoiceover}
                  onChange={(e) => setVolumeVoiceover(parseInt(e.target.value))}
                  className="w-full accent-yellow-400 bg-white/10 h-1.5 rounded-lg disabled:opacity-30"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* COVER TIMELINE SELECTOR OVERLAY */}
      <AnimatePresence>
        {isCoverModalOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="absolute inset-x-0 bottom-0 bg-[#08080d]/95 border-t border-white/15 rounded-t-[32px] z-50 p-5 flex flex-col gap-4 shadow-2xl"
          >
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400 font-mono">Select Reel Cover Thumbnail</span>
              <button onClick={() => setIsCoverModalOpen(false)} className="p-1 text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex flex-col gap-4 py-4">
              <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest text-center">Tap video timeline frame to freeze cover thumbnail</span>
              
              <div className="flex justify-between gap-2 overflow-x-auto py-2">
                {coverFrames.map((frame, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      triggerHaptic('selection');
                      setCoverIndex(index);
                    }}
                    className={`relative w-16 aspect-[9/16] rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
                      coverIndex === index ? 'border-sky-400 scale-105 shadow-xl' : 'border-white/10 hover:border-white/30'
                    }`}
                  >
                    <img src={frame} className="w-full h-full object-cover" alt="" />
                    {coverIndex === index && (
                      <div className="absolute inset-0 bg-sky-500/10 flex items-center justify-center">
                        <Check className="w-6 h-6 text-sky-400 font-bold" />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setIsCoverModalOpen(false)}
                className="w-full py-2.5 bg-sky-400 text-black text-xs font-black uppercase rounded-xl tracking-wider mt-2 hover:brightness-110"
              >
                Done
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
