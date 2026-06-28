/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, Camera, Upload, Download, Link, Smile, Music, Sparkles, Trash2, 
  Type, Sticker, Check, Play, Pause, RefreshCw, X, MoreHorizontal, Star, 
  Send, PenTool, CheckCircle2, Sliders, Undo2
} from 'lucide-react';

interface User {
  id: string;
  username: string;
  displayName: string;
  profilePic: string;
}

interface StoryElement {
  id: string;
  type: 'text' | 'poll' | 'question' | 'link' | 'music' | 'sticker' | 'mention';
  x: number;
  y: number;
  scale: number;
  
  // Text elements
  text?: string;
  textStyle?: 'classic' | 'modern' | 'neon' | 'serif' | 'strong';
  textColor?: string;
  textBg?: string; 
  
  // Poll elements
  pollQuestion?: string;
  pollYes?: string;
  pollNo?: string;
  
  // Question elements
  questionPrompt?: string;
  questionTheme?: 'cyan' | 'pink' | 'emerald';
  
  // Link elements
  linkUrl?: string;
  linkText?: string;
  
  // Music elements
  musicTitle?: string;
  
  // Sticker elements
  stickerEmoji?: string;

  // Mention elements
  mentionUser?: string;
}

interface StoryWorkspaceProps {
  users: User[];
  currentUser: any;
  addStory: (
    media: string,
    caption: string,
    questionPrompt?: string,
    pollConfig?: any,
    allowDownloads?: boolean,
    mediaType?: 'image' | 'video'
  ) => void;
  triggerSuccessParty: (msg: string) => void;
  triggerHaptic: (style: 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'warning') => void;
  onClose: () => void;
  initialMedia?: string | null;
}

const mockBackdrops = [
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800', // Sunset Ocean
  'https://images.unsplash.com/photo-1515621061946-eff1c2a352bd?w=800', // Neon Cyberpunk
  'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800', // Workspace setup
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800', // Mountains
  'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800', // Music Sound Festival
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800'  // Aesthetic Gadget
];

const mockGifs = [
  { name: '✨ Sparkle', class: 'animate-pulse text-amber-300 font-extrabold text-sm', render: '✨✨✨' },
  { name: '🔥 Fire Pulse', class: 'animate-bounce text-red-500 text-lg', render: '🔥🔥' },
  { name: '⚡ Cyber Node', class: 'animate-spin duration-3000 text-cyan-400', render: '🌀' },
  { name: '💖 Heart Beat', class: 'animate-ping duration-1000 text-rose-500', render: '❤️' },
  { name: '👋 Hello Giphy', class: 'animate-bounce text-yellow-300', render: '👋👽' },
  { name: '🍿 Movie Night', class: 'animate-pulse text-purple-400', render: '🍿🎬' },
];

const mockSongs = [
  { title: 'Cyber Horizon Horizon', artist: 'HyperX', duration: '2:40' },
  { title: 'Lo-Fi Chill Wind', artist: 'Beats Lab', duration: '3:15' },
  { title: 'Sunset Cafe Vibes', artist: 'Gold Wave', duration: '1:58' },
  { title: 'Neon Highway Pulse', artist: 'Grid Driver', duration: '2:22' }
];

export default function StoryWorkspace({
  users,
  currentUser,
  addStory,
  triggerSuccessParty,
  triggerHaptic,
  onClose,
  initialMedia
}: StoryWorkspaceProps) {
  
  // Core UI layout states
  const [isStoryEditorActive, setIsStoryEditorActive] = useState(!!initialMedia);
  const [storyBackgroundMedia, setStoryBackgroundMedia] = useState<string | null>(initialMedia || null);
  const [storyElements, setStoryElements] = useState<StoryElement[]>([]);
  const [currentFilter, setCurrentFilter] = useState<'none' | 'grayscale' | 'vintage' | 'neon' | 'vhs'>('none');
  const [filterToast, setFilterToast] = useState<string | null>(null);

  // Story background media loading & simulated permission states
  const [storyMediaLoadStatus, setStoryMediaLoadStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [storyRetryCount, setStoryRetryCount] = useState(0);
  const [permissionStatus, setPermissionStatus] = useState<'requesting' | 'granted' | 'denied'>('requesting');

  // Sync background media load status
  useEffect(() => {
    if (storyBackgroundMedia) {
      setStoryMediaLoadStatus('loading');
    } else {
      setStoryMediaLoadStatus('loaded');
    }
  }, [storyBackgroundMedia, storyRetryCount]);

  // Simulate hardware access checking
  useEffect(() => {
    setPermissionStatus('requesting');
    const t = setTimeout(() => {
      setPermissionStatus('granted');
    }, 450);
    return () => clearTimeout(t);
  }, [isStoryEditorActive]);
  
  // Camera & Device states
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('user');
  const [isCapturingAnim, setIsCapturingAnim] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  
  // Overlay Panel controllers
  const [isStickerOverlayOpen, setIsStickerOverlayOpen] = useState(false);
  const [isMusicOverlayOpen, setIsMusicOverlayOpen] = useState(false);
  const [isTextEditorOpen, setIsTextEditorOpen] = useState(false);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [isAdvancedMenuOpen, setIsAdvancedMenuOpen] = useState(false);

  // Text Editor Draft controller
  const [textEditorDraft, setTextEditorDraft] = useState('');
  const [textEditorStyle, setTextEditorStyle] = useState<'classic' | 'modern' | 'neon' | 'serif' | 'strong'>('modern');
  const [textEditorColor, setTextEditorColor] = useState('#ffffff');
  const [textEditorBg, setTextEditorBg] = useState('transparent');
  const [textEditorTargetId, setTextEditorTargetId] = useState<string | null>(null);

  // Draw states
  const [drawingColor, setDrawingColor] = useState('#f43f5e'); // Pink default
  const [drawingBrushSize, setDrawingBrushSize] = useState(6);

  // Publish details
  const [storyCaption, setStoryCaption] = useState('');
  const [closeFriendsOnly, setCloseFriendsOnly] = useState(false);
  const [allowDownloads, setAllowDownloads] = useState(true);
  const [gifSearchQuery, setGifSearchQuery] = useState('');

  // Refs for camera stream and canvas measurements
  const cameraVideoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);

  // Drag states
  const [draggedElementId, setDraggedElementId] = useState<string | null>(null);
  const [isDraggingActive, setIsDraggingActive] = useState(false);
  const [activeEditingElementId, setActiveEditingElementId] = useState<string | null>(null);

  // 1. Camera streams startup and teardown
  useEffect(() => {
    let active = true;
    if (!storyBackgroundMedia) {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: { facingMode: cameraFacing }, audio: false })
          .then(stream => {
            if (active) {
              setCameraStream(stream);
              if (cameraVideoRef.current) {
                cameraVideoRef.current.srcObject = stream;
                cameraVideoRef.current.play().catch(() => {});
              }
            }
          })
          .catch(err => {
            console.warn("Real webcam stream access blocked or not supported:", err);
          });
      }
    } else {
      // Disconnect camera stream when background media is loaded
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        setCameraStream(null);
      }
    }
    return () => {
      active = false;
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [storyBackgroundMedia, cameraFacing]);

  // 2. Setup Drawing canvas sizing dynamically when drawing mode begins
  useEffect(() => {
    if (isDrawingMode && drawingCanvasRef.current) {
      const canvas = drawingCanvasRef.current;
      canvas.width = canvas.parentElement?.clientWidth || 334;
      canvas.height = canvas.parentElement?.clientHeight || 580;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, [isDrawingMode]);

  // Handle Dragging coordinates calculations
  const handleStartDrag = (id: string, e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    setDraggedElementId(id);
    setIsDraggingActive(true);
  };

  const handleCanvasMove = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!draggedElementId) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    
    let clientX = 0;
    let clientY = 0;
    if ('touches' in e) {
      if (e.touches.length === 0) return;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    const x = Math.max(5, Math.min(95, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.max(5, Math.min(95, ((clientY - rect.top) / rect.height) * 100));
    
    setStoryElements(prev => prev.map(el => el.id === draggedElementId ? { ...el, x, y } : el));
  };

  const handleDragEnd = (e: React.MouseEvent | React.TouchEvent) => {
    if (!draggedElementId) return;
    
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      let clientY = 0;
      if ('changedTouches' in e) {
        if (e.changedTouches.length > 0) {
          clientY = e.changedTouches[0].clientY;
        }
      } else {
        clientY = e.clientY;
      }
      
      const relativeY = clientY - rect.top;
      // Drag near bottom trash bin area (bottom 90px) to delete
      if (relativeY > rect.height - 90) {
        setStoryElements(prev => prev.filter(el => el.id !== draggedElementId));
        triggerHaptic('warning');
      }
    }
    
    setDraggedElementId(null);
    setIsDraggingActive(false);
  };

  const updateElementProp = (id: string, prop: keyof StoryElement, value: any) => {
    setStoryElements(prev => prev.map(el => el.id === id ? { ...el, [prop]: value } : el));
  };

  // Drawing canvas tracking methods
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    isDrawingRef.current = true;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    
    let clientX = 0;
    let clientY = 0;
    if ('touches' in e) {
      if (e.touches.length === 0) return;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = drawingColor;
    ctx.lineWidth = drawingBrushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const drawMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    
    let clientX = 0;
    let clientY = 0;
    if ('touches' in e) {
      if (e.touches.length === 0) return;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const endDrawing = () => {
    isDrawingRef.current = false;
  };

  const clearDrawing = () => {
    const canvas = drawingCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      triggerHaptic('warning');
    }
  };

  // Spawn Element Helpers
  const spawnPoll = () => {
    const newEl: StoryElement = {
      id: 'poll_' + Math.random().toString(36).substring(2, 9),
      type: 'poll',
      x: 50,
      y: 45,
      scale: 1,
      pollQuestion: 'Are you joining?',
      pollYes: 'Yes',
      pollNo: 'No'
    };
    setStoryElements(prev => [...prev, newEl]);
    setIsStickerOverlayOpen(false);
    setActiveEditingElementId(newEl.id);
    triggerHaptic('selection');
  };

  const spawnQuestion = () => {
    const newEl: StoryElement = {
      id: 'ques_' + Math.random().toString(36).substring(2, 9),
      type: 'question',
      x: 50,
      y: 40,
      scale: 1,
      questionPrompt: 'Ask me anything...',
      questionTheme: 'pink'
    };
    setStoryElements(prev => [...prev, newEl]);
    setIsStickerOverlayOpen(false);
    setActiveEditingElementId(newEl.id);
    triggerHaptic('selection');
  };

  const spawnLink = () => {
    const newEl: StoryElement = {
      id: 'link_' + Math.random().toString(36).substring(2, 9),
      type: 'link',
      x: 50,
      y: 55,
      scale: 1,
      linkUrl: 'https://google.com',
      linkText: 'Visit Workspace'
    };
    setStoryElements(prev => [...prev, newEl]);
    setIsStickerOverlayOpen(false);
    setActiveEditingElementId(newEl.id);
    triggerHaptic('selection');
  };

  const spawnMusicSticker = (songTitle: string) => {
    const newEl: StoryElement = {
      id: 'music_' + Math.random().toString(36).substring(2, 9),
      type: 'music',
      x: 50,
      y: 65,
      scale: 1,
      musicTitle: songTitle
    };
    setStoryElements(prev => [...prev, newEl]);
    setIsMusicOverlayOpen(false);
    triggerHaptic('success');
  };

  const spawnEmoji = (emoji: string) => {
    const newEl: StoryElement = {
      id: 'emoji_' + Math.random().toString(36).substring(2, 9),
      type: 'sticker',
      x: 40 + Math.random() * 20,
      y: 35 + Math.random() * 20,
      scale: 1,
      stickerEmoji: emoji
    };
    setStoryElements(prev => [...prev, newEl]);
    setIsStickerOverlayOpen(false);
    triggerHaptic('selection');
  };

  const spawnMentionSticker = (username: string) => {
    const newEl: StoryElement = {
      id: 'mention_' + Math.random().toString(36).substring(2, 9),
      type: 'mention',
      x: 50,
      y: 30,
      scale: 1,
      mentionUser: username
    };
    setStoryElements(prev => [...prev, newEl]);
    setIsStickerOverlayOpen(false);
    triggerHaptic('success');
  };

  // Trigger centered modal text composer
  const handleOpenTextEditor = (existingId: string | null = null, defaultText = '') => {
    if (existingId) {
      const el = storyElements.find(e => e.id === existingId);
      if (el) {
        setTextEditorTargetId(existingId);
        setTextEditorDraft(el.text || '');
        setTextEditorStyle(el.textStyle || 'modern');
        setTextEditorColor(el.textColor || '#ffffff');
        setTextEditorBg(el.textBg || 'transparent');
      }
    } else {
      setTextEditorTargetId(null);
      setTextEditorDraft(defaultText);
      setTextEditorStyle('modern');
      setTextEditorColor('#ffffff');
      setTextEditorBg('transparent');
    }
    setIsTextEditorOpen(true);
  };

  const handleSaveTextEditor = () => {
    const cleanDraft = textEditorDraft.trim();
    if (!cleanDraft) {
      if (textEditorTargetId) {
        setStoryElements(prev => prev.filter(e => e.id !== textEditorTargetId));
      }
      setIsTextEditorOpen(false);
      return;
    }

    if (textEditorTargetId) {
      setStoryElements(prev => prev.map(el => el.id === textEditorTargetId ? {
        ...el,
        text: cleanDraft,
        textStyle: textEditorStyle,
        textColor: textEditorColor,
        textBg: textEditorBg
      } : el));
    } else {
      const newEl: StoryElement = {
        id: 'txt_' + Math.random().toString(36).substring(2, 9),
        type: 'text',
        x: 50,
        y: 40 + (storyElements.filter(e => e.type === 'text').length * 7) % 30,
        scale: 1,
        text: cleanDraft,
        textStyle: textEditorStyle,
        textColor: textEditorColor,
        textBg: textEditorBg
      };
      setStoryElements(prev => [...prev, newEl]);
    }
    setIsTextEditorOpen(false);
    triggerHaptic('selection');
  };

  // Cycle Effects (Filters)
  const toggleEffectFilter = () => {
    const filters: ('none' | 'grayscale' | 'vintage' | 'neon' | 'vhs')[] = ['none', 'grayscale', 'vintage', 'neon', 'vhs'];
    const nextIndex = (filters.indexOf(currentFilter) + 1) % filters.length;
    const nextFilter = filters[nextIndex];
    setCurrentFilter(nextFilter);
    triggerHaptic('selection');

    // Display temporary Instagram-like filter label toast
    const filterNames = {
      none: 'Normal',
      grayscale: 'Paris (B&W)',
      vintage: 'Melbourne (Vintage)',
      neon: 'Tokyo (Neon)',
      vhs: 'Glitch (VHS Retro)'
    };
    setFilterToast(filterNames[nextFilter]);
    setTimeout(() => {
      setFilterToast(null);
    }, 1500);
  };

  // Shutter Take picture action
  const handleShutterCapture = () => {
    setIsCapturingAnim(true);
    triggerHaptic('heavy');
    
    // Select random gorgeous backdrop photo
    setTimeout(() => {
      setIsCapturingAnim(false);
      const randMedia = mockBackdrops[Math.floor(Math.random() * mockBackdrops.length)];
      setStoryBackgroundMedia(randMedia);
      setIsStoryEditorActive(true);
      setStoryElements([]);
    }, 250);
  };

  // Gallery Select file action
  const handleGalleryFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setStoryBackgroundMedia(url);
      setIsStoryEditorActive(true);
      setStoryElements([]);
      triggerHaptic('medium');
    }
  };

  // Publish dispatched Story
  const handlePublishClick = () => {
    // 1. Resolve Poll widget
    const canvasPoll = storyElements.find(el => el.type === 'poll');
    const fullPollConfig = canvasPoll ? {
      question: canvasPoll.pollQuestion || 'Are you joining?',
      options: [
        { text: canvasPoll.pollYes || 'Yes', votes: 0 },
        { text: canvasPoll.pollNo || 'No', votes: 0 }
      ]
    } : undefined;

    // 2. Resolve Question widget
    const canvasQuestion = storyElements.find(el => el.type === 'question');
    const resolvedQuestionPrompt = canvasQuestion ? (canvasQuestion.questionPrompt || 'Ask me anything...') : undefined;

    // 3. Compile all stickers and text blocks into an overlay description
    const textElements = storyElements.filter(el => el.type === 'text');
    const linkElements = storyElements.filter(el => el.type === 'link');
    const emojiElements = storyElements.filter(el => el.type === 'sticker');
    const mentionElements = storyElements.filter(el => el.type === 'mention');

    let compiledCaption = textElements.map(el => el.text).join(' ');
    if (storyCaption) {
      compiledCaption = storyCaption + (compiledCaption ? ' • ' + compiledCaption : '');
    }

    if (linkElements.length > 0) {
      compiledCaption += ' ' + linkElements.map(el => `🔗 ${el.linkText || el.linkUrl}`).join(' ');
    }
    if (emojiElements.length > 0) {
      compiledCaption += ' ' + emojiElements.map(el => el.stickerEmoji).join('');
    }
    if (mentionElements.length > 0) {
      compiledCaption += ' ' + mentionElements.map(el => `@${el.mentionUser}`).join(' ');
    }

    // Capture drawings image if possible, or use background
    const activeMedia = storyBackgroundMedia || mockBackdrops[0];
    const isVideoFile = activeMedia.endsWith('.mp4') || activeMedia.includes('mixkit.co') || activeMedia.includes('video');
    const mediaType = isVideoFile ? 'video' : 'image';

    addStory(
      activeMedia,
      compiledCaption || (closeFriendsOnly ? "Shared with Close Friends ⭐" : "New Story!"),
      resolvedQuestionPrompt,
      fullPollConfig,
      allowDownloads,
      mediaType
    );

    // Reset editor
    setStoryElements([]);
    setStoryBackgroundMedia(null);
    setIsStoryEditorActive(false);
    setStoryCaption('');

    const successMsg = closeFriendsOnly 
      ? "Published to your Close Friends Story green circle! ⭐" 
      : "Your full-screen Instagram Story was compiled and published successfully! 🚀";
    triggerSuccessParty(successMsg);
  };

  const getOverlayFontClass = (style: string) => {
    switch (style) {
      case 'mono': return 'font-mono tracking-wider';
      case 'serif': return 'font-serif italic';
      case 'strong': return 'font-display font-black tracking-tighter uppercase';
      case 'neon': return 'font-sans tracking-wide text-pink-400 font-extrabold';
      default: return 'font-sans font-bold tracking-tight';
    }
  };

  // CSS Filter styles dynamically bound
  const getFilterStyle = () => {
    switch (currentFilter) {
      case 'grayscale': return { filter: 'grayscale(100%) contrast(1.15)' };
      case 'vintage': return { filter: 'sepia(70%) contrast(1.05) saturate(95%) hue-rotate(-10deg)' };
      case 'neon': return { filter: 'saturate(190%) hue-rotate(50deg) contrast(1.1)' };
      case 'vhs': return { filter: 'contrast(125%) saturate(130%) brightness(105%) hue-rotate(-15deg)' };
      default: return {};
    }
  };

  return (
    <div className="w-full flex items-center justify-center py-2 relative select-none">
      
      {/* Smartphone mock layout structure (Proportionally matching 9:16 Instagram viewfinder) */}
      <div 
        className="w-full max-w-[342px] h-[610px] rounded-[38px] border-[7px] border-neutral-900 bg-black shadow-[0_24px_50px_-10px_rgba(0,0,0,0.8)] relative overflow-hidden flex flex-col justify-between"
      >
        
        {/* SHUTTER WHITE FLASH SCREEN CAPTURE LAYER */}
        <AnimatePresence>
          {isCapturingAnim && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
              className="absolute inset-0 bg-white z-50 pointer-events-none"
            />
          )}
        </AnimatePresence>

        {/* ======================================================== */}
        {/* STEP 1: CAMERA VIEW (If background media is not selected) */}
        {/* ======================================================== */}
        {!isStoryEditorActive && (
          <div className="absolute inset-0 z-10 flex flex-col justify-between p-4 relative h-full">
            
            {/* Viewfinder background: Real video stream OR gorgeous high-fidelity cyber simulated feed */}
            <div className="absolute inset-0 z-0 bg-neutral-950 overflow-hidden">
              {cameraStream ? (
                <video 
                  ref={cameraVideoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className={`w-full h-full object-cover ${cameraFacing === 'user' ? 'scale-x-[-1]' : ''}`} 
                />
              ) : (
                // HIGH FIDELITY simulated cosmic sensor grid backdrop
                <div className="w-full h-full bg-gradient-to-tr from-neutral-950 via-slate-900 to-indigo-950 relative flex items-center justify-center">
                  
                  {/* Rotating grid lens rings */}
                  <div className="absolute w-44 h-44 rounded-full border border-white/5 animate-pulse duration-3000 flex items-center justify-center">
                    <div className="w-32 h-32 rounded-full border border-dashed border-white/10 animate-spin duration-10000" />
                  </div>

                  {/* Pulsing focal square brackets */}
                  <div className="relative z-10 w-24 h-24 border border-cyan-400/20 rounded flex items-center justify-center">
                    <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-cyan-400/80" />
                    <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-cyan-400/80" />
                    <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-cyan-400/80" />
                    <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-cyan-400/80" />
                    <span className="text-[7px] font-mono text-cyan-400/60 uppercase tracking-widest animate-pulse">AUTO FOCUS</span>
                  </div>

                  {/* Tech specs indicators */}
                  <div className="absolute top-14 left-4 text-left font-mono text-[7px] text-gray-500 flex flex-col gap-0.5 leading-none">
                    <span>LENS: COMPOSER D24MM</span>
                    <span>ISO: 320 AUTO</span>
                    <span>F3.2 1/120S</span>
                    <span className="text-cyan-400/80 mt-1">● READY TO SHUTTER</span>
                  </div>

                  {/* Dynamic sparkles background */}
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.8))] pointer-events-none" />
                </div>
              )}
            </div>

            {/* Camera Viewfinder Header toolbar controls */}
            <div className="relative z-20 w-full flex justify-between items-center mt-3 pointer-events-auto">
              
              {/* Exit/Back button */}
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white active:scale-90 transition-transform cursor-pointer"
                title="Go back to Creative Deck"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>

              {/* Blinking REC state indicator */}
              <div className="flex items-center gap-1.5 bg-black/45 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 text-[8px] font-mono uppercase tracking-wider text-white">
                <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-ping" />
                <span className="font-bold">REC STORY</span>
              </div>

              {/* simulated options */}
              <div className="w-8 h-8" />
            </div>

            {/* Bottom Controls Area (Shutter, Gallery and camera flip) */}
            <div className="relative z-20 w-full flex flex-col gap-5 mt-auto pb-4">
              
              {/* Shutter bar */}
              <div className="flex justify-between items-center px-6 pointer-events-auto">
                
                {/* GALLERY SELECTION BUTTON */}
                <button
                  type="button"
                  onClick={() => {
                    const picker = document.getElementById('camera-gallery-file-input');
                    if (picker) picker.click();
                  }}
                  className="w-10 h-10 rounded-xl bg-neutral-900 border border-white/25 overflow-hidden flex items-center justify-center relative active:scale-95 transition-transform group cursor-pointer shadow-lg"
                  title="Upload from device gallery"
                >
                  <input 
                    id="camera-gallery-file-input"
                    type="file"
                    className="hidden"
                    accept="image/*,video/*"
                    onChange={handleGalleryFileSelect}
                  />
                  {/* Thumbnail preview style */}
                  <img 
                    src="https://images.unsplash.com/photo-1515621061946-eff1c2a352bd?w=100" 
                    className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform" 
                    alt="gallery preview"
                  />
                  <Upload className="w-4 h-4 text-white drop-shadow relative z-10 group-hover:translate-y-[-2px] transition-transform" />
                </button>

                {/* DOUBLE-RING CAPTURE BUTTON */}
                <button
                  type="button"
                  onClick={handleShutterCapture}
                  className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center active:scale-90 transition-all cursor-pointer shadow-2xl relative"
                  title="Snap mock snapshot"
                >
                  {/* Concentric solid circle */}
                  <div className="w-11 h-11 bg-white rounded-full hover:scale-95 duration-150 transition-transform" />
                </button>

                {/* CAMERA FLIP SWITCH */}
                <button
                  type="button"
                  onClick={() => {
                    setCameraFacing(prev => prev === 'user' ? 'environment' : 'user');
                    triggerHaptic('light');
                  }}
                  className="w-10 h-10 rounded-full bg-black/45 backdrop-blur-md border border-white/10 flex items-center justify-center text-white active:scale-90 transition-transform cursor-pointer shadow-lg"
                  title="Flip Camera Mode"
                >
                  <RefreshCw className="w-4.5 h-4.5" />
                </button>

              </div>

              {/* Mode indicator carousel (Stories selected by default) */}
              <div className="flex justify-center items-center gap-6 text-[9px] font-mono tracking-widest text-gray-400 uppercase leading-none">
                <span className="opacity-45">POST</span>
                <span className="opacity-45">REELS</span>
                <span className="text-amber-400 font-extrabold border-b-2 border-amber-400 pb-1 px-1 flex flex-col items-center">
                  STORY
                  <span className="w-1 h-1 bg-amber-400 rounded-full mt-0.5" />
                </span>
                <span className="opacity-45">LIVE</span>
              </div>

            </div>

          </div>
        )}

        {/* ======================================================== */}
        {/* STEP 2: STORY EDITOR VIEW (When background is loaded)     */}
        {/* ======================================================== */}
        {isStoryEditorActive && (
          <div 
            ref={canvasRef}
            onMouseMove={handleCanvasMove}
            onTouchMove={handleCanvasMove}
            onMouseUp={handleDragEnd}
            onTouchEnd={handleDragEnd}
            className="absolute inset-0 z-10 flex flex-col justify-between relative h-full w-full overflow-hidden"
          >
            
            {/* Backdrop image or video */}
            <div className="absolute inset-0 z-0 select-none">
              {storyMediaLoadStatus === 'error' ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950 p-4 text-center z-10 pointer-events-auto">
                  <span className="text-rose-500 font-bold text-xs mb-1">Failed to load story media</span>
                  <span className="text-[10px] text-gray-400 mb-4 max-w-[200px]">The story canvas could not sync this backdrop path.</span>
                  <button 
                    onClick={() => {
                      setStoryMediaLoadStatus('loading');
                      setStoryRetryCount(prev => prev + 1);
                    }}
                    className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-black text-[10px] font-black uppercase tracking-wider rounded-full transition-all cursor-pointer"
                  >
                    Retry Caching
                  </button>
                </div>
              ) : (
                <div className="w-full h-full relative pointer-events-none">
                  {storyBackgroundMedia && (
                    storyBackgroundMedia.endsWith('.mp4') || storyBackgroundMedia.includes('mixkit.co') || storyBackgroundMedia.includes('video') ? (
                      <>
                        {storyMediaLoadStatus === 'loading' && (
                          <img 
                            src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800"
                            className="absolute inset-0 w-full h-full object-cover z-10 opacity-70 filter blur-[2px]"
                            alt="Story Thumbnail"
                          />
                        )}
                        <video 
                          key={`${storyBackgroundMedia}-${storyRetryCount}`}
                          src={storyBackgroundMedia} 
                          onLoadStart={() => setStoryMediaLoadStatus('loading')}
                          onLoadedData={() => setStoryMediaLoadStatus('loaded')}
                          onCanPlay={() => setStoryMediaLoadStatus('loaded')}
                          onError={(e) => {
                            e.currentTarget.src = "https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4";
                          }}
                          className={`w-full h-full object-cover transition-all duration-300 ${storyMediaLoadStatus === 'loading' ? 'opacity-30 scale-95 blur-sm' : 'opacity-100 scale-100 blur-0'}`} 
                          autoPlay 
                          loop 
                          muted 
                          playsInline 
                          style={getFilterStyle()} 
                        />
                      </>
                    ) : (
                      <>
                        <img 
                          key={`${storyBackgroundMedia}-${storyRetryCount}`}
                          src={storyBackgroundMedia} 
                          onLoad={() => setStoryMediaLoadStatus('loaded')}
                          onError={(e) => {
                            e.currentTarget.src = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800";
                          }}
                          className={`w-full h-full object-cover transition-all duration-300 ${storyMediaLoadStatus === 'loading' ? 'opacity-30 scale-95 blur-sm' : 'opacity-100 scale-100 blur-0'}`} 
                          style={getFilterStyle()} 
                          alt="backdrop snapshot" 
                        />
                      </>
                    )
                  )}
                  {storyMediaLoadStatus === 'loading' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 z-20 gap-2">
                      <RefreshCw className="w-6 h-6 text-amber-400 animate-spin" />
                      <span className="text-[9px] font-mono text-gray-400 uppercase tracking-widest">Constructing Canvas...</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Tap-anywhere transparent surface to trigger Text Composer */}
            <div 
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  handleOpenTextEditor();
                }
              }}
              className="absolute inset-0 z-10 cursor-text"
            />

            {/* DRAGGABLE ELEMENT LAYER CONTAINER */}
            <div className="absolute inset-0 z-15 pointer-events-none mt-14 mb-16 overflow-hidden">
              {storyElements.map(el => {
                const isCurrentlyDragged = el.id === draggedElementId;
                const isEditingInline = el.id === activeEditingElementId;

                return (
                  <div
                    key={el.id}
                    className="absolute group pointer-events-auto"
                    style={{
                      left: `${el.x}%`,
                      top: `${el.y}%`,
                      transform: `translate(-50%, -50%) scale(${el.scale})`,
                      cursor: isCurrentlyDragged ? 'grabbing' : 'grab',
                      touchAction: 'none',
                      zIndex: isCurrentlyDragged ? 40 : 20
                    }}
                    onMouseDown={e => handleStartDrag(el.id, e)}
                    onTouchStart={e => handleStartDrag(el.id, e)}
                    onClick={e => {
                      e.stopPropagation();
                      if (el.type === 'text') {
                        handleOpenTextEditor(el.id);
                      } else {
                        setActiveEditingElementId(isEditingInline ? null : el.id);
                      }
                    }}
                  >
                    
                    {/* Render Types Contextually */}
                    {el.type === 'text' && (
                      <div 
                        className={`p-1.5 rounded-xl text-center select-none leading-tight font-bold max-w-[190px] truncate ${getOverlayFontClass(el.textStyle || 'modern')} ${
                          el.textBg === 'solid-dark' ? 'bg-black/75 px-2.5 py-1.5 border border-white/10' :
                          el.textBg === 'solid-light' ? 'bg-white text-black px-2.5 py-1.5 shadow' :
                          el.textBg === 'neon-pink' ? 'bg-pink-600 text-white px-2.5 py-1.5 shadow-lg shadow-pink-500/40' :
                          'bg-transparent'
                        }`}
                        style={{ color: el.textColor || '#ffffff' }}
                      >
                        {el.text}
                      </div>
                    )}

                    {el.type === 'mention' && (
                      <div className="bg-gradient-to-r from-amber-500 to-rose-500 text-white font-extrabold text-[8.5px] px-3 py-1.5 rounded-full border border-white/20 shadow-lg select-none tracking-tight flex items-center gap-1">
                        <span>@{el.mentionUser}</span>
                      </div>
                    )}

                    {el.type === 'poll' && (
                      <div className="bg-black/80 border border-white/10 rounded-2xl p-2.5 w-[140px] text-center shadow-2xl backdrop-blur-md flex flex-col gap-1">
                        {isEditingInline ? (
                          <div className="flex flex-col gap-1 text-left pointer-events-auto" onClick={e => e.stopPropagation()}>
                            <input
                              type="text"
                              value={el.pollQuestion}
                              onChange={e => updateElementProp(el.id, 'pollQuestion', e.target.value)}
                              className="bg-black/45 text-white text-[7.5px] font-bold text-center border-b border-white/20 outline-none p-0.5 rounded w-full"
                              placeholder="Poll Question?"
                              autoFocus
                            />
                            <div className="grid grid-cols-2 gap-1 mt-1 text-[6px]">
                              <input
                                type="text"
                                value={el.pollYes}
                                onChange={e => updateElementProp(el.id, 'pollYes', e.target.value)}
                                className="bg-pink-500 text-white text-center p-0.5 rounded outline-none font-bold"
                                placeholder="Yes"
                              />
                              <input
                                type="text"
                                value={el.pollNo}
                                onChange={e => updateElementProp(el.id, 'pollNo', e.target.value)}
                                className="bg-neutral-800 text-white text-center p-0.5 rounded outline-none font-bold"
                                placeholder="No"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => { setActiveEditingElementId(null); triggerHaptic('success'); }}
                              className="mt-1 py-0.5 bg-cyan-500/25 border border-cyan-400/30 text-cyan-300 text-[6px] rounded uppercase font-mono tracking-wider font-bold"
                            >
                              ✓ Save
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-1">
                            <span className="text-[8.5px] font-bold text-white leading-tight">{el.pollQuestion || 'Are you joining?'}</span>
                            <div className="grid grid-cols-2 gap-1 mt-1 text-[6.5px] font-bold font-mono">
                              <div className="py-1 px-0.5 bg-pink-500 text-white rounded uppercase text-center">{el.pollYes || 'Yes'}</div>
                              <div className="py-1 px-0.5 bg-white/10 border border-white/10 text-gray-200 rounded uppercase text-center">{el.pollNo || 'No'}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {el.type === 'question' && (
                      <div className={`p-2.5 rounded-2xl w-[135px] text-center shadow-xl flex flex-col gap-1 ${
                        el.questionTheme === 'pink' ? 'bg-gradient-to-tr from-pink-500 to-purple-650' :
                        el.questionTheme === 'emerald' ? 'bg-gradient-to-tr from-emerald-500 to-teal-600 text-black' :
                        'bg-gradient-to-tr from-blue-500 to-cyan-500'
                      }`}>
                        {isEditingInline ? (
                          <div className="flex flex-col gap-1 text-left pointer-events-auto" onClick={e => e.stopPropagation()}>
                            <input
                              type="text"
                              value={el.questionPrompt}
                              onChange={e => updateElementProp(el.id, 'questionPrompt', e.target.value)}
                              className="w-full bg-black/25 text-white placeholder:text-white/60 text-[7.5px] p-0.5 rounded border-b border-white/20 outline-none text-center"
                              placeholder="Prompt..."
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => { setActiveEditingElementId(null); triggerHaptic('success'); }}
                              className="mt-1 py-0.5 bg-white/20 text-white text-[6px] rounded uppercase font-mono font-bold text-center"
                            >
                              ✓ Save
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-1 text-white">
                            <div className="flex justify-center mb-0.5"><Smile className="w-2.5 h-2.5 text-white" /></div>
                            <h4 className="text-[7.5px] font-black uppercase tracking-wider">{el.questionPrompt || 'Ask me a question...'}</h4>
                            <div className="w-full bg-white/20 border border-white/10 rounded py-0.5 text-[6.5px] text-white/80 text-center select-none">Type answer...</div>
                          </div>
                        )}
                      </div>
                    )}

                    {el.type === 'link' && (
                      <div className="bg-cyan-500/25 border border-cyan-400/40 text-cyan-350 font-extrabold text-[8px] py-1 px-2.5 rounded-full flex items-center gap-1 shadow-lg shadow-cyan-500/20 max-w-[130px] truncate">
                        <Link className="w-2.5 h-2.5 shrink-0" />
                        <span className="truncate">{el.linkText || el.linkUrl || 'Visit Link'}</span>
                      </div>
                    )}

                    {el.type === 'music' && (
                      <div className="bg-purple-600/35 border border-purple-500/40 text-purple-200 font-extrabold text-[8px] py-1 px-2.5 rounded-full flex items-center gap-1 shadow-lg shadow-purple-500/20 max-w-[130px] truncate">
                        <Music className="w-2.5 h-2.5 text-purple-400 shrink-0 animate-pulse" />
                        <span className="truncate">{el.musicTitle || 'Lo-Fi Chill Wind'}</span>
                      </div>
                    )}

                    {el.type === 'sticker' && (
                      <div className="text-2xl filter drop-shadow hover:scale-110 duration-150 transition-transform">
                        {el.stickerEmoji}
                      </div>
                    )}

                    {/* Quick Delete tag on hover */}
                    {!isEditingInline && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setStoryElements(prev => prev.filter(item => item.id !== el.id));
                          triggerHaptic('warning');
                        }}
                        className="absolute -top-2.5 -right-2.5 w-4 h-4 bg-red-600 border border-white/20 rounded-full flex items-center justify-center text-[8px] text-white font-bold opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-md cursor-pointer pointer-events-auto"
                        title="Delete sticker"
                      >
                        ×
                      </button>
                    )}

                  </div>
                );
              })}
            </div>

            {/* INTERACTIVE PAINT CANVAS OVERLAY */}
            <canvas 
              ref={drawingCanvasRef}
              onMouseDown={startDrawing}
              onMouseMove={drawMove}
              onMouseUp={endDrawing}
              onMouseLeave={endDrawing}
              onTouchStart={startDrawing}
              onTouchMove={drawMove}
              onTouchEnd={endDrawing}
              className={`absolute inset-0 z-14 transition-opacity ${isDrawingMode ? 'opacity-100 pointer-events-auto cursor-crosshair' : 'opacity-100 pointer-events-none'}`}
            />

            {/* Trash zone elements: appears overlay only when dragging elements */}
            {isDraggingActive && (
              <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-red-600/90 text-white text-[8px] font-mono py-1 px-3 rounded-full flex items-center gap-1 shadow-lg border border-red-500/55 animate-bounce z-40">
                <Trash2 className="w-2.5 h-2.5" /> Drop to Delete
              </div>
            )}

            {/* STYLED NOTIFICATION TOAST pill */}
            <AnimatePresence>
              {filterToast && (
                <motion.div 
                  initial={{ opacity: 0, y: -20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute top-16 left-1/2 transform -translate-x-1/2 bg-black/60 backdrop-blur-md border border-white/10 px-4 py-1 rounded-full text-white text-[9px] font-medium z-40 pointer-events-none uppercase tracking-wider"
                >
                  {filterToast}
                </motion.div>
              )}
            </AnimatePresence>

            {/* DRAWING MODE TOOLBAR CONTROLS (Only visible in Drawing mode) */}
            {isDrawingMode && (
              <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-black/80 to-transparent p-3 flex flex-col gap-2.5 z-40 pointer-events-auto">
                <div className="flex justify-between items-center">
                  <button 
                    type="button"
                    onClick={clearDrawing}
                    className="py-1 px-3 rounded-full bg-red-600/30 border border-red-500/40 text-[8px] font-mono uppercase text-red-200 active:scale-95 transition-transform"
                  >
                    Clear Sketch
                  </button>
                  <span className="text-[9px] font-mono uppercase text-gray-300">Sketch Brush</span>
                  <button 
                    type="button"
                    onClick={() => {
                      setIsDrawingMode(false);
                      triggerHaptic('success');
                    }}
                    className="py-1 px-3 rounded-full bg-cyan-600 text-black font-mono font-bold text-[8px] uppercase tracking-wider active:scale-95 transition-transform"
                  >
                    Done
                  </button>
                </div>
                
                {/* Palette selection & weight sliders */}
                <div className="flex items-center justify-between gap-3 bg-black/30 p-2 rounded-xl border border-white/5">
                  <div className="flex gap-1.5 overflow-x-auto no-scrollbar flex-1 py-0.5 justify-center">
                    {['#f43f5e', '#ec4899', '#a855f7', '#3b82f6', '#06b6d4', '#10b981', '#eab308', '#ffffff', '#000000'].map(col => (
                      <button
                        key={col}
                        type="button"
                        onClick={() => {
                          setDrawingColor(col);
                          triggerHaptic('selection');
                        }}
                        className={`w-4 h-4 rounded-full border cursor-pointer shrink-0 transition-transform ${
                          drawingColor === col ? 'border-white scale-120 shadow-[0_0_8px_rgba(255,255,255,0.4)]' : 'border-white/10 hover:scale-110'
                        }`}
                        style={{ backgroundColor: col }}
                      />
                    ))}
                  </div>
                  
                  {/* Weight Dot controls */}
                  <div className="flex items-center gap-1.5 border-l border-white/10 pl-2 text-white shrink-0">
                    <span className="text-[6.5px] font-mono text-gray-400">Brush Size:</span>
                    <input 
                      type="range" 
                      min="2" 
                      max="20" 
                      value={drawingBrushSize}
                      onChange={e => setDrawingBrushSize(parseInt(e.target.value))}
                      className="w-12 h-1 accent-cyan-400 bg-white/10 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Standard Editor top left and toolbox triggers (Hidden if drawing) */}
            {!isDrawingMode && (
              <div className="absolute inset-x-0 top-0 z-20 w-full flex justify-between items-center p-3 mt-2 pointer-events-none">
                
                {/* Back button */}
                <button
                  type="button"
                  onClick={() => {
                    setIsStoryEditorActive(false);
                    setStoryBackgroundMedia(null);
                    setStoryElements([]);
                    triggerHaptic('warning');
                  }}
                  className="w-7 h-7 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white active:scale-90 transition-transform cursor-pointer pointer-events-auto"
                  title="Discard & go back"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>

                {/* Micro User indicator */}
                <div className="flex items-center gap-1 bg-black/40 backdrop-blur-md py-0.5 px-2 rounded-full border border-white/5 pointer-events-none">
                  <img src={currentUser?.profilePic} className="w-3.5 h-3.5 rounded-full border border-white/20" alt="me" />
                  <span className="text-[7px] text-white font-bold block">Your Story</span>
                </div>

                {/* Right side Stacked floating Toolbox column */}
                <div className="absolute top-14 right-3 z-30 flex flex-col gap-2.5 pointer-events-auto">
                  
                  {/* Aa - text trigger */}
                  <button
                    type="button"
                    onClick={() => handleOpenTextEditor()}
                    className="w-7 h-7 rounded-full bg-black/45 backdrop-blur-md border border-white/10 flex flex-col items-center justify-center text-white active:scale-90 hover:bg-black/60 transition-colors cursor-pointer"
                    title="Add Text"
                  >
                    <Type className="w-3.5 h-3.5" />
                    <span className="text-[5px] font-mono uppercase mt-0.5 font-bold">Text</span>
                  </button>

                  {/* Smile - sticker trigger */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsStickerOverlayOpen(true);
                      triggerHaptic('selection');
                    }}
                    className="w-7 h-7 rounded-full bg-black/45 backdrop-blur-md border border-white/10 flex flex-col items-center justify-center text-white active:scale-90 hover:bg-black/60 transition-colors cursor-pointer"
                    title="Add Sticker Widget"
                  >
                    <Smile className="w-3.5 h-3.5 text-yellow-400" />
                    <span className="text-[5px] font-mono uppercase mt-0.5 font-bold">Stickers</span>
                  </button>

                  {/* Music - audio tracks trigger */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsMusicOverlayOpen(true);
                      triggerHaptic('selection');
                    }}
                    className="w-7 h-7 rounded-full bg-black/45 backdrop-blur-md border border-white/10 flex flex-col items-center justify-center text-white active:scale-90 hover:bg-black/60 transition-colors cursor-pointer"
                    title="Add Music"
                  >
                    <Music className="w-3.5 h-3.5 text-pink-400" />
                    <span className="text-[5px] font-mono uppercase mt-0.5 font-bold">Music</span>
                  </button>

                  {/* Sparkles - toggles real-time CSS filter styles directly on media */}
                  <button
                    type="button"
                    onClick={toggleEffectFilter}
                    className="w-7 h-7 rounded-full bg-black/45 backdrop-blur-md border border-white/10 flex flex-col items-center justify-center text-white active:scale-90 hover:bg-black/60 transition-colors cursor-pointer animate-pulse"
                    title="Cycle Filters"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-[5px] font-mono uppercase mt-0.5 font-bold">Effects</span>
                  </button>

                  {/* Mention (@) tool button */}
                  <button
                    type="button"
                    onClick={() => handleOpenTextEditor(null, '@')}
                    className="w-7 h-7 rounded-full bg-black/45 backdrop-blur-md border border-white/10 flex flex-col items-center justify-center text-white active:scale-90 hover:bg-black/60 transition-colors cursor-pointer"
                    title="Mention connections"
                  >
                    <span className="text-[9.5px] font-black text-rose-400 leading-none">@</span>
                    <span className="text-[5px] font-mono uppercase mt-0.5 font-bold">Mention</span>
                  </button>

                  {/* PenTool - brush sketching */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsDrawingMode(true);
                      triggerHaptic('selection');
                    }}
                    className="w-7 h-7 rounded-full bg-black/45 backdrop-blur-md border border-white/10 flex flex-col items-center justify-center text-white active:scale-90 hover:bg-black/60 transition-colors cursor-pointer"
                    title="Sketch paint on image"
                  >
                    <PenTool className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[5px] font-mono uppercase mt-0.5 font-bold">Draw</span>
                  </button>

                  {/* More options menu */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsAdvancedMenuOpen(!isAdvancedMenuOpen);
                      triggerHaptic('light');
                    }}
                    className="w-7 h-7 rounded-full bg-black/45 backdrop-blur-md border border-white/10 flex flex-col items-center justify-center text-white active:scale-90 hover:bg-black/60 transition-colors cursor-pointer"
                    title="More Settings"
                  >
                    <MoreHorizontal className="w-3.5 h-3.5" />
                    <span className="text-[5px] font-mono uppercase mt-0.5 font-bold">More</span>
                  </button>

                </div>
              </div>
            )}

            {/* ADVANCED OPTIONAL DROP SHEET (downloads control, wipe canvas) */}
            <AnimatePresence>
              {isAdvancedMenuOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-14 right-11 bg-neutral-900/90 backdrop-blur-md border border-white/10 rounded-2xl p-2.5 z-40 w-36 pointer-events-auto flex flex-col gap-1.5 text-left text-white"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setAllowDownloads(!allowDownloads);
                      triggerHaptic('selection');
                    }}
                    className="flex justify-between items-center text-[8.5px] font-semibold py-1 px-1.5 hover:bg-white/5 rounded-lg w-full cursor-pointer"
                  >
                    <span>Allow Downloads</span>
                    <span className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[7px] ${allowDownloads ? 'bg-cyan-500 text-black font-extrabold' : 'bg-red-500/25 border border-red-500/40 text-red-300'}`}>
                      {allowDownloads ? '✓' : '×'}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStoryElements([]);
                      setIsAdvancedMenuOpen(false);
                      triggerHaptic('warning');
                    }}
                    className="flex justify-between items-center text-[8.5px] font-semibold text-red-400 py-1 px-1.5 hover:bg-red-950/10 rounded-lg w-full cursor-pointer"
                  >
                    <span>Reset Canvas</span>
                    <Trash2 className="w-3 h-3 text-red-500" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bottom Actions Tray (Caption field and green story dispatchers) */}
            <div className="relative z-20 w-full mt-auto bg-gradient-to-t from-black/85 via-black/35 to-transparent p-3 pt-6 flex flex-col gap-2.5 pointer-events-auto">
              
              {/* Optional short Inline Caption Input box */}
              {!isDrawingMode && (
                <div className="w-full flex items-center bg-black/40 backdrop-blur-md border border-white/10 rounded-full px-3 py-1 text-white gap-2 shadow-sm">
                  <span className="text-[7px] font-mono tracking-widest text-cyan-400 uppercase font-bold">Caption:</span>
                  <input
                    type="text"
                    value={storyCaption}
                    onChange={e => setStoryCaption(e.target.value)}
                    placeholder="Add a short overlay caption..."
                    className="flex-1 bg-transparent text-[8.5px] font-medium placeholder:text-gray-500 text-white outline-none border-none p-0 w-full"
                  />
                  {storyCaption && (
                    <button type="button" onClick={() => setStoryCaption('')} className="text-gray-400 hover:text-white">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}

              {/* Instagram footer publication controls */}
              {!isDrawingMode && (
                <div className="flex justify-between items-center gap-2 mt-0.5">
                  
                  {/* YOUR STORY BADGE DISPATCH */}
                  <button
                    type="button"
                    onClick={() => {
                      setCloseFriendsOnly(false);
                      setTimeout(handlePublishClick, 50);
                    }}
                    className="flex-1 bg-white/10 hover:bg-white/15 border border-white/10 py-1.5 px-2 rounded-full flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer shadow"
                  >
                    {/* User Pic framed by a gorgeous amber sunset gradient circle */}
                    <div className="w-5 h-5 rounded-full p-[1px] bg-gradient-to-tr from-yellow-500 via-rose-500 to-purple-600 flex items-center justify-center shrink-0">
                      <img src={currentUser?.profilePic} className="w-full h-full rounded-full object-cover border border-black/10" alt="avatar" />
                    </div>
                    <div className="flex flex-col text-left leading-none">
                      <span className="text-[7.5px] font-extrabold text-white leading-none">Your Story</span>
                      <span className="text-[5.5px] text-gray-300 font-mono">Public dispatch</span>
                    </div>
                  </button>

                  {/* CLOSE FRIENDS DISPATCH (Green Ring layout) */}
                  <button
                    type="button"
                    onClick={() => {
                      setCloseFriendsOnly(prev => !prev);
                      triggerHaptic('selection');
                    }}
                    className={`px-2 py-1.5 border rounded-full flex items-center gap-1.5 transition-colors active:scale-95 cursor-pointer ${
                      closeFriendsOnly 
                        ? 'bg-emerald-600/20 border-emerald-400 text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.15)]' 
                        : 'bg-white/5 border-white/10 text-gray-400'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${closeFriendsOnly ? 'bg-emerald-500 text-white' : 'bg-neutral-800 text-gray-500'}`}>
                      <Star className="w-3 h-3 fill-current" />
                    </div>
                    <div className="flex flex-col text-left leading-none">
                      <span className="text-[7.5px] font-extrabold text-white leading-none">Close Friends</span>
                      <span className="text-[5.5px] text-gray-300 font-mono">⭐ Selected view</span>
                    </div>
                  </button>

                  {/* SEND BUTTON (Circle right-arrow symbol) */}
                  <button
                    type="button"
                    onClick={handlePublishClick}
                    className="w-8 h-8 rounded-full bg-white text-black hover:bg-gray-100 flex items-center justify-center transition-all active:scale-90 shrink-0 cursor-pointer shadow-lg"
                    title="Send story directly"
                  >
                    <Send className="w-3.5 h-3.5 translate-x-[1px]" />
                  </button>

                </div>
              )}

            </div>

          </div>
        )}

        {/* ======================================================== */}
        {/* OVERLAY PANEL 1: STICKER PICKER MODAL SHEET (Slide-up)   */}
        {/* ======================================================== */}
        <AnimatePresence>
          {isStickerOverlayOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 z-40 backdrop-blur-xs flex flex-col justify-end pointer-events-auto"
            >
              {/* Click background to close */}
              <div className="absolute inset-0 z-0" onClick={() => setIsStickerOverlayOpen(false)} />
              
              <motion.div 
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 350 }}
                className="relative z-10 w-full max-h-[60%] bg-[#0f1021]/95 backdrop-blur-md border-t border-white/10 rounded-t-[28px] p-4 flex flex-col gap-3.5 overflow-y-auto no-scrollbar"
              >
                {/* Grab handle bar */}
                <div className="w-8 h-1 bg-white/20 rounded-full self-center shrink-0" />
                
                {/* Search sticker bar */}
                <div className="relative w-full shrink-0">
                  <input
                    type="text"
                    placeholder="Search stickers, widgets, GIFs..."
                    value={gifSearchQuery}
                    onChange={e => setGifSearchQuery(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-[8.5px] text-white placeholder:text-gray-400 outline-none focus:border-cyan-500/40"
                  />
                  {gifSearchQuery && (
                    <button type="button" onClick={() => setGifSearchQuery('')} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Primary Interactive Widgets list */}
                <div>
                  <span className="text-[7.5px] font-mono uppercase tracking-wider text-cyan-400 block mb-2">Social Widgets</span>
                  <div className="grid grid-cols-2 gap-2">
                    
                    <button
                      type="button"
                      onClick={spawnPoll}
                      className="py-2 px-2.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-left flex items-center gap-2 cursor-pointer text-white active:scale-95 transition-transform"
                    >
                      <span className="p-1 bg-pink-500/10 text-pink-400 rounded-lg text-xs">🗳️</span>
                      <div className="flex flex-col leading-none">
                        <span className="text-[8.5px] font-bold leading-none">Interactive Poll</span>
                        <span className="text-[6px] text-gray-400 mt-0.5 font-mono">Yes/No vote</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={spawnQuestion}
                      className="py-2 px-2.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-left flex items-center gap-2 cursor-pointer text-white active:scale-95 transition-transform"
                    >
                      <span className="p-1 bg-purple-500/10 text-purple-400 rounded-lg text-xs">❓</span>
                      <div className="flex flex-col leading-none">
                        <span className="text-[8.5px] font-bold leading-none">Question Box</span>
                        <span className="text-[6px] text-gray-400 mt-0.5 font-mono">Ask anything</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={spawnLink}
                      className="py-2 px-2.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-left flex items-center gap-2 cursor-pointer text-white active:scale-95 transition-transform"
                    >
                      <span className="p-1 bg-cyan-500/10 text-cyan-400 rounded-lg text-xs">🔗</span>
                      <div className="flex flex-col leading-none">
                        <span className="text-[8.5px] font-bold leading-none">Link Sticker</span>
                        <span className="text-[6px] text-gray-400 mt-0.5 font-mono">Web URL link</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsStickerOverlayOpen(false);
                        setIsMusicOverlayOpen(true);
                        triggerHaptic('light');
                      }}
                      className="py-2 px-2.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-left flex items-center gap-2 cursor-pointer text-white active:scale-95 transition-transform"
                    >
                      <span className="p-1 bg-yellow-500/10 text-yellow-400 rounded-lg text-xs">🎵</span>
                      <div className="flex flex-col leading-none">
                        <span className="text-[8.5px] font-bold leading-none">Music Cassette</span>
                        <span className="text-[6px] text-gray-400 mt-0.5 font-mono">Select soundtrack</span>
                      </div>
                    </button>

                  </div>
                </div>

                {/* Animated stickers simulated grid */}
                <div className="mt-1">
                  <span className="text-[7.5px] font-mono uppercase tracking-wider text-pink-400 block mb-2">Simulated Giphy Stickers</span>
                  <div className="grid grid-cols-3 gap-1.5 text-center">
                    {mockGifs
                      .filter(g => g.name.toLowerCase().includes(gifSearchQuery.toLowerCase()))
                      .map(g => (
                        <button
                          key={g.name}
                          type="button"
                          onClick={() => {
                            const el: StoryElement = {
                              id: 'gif_' + Math.random().toString(36).substring(2, 9),
                              type: 'sticker',
                              x: 50,
                              y: 50,
                              scale: 1.2,
                              stickerEmoji: g.render // Renders as highly interactive stylized elements
                            };
                            setStoryElements(prev => [...prev, el]);
                            setIsStickerOverlayOpen(false);
                            triggerHaptic('success');
                          }}
                          className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg flex flex-col items-center gap-1 cursor-pointer active:scale-95 transition-transform"
                        >
                          <span className={`text-base block h-7 flex items-center justify-center ${g.class}`}>{g.render}</span>
                          <span className="text-[5.5px] font-mono text-gray-400 truncate w-full uppercase">{g.name}</span>
                        </button>
                      ))}
                  </div>
                </div>

                {/* Connections tags quick list */}
                <div className="mt-1">
                  <span className="text-[7.5px] font-mono uppercase tracking-wider text-purple-400 block mb-1.5">Quick Mentions</span>
                  <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                    {users.slice(0, 5).map(u => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => spawnMentionSticker(u.username)}
                        className="flex items-center gap-1 px-2.5 py-1 bg-white/5 hover:bg-white/10 rounded-full border border-white/5 active:scale-95 transition-all text-white shrink-0 cursor-pointer"
                      >
                        <img src={u.profilePic} className="w-3 h-3 rounded-full object-cover" alt="" />
                        <span className="text-[6.5px] font-bold font-mono">@{u.username}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Popular Emojis */}
                <div className="mt-1 pb-4">
                  <span className="text-[7.5px] font-mono uppercase tracking-wider text-amber-400 block mb-1.5 font-bold">Standard Emojis</span>
                  <div className="grid grid-cols-6 gap-2 text-center">
                    {['🔥', '✨', '❤️', '😂', '🙌', '🚀', '💯', '🎉', '🌟', '👀', '💡', '👾'].map(em => (
                      <button
                        key={em}
                        type="button"
                        onClick={() => spawnEmoji(em)}
                        className="p-2 bg-white/5 hover:bg-white/10 text-lg rounded-xl active:scale-90 transition-transform cursor-pointer"
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                </div>

              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ======================================================== */}
        {/* OVERLAY PANEL 2: MUSIC TRACKS DRAW PANEL (Slide-up)      */}
        {/* ======================================================== */}
        <AnimatePresence>
          {isMusicOverlayOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 z-40 backdrop-blur-xs flex flex-col justify-end pointer-events-auto"
            >
              <div className="absolute inset-0 z-0" onClick={() => setIsMusicOverlayOpen(false)} />
              
              <motion.div 
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 350 }}
                className="relative z-10 w-full max-h-[50%] bg-[#0f1021]/95 backdrop-blur-md border-t border-white/10 rounded-t-[28px] p-4 flex flex-col gap-3 overflow-y-auto no-scrollbar pb-6"
              >
                <div className="w-8 h-1 bg-white/20 rounded-full self-center shrink-0" />
                
                <div className="flex justify-between items-center pb-2 border-b border-white/5 shrink-0">
                  <span className="text-[9px] font-mono uppercase tracking-wider text-gray-300">Select Story Soundtrack</span>
                  <button 
                    type="button" 
                    onClick={() => setIsMusicOverlayOpen(false)}
                    className="text-[8.5px] text-cyan-400 font-bold hover:text-cyan-350"
                  >
                    Close
                  </button>
                </div>

                <div className="flex flex-col gap-2">
                  {mockSongs.map(song => (
                    <button
                      key={song.title}
                      type="button"
                      onClick={() => spawnMusicSticker(song.title)}
                      className="p-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 flex items-center justify-between text-white active:scale-[0.98] transition-transform text-left cursor-pointer w-full group"
                    >
                      <div className="flex items-center gap-2 w-[80%]">
                        <div className="w-7 h-7 rounded bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-xs group-hover:bg-pink-500/20 shrink-0">
                          🎵
                        </div>
                        <div className="flex flex-col truncate leading-tight">
                          <span className="text-[8.5px] font-bold text-white truncate leading-tight">{song.title}</span>
                          <span className="text-[6.5px] text-gray-400 mt-0.5 truncate leading-tight">{song.artist}</span>
                        </div>
                      </div>
                      <span className="text-[6px] font-mono text-gray-400">{song.duration}</span>
                    </button>
                  ))}
                </div>

              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ======================================================== */}
        {/* OVERLAY PANEL 3: CENTRED BLACK TEXT COMPOSER MODAL        */}
        {/* ======================================================== */}
        <AnimatePresence>
          {isTextEditorOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-sm z-50 flex flex-col justify-between p-4 pointer-events-auto"
            >
              {/* Header toolbars */}
              <div className="flex justify-between items-center pb-2 border-b border-white/5 shrink-0">
                
                {/* A-Highlight highlight background styles */}
                <button
                  type="button"
                  onClick={() => {
                    setTextEditorBg(prev => {
                      if (prev === 'transparent') return 'solid-dark';
                      if (prev === 'solid-dark') return 'solid-light';
                      if (prev === 'solid-light') return 'neon-pink';
                      return 'transparent';
                    });
                    triggerHaptic('selection');
                  }}
                  className={`py-1 px-3 border rounded-full text-[8px] font-mono uppercase font-bold cursor-pointer transition-all ${
                    textEditorBg === 'solid-dark' ? 'bg-black text-white border-white/35 shadow-[0_0_8px_rgba(255,255,255,0.1)]' :
                    textEditorBg === 'solid-light' ? 'bg-white text-black border-black/35 shadow-md' :
                    textEditorBg === 'neon-pink' ? 'bg-pink-500 text-white border-pink-400 shadow-[0_0_10px_rgba(236,72,153,0.3)]' :
                    'bg-transparent text-gray-400 border-white/15'
                  }`}
                >
                  A Highlight
                </button>

                <span className="text-[8px] font-mono uppercase text-gray-500">Text Mode</span>

                {/* Commit Done button */}
                <button
                  type="button"
                  onClick={handleSaveTextEditor}
                  className="text-[9.5px] font-mono uppercase font-black text-cyan-400 hover:text-cyan-300"
                >
                  Done
                </button>

              </div>

              {/* Central primary typing box */}
              <div className="flex-1 flex flex-col justify-center items-center relative py-4">
                
                <textarea
                  autoFocus
                  value={textEditorDraft}
                  onChange={e => setTextEditorDraft(e.target.value)}
                  placeholder="Type text, @mention, or #hashtag..."
                  className={`w-full max-w-[270px] bg-transparent text-center border-none outline-none resize-none text-xs font-bold placeholder:text-white/30 leading-normal focus:ring-0 ${getOverlayFontClass(textEditorStyle)} ${
                    textEditorBg === 'solid-dark' ? 'bg-black/80 text-white p-3.5 rounded-2xl border border-white/10 shadow-xl' :
                    textEditorBg === 'solid-light' ? 'bg-white text-black p-3.5 rounded-2xl border border-black/10 shadow-2xl' :
                    textEditorBg === 'neon-pink' ? 'bg-pink-600 text-white p-3.5 rounded-2xl shadow-2xl shadow-pink-500/40' :
                    'bg-transparent'
                  }`}
                  style={{ color: textEditorColor, minHeight: '90px' }}
                />

                {/* REAL-TIME AUTOCOMPLETE SUGGESTIONS: Direct-matching typing connections */}
                <div className="absolute bottom-2 inset-x-0 flex gap-1.5 justify-center overflow-x-auto py-1 px-1 no-scrollbar select-none z-40">
                  {(() => {
                    const mentionMatch = textEditorDraft.match(/@(\w*)$/);
                    if (mentionMatch) {
                      const query = mentionMatch[1].toLowerCase();
                      const filtered = users.filter(u => u.username.toLowerCase().includes(query)).slice(0, 3);
                      
                      return filtered.map(u => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => {
                            const updated = textEditorDraft.replace(/@\w*$/, `@${u.username} `);
                            setTextEditorDraft(updated);
                            triggerHaptic('success');
                          }}
                          className="flex items-center gap-1 bg-pink-600 border border-pink-500/30 text-white rounded-full px-2.5 py-1 text-[7.5px] font-bold shrink-0 hover:bg-pink-700 cursor-pointer animate-in zoom-in-95"
                        >
                          <img src={u.profilePic} className="w-3.5 h-3.5 rounded-full object-cover" alt="" />
                          <span>@{u.username}</span>
                        </button>
                      ));
                    }

                    const hashtagMatch = textEditorDraft.match(/#(\w*)$/);
                    if (hashtagMatch) {
                      const query = hashtagMatch[1].toLowerCase();
                      const tags = ['connectx', 'vibes', 'scenic', 'cyber', 'trending', 'developer', 'aesthetic'];
                      const filtered = tags.filter(t => t.includes(query)).slice(0, 3);

                      return filtered.map(t => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => {
                            const updated = textEditorDraft.replace(/#\w*$/, `#${t} `);
                            setTextEditorDraft(updated);
                            triggerHaptic('success');
                          }}
                          className="bg-indigo-600 border border-indigo-500/30 text-white rounded-full px-2.5 py-1 text-[7.5px] font-bold shrink-0 hover:bg-indigo-700 cursor-pointer animate-in zoom-in-95"
                        >
                          #{t}
                        </button>
                      ));
                    }

                    return null;
                  })()}
                </div>

              </div>

              {/* Bottom formatting panel (Font carousel and Color palette circles) */}
              <div className="flex flex-col gap-3.5 border-t border-white/5 pt-3.5 select-none shrink-0">
                
                {/* Font Carousel selections */}
                <div className="flex gap-1.5 justify-center overflow-x-auto py-0.5 no-scrollbar">
                  {(['classic', 'modern', 'neon', 'serif', 'strong'] as const).map(style => (
                    <button
                      key={style}
                      type="button"
                      onClick={() => { setTextEditorStyle(style); triggerHaptic('selection'); }}
                      className={`py-0.5 px-2.5 rounded-full text-[7px] uppercase font-mono tracking-wider font-bold border transition-all cursor-pointer shrink-0 ${
                        textEditorStyle === style 
                          ? 'bg-white text-black border-white shadow-md scale-105' 
                          : 'bg-white/5 text-gray-300 border-white/5 hover:bg-white/10'
                      }`}
                    >
                      {style}
                    </button>
                  ))}
                </div>

                {/* Palette selection circles */}
                <div className="flex gap-1.5 justify-center overflow-x-auto py-0.5 no-scrollbar">
                  {['#ffffff', '#f43f5e', '#ec4899', '#a855f7', '#3b82f6', '#06b6d4', '#10b981', '#eab308', '#f97316', '#000000'].map(col => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => { setTextEditorColor(col); triggerHaptic('selection'); }}
                      className={`w-4.5 h-4.5 rounded-full border cursor-pointer transform hover:scale-115 shrink-0 transition-all ${
                        textEditorColor === col ? 'border-white scale-125 shadow-lg' : 'border-white/10'
                      }`}
                      style={{ backgroundColor: col }}
                    />
                  ))}
                </div>

              </div>

            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
