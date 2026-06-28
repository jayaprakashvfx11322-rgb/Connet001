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
  Sliders, Scissors, Volume2, Mic, Settings, Search, Globe, Users, Heart,
  Calendar, Layers, EyeOff, Sun
} from 'lucide-react';
import { MOCK_IMAGES } from '../utils/mockData';

interface User {
  id: string;
  username: string;
  displayName: string;
  profilePic: string;
}

interface PostWorkspaceProps {
  users: User[];
  currentUser: any;
  addPost: (
    caption: string,
    mediaUrls: string[],
    type: 'text' | 'image' | 'poll',
    pollOptions?: any,
    allowDownloads?: boolean,
    scheduledTime?: string,
    location?: string
  ) => void;
  triggerSuccessParty: (msg: string) => void;
  triggerHaptic: (style: 'light' | 'medium' | 'heavy' | 'selection' | 'success') => void;
  onClose: () => void;
  initialMedia?: string[];
}

interface FloatingElement {
  id: string;
  type: 'text' | 'sticker' | 'mention' | 'location' | 'music';
  content: string;
  x: number; // percentage from center
  y: number; // percentage from center
  scale: number;
  color?: string;
  style?: 'classic' | 'modern' | 'neon' | 'serif' | 'strong';
  bg?: string;
}

const getFilterStyle = (filterId: string, intensity: number): React.CSSProperties => {
  const i = intensity / 100; // intensity is 0-100
  switch (filterId) {
    case 'liquid_blur':
      return { filter: `blur(${2.5 * i}px) contrast(${1 + 0.1 * i}) saturate(${1 + 0.25 * i}) brightness(${1 + 0.08 * i})` };
    case 'liquid_vivid':
      return { filter: `saturate(${1 + 0.7 * i}) contrast(${1 + 0.25 * i}) brightness(${1 + 0.05 * i}) hue-rotate(${4 * i}deg)` };
    case 'liquid_mono':
      return { filter: `grayscale(${i}) contrast(${1 + 0.4 * i}) brightness(${1 - 0.05 * i})` };
    case 'liquid_aqua':
      return { filter: `hue-rotate(${160 * i}deg) saturate(${1 + 0.5 * i}) contrast(${1 + 0.15 * i}) brightness(${1 + 0.05 * i})` };
    case 'liquid_amber':
      return { filter: `sepia(${0.55 * i}) saturate(${1 + 0.6 * i}) contrast(${1 + 0.2 * i}) brightness(${1 + 0.02 * i})` };
    default:
      return {};
  }
};

export default function PostWorkspace({
  users,
  currentUser,
  addPost,
  triggerSuccessParty,
  triggerHaptic,
  onClose,
  initialMedia
}: PostWorkspaceProps) {
  // Step tracker: 'picker' | 'editor' | 'publish'
  const [step, setStep] = useState<'picker' | 'editor' | 'publish'>(initialMedia && initialMedia.length > 0 ? 'editor' : 'picker');
  
  // Manual CSS filters states (Grayscale, Blur, Brightness)
  const [grayscaleOn, setGrayscaleOn] = useState(false);
  const [grayscaleIntensity, setGrayscaleIntensity] = useState(100);
  const [blurOn, setBlurOn] = useState(false);
  const [blurIntensity, setBlurIntensity] = useState(4); // default 4px
  const [brightnessOn, setBrightnessOn] = useState(false);
  const [brightnessIntensity, setBrightnessIntensity] = useState(130); // default 130%

  const getCombinedFilterStyle = (): React.CSSProperties => {
    const baseStyle = getFilterStyle(activeFilter, liquidIntensity);
    const baseFilter = baseStyle.filter || '';
    
    const parts = [baseFilter];
    if (grayscaleOn) {
      parts.push(`grayscale(${grayscaleIntensity}%)`);
    }
    if (blurOn) {
      parts.push(`blur(${blurIntensity}px)`);
    }
    if (brightnessOn) {
      parts.push(`brightness(${brightnessIntensity}%)`);
    }
    
    return {
      ...baseStyle,
      filter: parts.filter(Boolean).join(' ')
    };
  };
  
  // Gallery & Media states
  const [galleryImages, setGalleryImages] = useState<string[]>(Object.values(MOCK_IMAGES));
  const [selectedMedia, setSelectedMedia] = useState<string[]>(initialMedia && initialMedia.length > 0 ? initialMedia : []);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  
  // Camera active toggle
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('user');
  const [isCapturing, setIsCapturing] = useState(false);

  // Editing parameters
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '4:5' | '16:9'>('1:1');
  const [activeFilter, setActiveFilter] = useState<string>('normal');
  const [liquidIntensity, setLiquidIntensity] = useState<number>(100);
  const [activeEffect, setActiveEffect] = useState<string>('none');
  
  // Overlay systems
  const [elements, setElements] = useState<FloatingElement[]>([]);
  const [activeEditorElement, setActiveEditorElement] = useState<string | null>(null);
  
  // Sticker / Location / Mention modal states
  const [isTextModalOpen, setIsTextModalOpen] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [textStyle, setTextStyle] = useState<'classic' | 'modern' | 'neon' | 'serif' | 'strong'>('modern');
  const [textColor, setTextColor] = useState('#ffffff');
  const [textBg, setTextBg] = useState('rgba(0,0,0,0.4)');
  
  const [isStickerModalOpen, setIsStickerModalOpen] = useState(false);
  const [isMentionModalOpen, setIsMentionModalOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isMusicModalOpen, setIsMusicModalOpen] = useState(false);
  
  // Drawing Canvas system
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [brushColor, setBrushColor] = useState('#ff2d55');
  const [brushWidth, setBrushWidth] = useState(5);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  // Publish form states
  const [caption, setCaption] = useState('');
  const [locationName, setLocationName] = useState('');
  const [taggedUsers, setTaggedUsers] = useState<string[]>([]);
  const [audience, setAudience] = useState<'Everyone' | 'Close Friends' | 'Followers'>('Everyone');
  const [shareToStory, setShareToStory] = useState(true);
  const [crossPostFB, setCrossPostFB] = useState(false);
  const [allowDownloads, setAllowDownloads] = useState(true);
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduleTime, setScheduleTime] = useState('2026-06-29T10:00');

  // Media loading and permission verification states
  const [mediaStatus, setMediaStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [retryCount, setRetryCount] = useState(0);
  const [permissionStatus, setPermissionStatus] = useState<'requesting' | 'granted' | 'denied'>('requesting');

  // Real-time camera states & refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Auto reset loading state when active media changes
  useEffect(() => {
    if (selectedMedia[activeMediaIndex] || galleryImages[0]) {
      setMediaStatus('loading');
    }
  }, [selectedMedia, activeMediaIndex, retryCount]);

  // Handle webcam start / stop
  const startWebcam = async () => {
    try {
      setCameraError(null);
      setPermissionStatus('requesting');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: cameraFacing },
        audio: false
      });
      setWebcamStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setPermissionStatus('granted');
    } catch (err: any) {
      console.warn("Webcam access failed, loading high-fidelity simulator:", err);
      setCameraError(err?.message || "Webcam camera hardware not found or blocked.");
      setPermissionStatus('granted'); // Fallback gracefully
    }
  };

  const stopWebcam = () => {
    if (webcamStream) {
      webcamStream.getTracks().forEach(track => track.stop());
      setWebcamStream(null);
    }
  };

  useEffect(() => {
    if (isCameraActive && step === 'picker') {
      startWebcam();
    } else {
      stopWebcam();
    }
    return () => stopWebcam();
  }, [isCameraActive, cameraFacing, step]);

  // Pre-loaded stickers and filters
  const stickerEmojis = ['🔥', '✨', '👾', '🎉', '💖', '👀', '💯', '🌈', '🥑', '⚡️', '🌟', '🍒', '💀', '🍕', '🛸', '🎯'];
  
  const filtersList = [
    { id: 'normal', name: 'Normal', filterClass: '' },
    { id: 'liquid_blur', name: 'Liquid Glass (Blur)', filterClass: 'blur-[2.5px] contrast-[1.1] saturate-[1.25] brightness-[1.08]', isLiquid: true },
    { id: 'liquid_vivid', name: 'Liquid Glass (Vivid)', filterClass: 'saturate-[1.7] contrast-[1.25] brightness-[1.05] hue-rotate-[4deg]', isLiquid: true },
    { id: 'liquid_mono', name: 'Liquid Glass (Monochrome)', filterClass: 'grayscale contrast-[1.4] brightness-[0.95]', isLiquid: true },
    { id: 'liquid_aqua', name: 'Liquid Glass (Aqua)', filterClass: 'hue-rotate-[160deg] saturate-[1.5] contrast-[1.15] brightness-[1.05]', isLiquid: true },
    { id: 'liquid_amber', name: 'Liquid Glass (Amber)', filterClass: 'sepia-[0.55] saturate-[1.6] contrast-[1.2] brightness-[1.02]', isLiquid: true },
    { id: 'clarendon', name: 'Clarendon', filterClass: 'contrast-[1.2] saturate-[1.35] brightness-[1.05]' },
    { id: 'crema', name: 'Crema', filterClass: 'contrast-[0.9] saturate-[0.9] sepia-[0.15] hue-rotate-[-5deg]' },
    { id: 'juno', name: 'Juno', filterClass: 'contrast-[1.1] saturate-[1.3] brightness-[1.1] sepia-[0.05]' },
    { id: 'ludwig', name: 'Ludwig', filterClass: 'contrast-[1.05] brightness-[1.05] saturate-[1.15] sepia-[0.1]' },
    { id: 'valencia', name: 'Valencia', filterClass: 'contrast-[0.95] brightness-[1.08] saturate-[1.08] sepia-[0.15]' },
    { id: 'aden', name: 'Aden', filterClass: 'contrast-[0.9] brightness-[1.15] saturate-[0.85] sepia-[0.2]' },
    { id: 'slumber', name: 'Slumber', filterClass: 'contrast-[1.0] brightness-[1.05] saturate-[0.66] sepia-[0.3]' },
  ];

  const musicTracks = [
    { title: 'Bad Habit', artist: 'Steve Lacy', duration: '3:52' },
    { title: 'Cruel Summer', artist: 'Taylor Swift', duration: '2:58' },
    { title: 'Starboy', artist: 'The Weeknd', duration: '3:50' },
    { title: 'Pink + White', artist: 'Frank Ocean', duration: '3:04' },
    { title: 'Ghost Town', artist: 'Kanye West', duration: '4:31' },
  ];

  // Auto initialize selected images if empty
  useEffect(() => {
    if (selectedMedia.length === 0 && galleryImages.length > 0) {
      setSelectedMedia([galleryImages[0]]);
    }
  }, [galleryImages]);

  // Handle canvas drawing setup
  useEffect(() => {
    if (isDrawingMode && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, [isDrawingMode]);

  const handleSelectMedia = (url: string) => {
    triggerHaptic('selection');
    if (selectedMedia.includes(url)) {
      if (selectedMedia.length > 1) {
        setSelectedMedia(selectedMedia.filter(u => u !== url));
        setActiveMediaIndex(0);
      }
    } else {
      setSelectedMedia([...selectedMedia, url]);
      setActiveMediaIndex(selectedMedia.length);
    }
  };

  const handleTriggerShutter = () => {
    triggerHaptic('heavy');
    setIsCapturing(true);

    if (webcamStream && videoRef.current) {
      try {
        const video = videoRef.current;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 640;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          if (cameraFacing === 'user') {
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
          }
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const capturedDataUrl = canvas.toDataURL('image/jpeg');
          
          setGalleryImages([capturedDataUrl, ...galleryImages]);
          setSelectedMedia([capturedDataUrl]);
          setActiveMediaIndex(0);
          setIsCameraActive(false);
          setIsCapturing(false);
          setStep('editor');
          return;
        }
      } catch (err) {
        console.error("Failed to capture from active webcam stream, using fallback:", err);
      }
    }

    setTimeout(() => {
      // Simulate taking photo by selecting a gorgeous random nature/neon image from unsplash
      const randomImg = `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 500000000)}?w=800`;
      setGalleryImages([randomImg, ...galleryImages]);
      setSelectedMedia([randomImg]);
      setActiveMediaIndex(0);
      setIsCameraActive(false);
      setIsCapturing(false);
      setStep('editor');
    }, 450);
  };

  // Drawing Canvas Handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushWidth;
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    triggerHaptic('light');
  };

  const handleAddText = () => {
    if (!textInput.trim()) return;
    const newEl: FloatingElement = {
      id: `text_${Date.now()}`,
      type: 'text',
      content: textInput,
      x: 0,
      y: -10,
      scale: 1,
      color: textColor,
      style: textStyle,
      bg: textBg
    };
    setElements([...elements, newEl]);
    setTextInput('');
    setIsTextModalOpen(false);
    triggerHaptic('medium');
  };

  const handleAddSticker = (emoji: string) => {
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

  const handleAddMention = (username: string) => {
    const newEl: FloatingElement = {
      id: `mention_${Date.now()}`,
      type: 'mention',
      content: `@${username}`,
      x: 0,
      y: 10,
      scale: 1
    };
    setElements([...elements, newEl]);
    setIsMentionModalOpen(false);
    triggerHaptic('light');
  };

  const handleAddLocation = (loc: string) => {
    const newEl: FloatingElement = {
      id: `location_${Date.now()}`,
      type: 'location',
      content: loc,
      x: 0,
      y: 20,
      scale: 1
    };
    setElements([...elements, newEl]);
    setLocationName(loc); // also pre-fill form
    setIsLocationModalOpen(false);
    triggerHaptic('light');
  };

  const handleAddMusic = (track: string) => {
    const newEl: FloatingElement = {
      id: `music_${Date.now()}`,
      type: 'music',
      content: `🎵 ${track}`,
      x: 0,
      y: -25,
      scale: 1
    };
    setElements([...elements, newEl]);
    setIsMusicModalOpen(false);
    triggerHaptic('success');
  };

  const handleRemoveElement = (id: string) => {
    setElements(elements.filter(el => el.id !== id));
    triggerHaptic('light');
  };

  const handlePublish = () => {
    triggerHaptic('success');
    addPost(
      caption,
      selectedMedia,
      'image',
      undefined,
      allowDownloads,
      isScheduled ? scheduleTime : undefined,
      locationName || undefined
    );
    if (isScheduled) {
      triggerSuccessParty(`Your photo post has been scheduled for publication at ${scheduleTime.replace('T', ' ')}!`);
    } else {
      triggerSuccessParty("Your post has been successfully shared to feed!");
    }
    onClose();
  };

  const activeFilterObj = filtersList.find(f => f.id === activeFilter);
  const isLiquidActive = !!activeFilterObj?.isLiquid;

  return (
    <div className="fixed inset-0 bg-[#020205] text-white z-50 flex flex-col font-sans select-none overflow-hidden md:max-w-md md:mx-auto md:border-x md:border-white/10 md:shadow-2xl">
      
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
          {step === 'picker' ? 'Select Media' : step === 'editor' ? 'Edit Post' : 'Publish'}
        </span>
        <div className="flex items-center gap-1">
          {step === 'picker' && (
            <button
              onClick={() => {
                triggerHaptic('light');
                setStep('editor');
              }}
              disabled={selectedMedia.length === 0}
              className="text-xs font-bold text-sky-400 py-1.5 px-3 bg-sky-500/10 rounded-full hover:bg-sky-500/20 disabled:opacity-40"
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
              {isScheduled ? 'Schedule' : 'Share'}
            </button>
          )}
        </div>
      </div>

      <div className="flex-grow overflow-y-auto relative flex flex-col">
        <AnimatePresence mode="wait">
          
          {/* STEP 1: GALLERY & CAMERA PICKER */}
          {step === 'picker' && (
            <motion.div 
              key="picker"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="flex-grow flex flex-col h-full bg-[#030307]"
            >
              {/* Top half: Preview screen */}
              <div className="relative aspect-square bg-neutral-950 flex items-center justify-center overflow-hidden border-b border-white/5">
                {isCameraActive ? (
                  <div className="w-full h-full relative bg-black flex flex-col items-center justify-center">
                    {permissionStatus === 'requesting' ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#05050a] z-30">
                        <RefreshCw className="w-8 h-8 text-sky-400 animate-spin mb-3" />
                        <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-gray-400">Validating Media Hardware...</span>
                        <span className="text-[9px] text-gray-500 mt-1">Acquiring sandbox camera sensor permission</span>
                      </div>
                    ) : (
                      <>
                        {/* Immersive Viewfinder Live Background */}
                        <div className="absolute inset-0 z-0 bg-black flex items-center justify-center">
                          {webcamStream && !cameraError ? (
                            <video
                              ref={videoRef}
                              autoPlay
                              playsInline
                              muted
                              className={`w-full h-full object-cover ${cameraFacing === 'user' ? 'scale-x-[-1]' : ''}`}
                            />
                          ) : (
                            <>
                              <img 
                                src="https://images.unsplash.com/photo-1515621061946-eff1c2a352bd?w=800" 
                                className="w-full h-full object-cover brightness-75 scale-105 animate-pulse"
                                style={{ animationDuration: '6s' }}
                                alt="Viewfinder Stream" 
                              />
                              <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />
                            </>
                          )}
                        </div>

                        {/* Status indicators */}
                        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md border border-white/10 px-2 py-1 rounded-md z-20 flex items-center gap-1.5 select-none">
                          <span className={`w-1.5 h-1.5 rounded-full ${webcamStream && !cameraError ? 'bg-emerald-400 animate-pulse' : 'bg-cyan-400'}`} />
                          <span className="text-[8px] font-mono font-bold uppercase tracking-wider text-gray-300">
                            {webcamStream && !cameraError ? 'Live Camera Feed' : 'Simulator Mode'}
                          </span>
                        </div>

                        {/* Simulated lens frame */}
                        <div className="absolute inset-4 rounded-3xl border border-white/10 flex items-center justify-center z-10">
                          <Camera className="w-12 h-12 text-white/15" />
                        </div>
                        {isCapturing && (
                          <div className="absolute inset-0 bg-white/90 z-20 transition-all duration-100" />
                        )}
                        {/* Shutter panel */}
                        <div className="absolute bottom-6 inset-x-0 flex flex-col items-center gap-4 z-20">
                          <div className="flex items-center gap-8">
                            <button 
                              onClick={() => setCameraFacing(prev => prev === 'user' ? 'environment' : 'user')}
                              className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-300 backdrop-blur-md"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={handleTriggerShutter}
                              className="w-16 h-16 rounded-full border-4 border-white/40 p-1 bg-transparent hover:scale-105 active:scale-95 transition-all"
                            >
                              <div className="w-full h-full rounded-full bg-white" />
                            </button>
                            <button 
                              onClick={() => setIsCameraActive(false)}
                              className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-300 backdrop-blur-md"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <span className="text-[9px] font-mono tracking-wider text-gray-400 drop-shadow">TAP TO TRIGGER STREAM SNAPSHOT</span>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="w-full h-full relative flex items-center justify-center bg-neutral-950">
                      <img 
                        key={`${selectedMedia[activeMediaIndex] || galleryImages[0]}-${retryCount}`}
                        src={selectedMedia[activeMediaIndex] || galleryImages[0]} 
                        onError={(e) => {
                          e.currentTarget.src = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800";
                        }}
                        className="w-full h-full object-cover transition-all duration-300"
                        alt="Selected Frame"
                      />
                    </div>
                    
                    {/* Floating camera shortcut */}
                    <button
                      onClick={() => {
                        triggerHaptic('medium');
                        setIsCameraActive(true);
                      }}
                      className="absolute bottom-4 right-4 p-3 bg-black/85 border border-white/10 rounded-full text-white shadow-lg active:scale-90 transition-all z-20"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>

              {/* Grid / Multi-select bar */}
              <div className="px-4 py-2.5 bg-[#08080c] border-b border-white/5 flex justify-between items-center shrink-0">
                <span className="text-[10px] font-mono tracking-wide text-gray-400 uppercase">Gallery Folder</span>
                <div className="flex gap-2">
                  <span className="text-[10px] font-mono bg-white/5 py-1 px-2.5 rounded-md text-sky-400 font-bold border border-white/5">
                    {selectedMedia.length} Selected
                  </span>
                </div>
              </div>

              {/* Grid picker of mock photos */}
              <div className="flex-grow p-3 overflow-y-auto bg-[#030307]">
                <div className="grid grid-cols-3 gap-1.5 pb-8">
                  {galleryImages.map((imgUrl, index) => {
                    const isSel = selectedMedia.includes(imgUrl);
                    const selIdx = selectedMedia.indexOf(imgUrl) + 1;
                    return (
                      <div 
                        key={index}
                        onClick={() => handleSelectMedia(imgUrl)}
                        className="relative aspect-square rounded-lg overflow-hidden border border-white/5 bg-[#0a0a0f] cursor-pointer group active:scale-95 transition-all"
                      >
                        <img src={imgUrl} className="w-full h-full object-cover group-hover:scale-105 duration-300" alt="Mock" />
                        
                        {/* Selector Indicator */}
                        <div className="absolute top-1.5 right-1.5 flex items-center justify-center">
                          {isSel ? (
                            <div className="w-5 h-5 rounded-full bg-sky-500 text-black text-[10px] font-extrabold flex items-center justify-center border border-white/20">
                              {selIdx}
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-black/40 border border-white/30 flex items-center justify-center" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2: FULL SCREEN IMMERSIVE CANVAS EDITOR */}
          {step === 'editor' && (
            <motion.div 
              key="editor"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-grow flex flex-col relative h-full bg-black"
            >
              {/* The Immersive Media Canvas Frame */}
              <div className="flex-grow flex items-center justify-center relative bg-black p-4 select-none">
                <div 
                  className={`relative w-full overflow-hidden bg-neutral-950 border border-white/10 rounded-2xl shadow-2xl flex items-center justify-center transition-all duration-300 ${
                    aspectRatio === '1:1' ? 'aspect-square' : aspectRatio === '4:5' ? 'aspect-[4/5]' : 'aspect-video'
                  }`}
                >
                  {/* Underlay Drawing Canvas */}
                  {isDrawingMode && (
                    <canvas
                      ref={canvasRef}
                      width={800}
                      height={800}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                      className="absolute inset-0 w-full h-full z-10 cursor-crosshair touch-none"
                    />
                  )}

                   {/* Filter and image asset container */}
                   <div className="w-full h-full relative">
                     {mediaStatus === 'error' ? (
                       <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950 p-4 text-center z-20">
                         <span className="text-rose-500 font-bold text-xs mb-1">Failed to load media asset</span>
                         <span className="text-[10px] text-gray-400 mb-4 max-w-[220px]">The editor could not load the image path. Please try to synchronize again.</span>
                         <button 
                           onClick={() => {
                             setMediaStatus('loading');
                             setRetryCount(prev => prev + 1);
                           }}
                           className="px-4 py-2 bg-sky-400 hover:bg-sky-300 active:scale-95 text-black text-[10px] font-black uppercase tracking-wider rounded-full transition-all"
                         >
                           Retry Loading
                         </button>
                       </div>
                     ) : (
                       <div className="w-full h-full relative">
                         <img 
                           key={`${selectedMedia[activeMediaIndex] || galleryImages[0]}-${retryCount}-editor`}
                           src={selectedMedia[activeMediaIndex] || galleryImages[0]} 
                           onLoad={() => setMediaStatus('loaded')}
                           onError={(e) => {
                            e.currentTarget.src = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800";
                          }}
                           className={`w-full h-full object-cover select-none pointer-events-none transition-all duration-300 ${
                             filtersList.find(f => f.id === activeFilter)?.isLiquid ? '' : (filtersList.find(f => f.id === activeFilter)?.filterClass || '')
                           } ${mediaStatus === 'loading' ? 'opacity-30 blur-sm' : 'opacity-100 blur-0'}`}
                           style={getCombinedFilterStyle()}
                           alt="Canvas asset"
                         />
                         {mediaStatus === 'loading' && (
                           <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-10 gap-2">
                             <RefreshCw className="w-6 h-6 text-sky-400 animate-spin" />
                             <span className="text-[9px] font-mono text-gray-400 uppercase tracking-widest">Applying Workspace Canvas...</span>
                           </div>
                         )}
                       </div>
                     )}
                     
                     {/* Visual Effect Presets Overlays */}
                     {activeEffect === 'sparkles' && (
                       <div className="absolute inset-0 pointer-events-none bg-radial-gradient from-yellow-300/10 via-transparent to-transparent animate-pulse mix-blend-screen bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))]">
                         <div className="absolute top-1/4 left-1/3 text-yellow-300 text-xs animate-bounce">✨</div>
                         <div className="absolute bottom-1/3 right-1/4 text-yellow-300 text-sm animate-pulse">✨</div>
                         <div className="absolute top-1/2 right-1/3 text-yellow-300 text-xs animate-bounce delay-150">✨</div>
                       </div>
                     )}
                     {activeEffect === 'vintage' && (
                       <div className="absolute inset-0 pointer-events-none bg-amber-500/10 mix-blend-color-burn opacity-70 contrast-125 sepia">
                         <div className="absolute inset-0 bg-noise opacity-15" />
                       </div>
                     )}
                     {activeEffect === 'leak' && (
                       <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-rose-600/30 via-transparent to-orange-500/20 mix-blend-screen opacity-90 filter blur-xl animate-pulse" />
                     )}
                     {activeEffect === 'neon' && (
                       <div className="absolute inset-0 pointer-events-none bg-purple-500/5 mix-blend-screen border border-purple-500/30 shadow-[inset_0_0_50px_rgba(168,85,247,0.4)]" />
                     )}
                   </div>

                  {/* Drag-and-drop Elements Overlay */}
                  <div className="absolute inset-0 z-20 pointer-events-none">
                    {elements.map((el) => {
                      const isSelected = activeEditorElement === el.id;
                      return (
                        <motion.div
                          key={el.id}
                          drag
                          dragMomentum={false}
                          className="absolute pointer-events-auto cursor-grab active:cursor-grabbing"
                          style={{ left: '40%', top: '45%' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveEditorElement(isSelected ? null : el.id);
                          }}
                        >
                          <div className="relative group">
                            {/* Text Render */}
                            {el.type === 'text' && (
                              <span 
                                className={`px-3.5 py-2.5 rounded-xl font-bold tracking-tight inline-block shadow-lg ${
                                  el.style === 'neon' ? 'text-rose-400 bg-black/60 border border-rose-500/40 shadow-rose-500/20' :
                                  el.style === 'serif' ? 'font-serif text-amber-200' :
                                  el.style === 'strong' ? 'font-black uppercase tracking-wider text-black bg-white py-1.5 px-3' :
                                  'bg-black/40 text-white border border-white/10'
                                }`}
                                style={{ color: el.color }}
                              >
                                {el.content}
                              </span>
                            )}

                            {/* Sticker Render */}
                            {el.type === 'sticker' && (
                              <span className="text-4xl drop-shadow-xl select-none inline-block transform active:scale-110">
                                {el.content}
                              </span>
                            )}

                            {/* Mention Sticker Render */}
                            {el.type === 'mention' && (
                              <span className="px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-[10px] font-extrabold tracking-wider border border-white/20 shadow-md flex items-center gap-1">
                                <AtSign className="w-3 h-3 text-pink-200" />
                                {el.content.toUpperCase()}
                              </span>
                            )}

                            {/* Location Sticker Render */}
                            {el.type === 'location' && (
                              <span className="px-3 py-1.5 rounded-full bg-white text-black text-[10px] font-bold tracking-wider shadow-md flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-rose-500" />
                                {el.content}
                              </span>
                            )}

                            {/* Music Sticker Render */}
                            {el.type === 'music' && (
                              <span className="px-3.5 py-2 bg-black/85 border border-sky-400/30 text-sky-400 text-[10px] font-mono tracking-wider rounded-lg shadow-xl flex items-center gap-1.5">
                                <Music className="w-3 h-3 animate-pulse text-sky-400" />
                                {el.content}
                              </span>
                            )}

                            {/* Delete overlay */}
                            {isSelected && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveElement(el.id);
                                }}
                                className="absolute -top-3 -right-3 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px] font-black border border-white shadow-md z-30"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Carousel Page Navigation Dots */}
                  {selectedMedia.length > 1 && (
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1 z-20 bg-black/60 py-1 px-2.5 rounded-full border border-white/5">
                      {selectedMedia.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setActiveMediaIndex(idx)}
                          className={`w-1.5 h-1.5 rounded-full transition-all ${
                            idx === activeMediaIndex ? 'bg-sky-400 w-3' : 'bg-gray-500'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* FLOATING ACTION OVERLAY TOOLS (Instagram style vertical shelf) */}
              <div className="absolute right-4 top-4 flex flex-col gap-3.5 z-30 pointer-events-auto">
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
                  title="Stickers"
                >
                  <Smile className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => { triggerHaptic('light'); setIsMentionModalOpen(true); }}
                  className="w-9 h-9 rounded-full bg-black/75 border border-white/10 flex items-center justify-center text-white shadow-lg active:scale-95 transition-all"
                  title="Mention Someone"
                >
                  <AtSign className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => { triggerHaptic('light'); setIsLocationModalOpen(true); }}
                  className="w-9 h-9 rounded-full bg-black/75 border border-white/10 flex items-center justify-center text-white shadow-lg active:scale-95 transition-all"
                  title="Location"
                >
                  <MapPin className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => { triggerHaptic('light'); setIsMusicModalOpen(true); }}
                  className="w-9 h-9 rounded-full bg-black/75 border border-white/10 flex items-center justify-center text-white shadow-lg active:scale-95 transition-all"
                  title="Music"
                >
                  <Music className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => { triggerHaptic('light'); setIsDrawingMode(!isDrawingMode); }}
                  className={`w-9 h-9 rounded-full border shadow-lg active:scale-95 transition-all flex items-center justify-center ${
                    isDrawingMode ? 'bg-rose-500 border-rose-400 text-white' : 'bg-black/75 border-white/10 text-white'
                  }`}
                  title="Draw Tool"
                >
                  <PenTool className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => {
                    triggerHaptic('light');
                    // cycle aspect ratios
                    if (aspectRatio === '1:1') setAspectRatio('4:5');
                    else if (aspectRatio === '4:5') setAspectRatio('16:9');
                    else setAspectRatio('1:1');
                  }}
                  className="w-9 h-9 rounded-full bg-black/75 border border-white/10 flex items-center justify-center text-white shadow-lg active:scale-95 transition-all"
                  title="Aspect Ratio"
                >
                  <Crop className="w-4 h-4" />
                </button>
              </div>

              {/* Drawing Toolbar Overlay (if active) */}
              {isDrawingMode && (
                <div className="absolute top-16 inset-x-4 bg-black/85 border border-white/10 rounded-2xl p-2.5 flex items-center justify-between z-40 animate-in slide-in-from-top-3">
                  <div className="flex gap-2">
                    {['#ff2d55', '#ff9500', '#4cd964', '#5ac8fa', '#5856d6', '#ffffff'].map(c => (
                      <button
                        key={c}
                        onClick={() => setBrushColor(c)}
                        className={`w-5 h-5 rounded-full border border-white/30 transform active:scale-115 transition-all ${
                          brushColor === c ? 'ring-2 ring-white scale-110' : ''
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={clearDrawing}
                      className="text-[9px] font-mono uppercase bg-white/5 border border-white/10 hover:bg-white/10 py-1 px-2.5 rounded-md"
                    >
                      Clear
                    </button>
                    <button
                      onClick={() => setIsDrawingMode(false)}
                      className="bg-green-500 text-black text-[9px] font-bold uppercase py-1 px-2.5 rounded-md"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}

              {/* LIQUID GLASS FILTER PREVIEW TRAY */}
              <div className="px-4 py-2.5 bg-[#030305]/85 border-t border-white/5 flex flex-col gap-2 shrink-0 select-none backdrop-blur-md">
                <div className="flex justify-between items-center px-1">
                  <span className="text-[10px] font-mono text-cyan-400 font-extrabold uppercase tracking-widest flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                    Interactive Filter Enhancer
                  </span>
                  <span className="text-[8px] font-mono text-gray-500 uppercase">
                    Toggle to apply precise CSS filters
                  </span>
                </div>

                {/* Filter toggle carousel */}
                <div className="flex gap-3 overflow-x-auto py-1.5 scrollbar-none">
                  {/* Filter A: Grayscale */}
                  <div className={`p-2.5 rounded-2xl border transition-all duration-300 flex flex-col gap-2 min-w-[140px] shrink-0 ${
                    grayscaleOn 
                      ? 'bg-cyan-500/5 border-cyan-400/40 shadow-[0_0_12px_rgba(34,211,238,0.15)]' 
                      : 'bg-white/[0.02] border-white/5 hover:border-white/10'
                  }`}>
                    <div className="flex justify-between items-center gap-2">
                      <div className="flex items-center gap-1.5">
                        <Layers className={`w-3.5 h-3.5 ${grayscaleOn ? 'text-cyan-400 animate-pulse' : 'text-gray-400'}`} />
                        <span className="text-[10px] font-bold text-gray-200">Grayscale</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic('selection');
                          setGrayscaleOn(!grayscaleOn);
                        }}
                        className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          grayscaleOn ? 'bg-cyan-500' : 'bg-white/10'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            grayscaleOn ? 'translate-x-3' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                    {grayscaleOn && (
                      <div className="flex flex-col gap-1 mt-0.5 animate-in fade-in duration-200">
                        <div className="flex justify-between text-[7.5px] font-mono text-cyan-400/80">
                          <span>Intensity</span>
                          <span>{grayscaleIntensity}%</span>
                        </div>
                        <input 
                          type="range"
                          min="0"
                          max="100"
                          value={grayscaleIntensity}
                          onChange={(e) => setGrayscaleIntensity(Number(e.target.value))}
                          className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                        />
                      </div>
                    )}
                  </div>

                  {/* Filter B: Blur */}
                  <div className={`p-2.5 rounded-2xl border transition-all duration-300 flex flex-col gap-2 min-w-[140px] shrink-0 ${
                    blurOn 
                      ? 'bg-pink-500/5 border-pink-400/40 shadow-[0_0_12px_rgba(244,63,94,0.15)]' 
                      : 'bg-white/[0.02] border-white/5 hover:border-white/10'
                  }`}>
                    <div className="flex justify-between items-center gap-2">
                      <div className="flex items-center gap-1.5">
                        <EyeOff className={`w-3.5 h-3.5 ${blurOn ? 'text-pink-400 animate-pulse' : 'text-gray-400'}`} />
                        <span className="text-[10px] font-bold text-gray-200">Blur</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic('selection');
                          setBlurOn(!blurOn);
                        }}
                        className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          blurOn ? 'bg-pink-500' : 'bg-white/10'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            blurOn ? 'translate-x-3' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                    {blurOn && (
                      <div className="flex flex-col gap-1 mt-0.5 animate-in fade-in duration-200">
                        <div className="flex justify-between text-[7.5px] font-mono text-pink-400/80">
                          <span>Radius</span>
                          <span>{blurIntensity}px</span>
                        </div>
                        <input 
                          type="range"
                          min="0"
                          max="15"
                          step="0.5"
                          value={blurIntensity}
                          onChange={(e) => setBlurIntensity(Number(e.target.value))}
                          className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-pink-400"
                        />
                      </div>
                    )}
                  </div>

                  {/* Filter C: Brightness */}
                  <div className={`p-2.5 rounded-2xl border transition-all duration-300 flex flex-col gap-2 min-w-[140px] shrink-0 ${
                    brightnessOn 
                      ? 'bg-amber-500/5 border-amber-400/40 shadow-[0_0_12px_rgba(245,158,11,0.15)]' 
                      : 'bg-white/[0.02] border-white/5 hover:border-white/10'
                  }`}>
                    <div className="flex justify-between items-center gap-2">
                      <div className="flex items-center gap-1.5">
                        <Sun className={`w-3.5 h-3.5 ${brightnessOn ? 'text-amber-400 animate-pulse' : 'text-gray-400'}`} />
                        <span className="text-[10px] font-bold text-gray-200">Brightness</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic('selection');
                          setBrightnessOn(!brightnessOn);
                        }}
                        className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          brightnessOn ? 'bg-amber-500' : 'bg-white/10'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            brightnessOn ? 'translate-x-3' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                    {brightnessOn && (
                      <div className="flex flex-col gap-1 mt-0.5 animate-in fade-in duration-200">
                        <div className="flex justify-between text-[7.5px] font-mono text-amber-400/80">
                          <span>Exposure</span>
                          <span>{brightnessIntensity}%</span>
                        </div>
                        <input 
                          type="range"
                          min="50"
                          max="200"
                          value={brightnessIntensity}
                          onChange={(e) => setBrightnessIntensity(Number(e.target.value))}
                          className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-amber-400"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* SELECTED PHOTOS REAL-TIME PREVIEW GALLERY */}
              <div className="px-4 py-2 bg-[#050508] border-t border-white/5 flex flex-col gap-1.5 shrink-0 select-none">
                <div className="flex justify-between items-center px-1">
                  <span className="text-[9px] font-mono text-cyan-400 font-extrabold uppercase tracking-widest flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    Liquid Glass Real-Time Monitor ({selectedMedia.length > 0 ? selectedMedia.length : 1} Photos)
                  </span>
                  <span className="text-[7.5px] font-mono text-gray-500 uppercase">
                    Tap to switch active canvas
                  </span>
                </div>
                
                <div className="flex gap-3 overflow-x-auto py-1 scrollbar-none">
                  {(selectedMedia.length > 0 ? selectedMedia : [galleryImages[0]]).map((imgUrl, idx) => {
                    const isActive = idx === activeMediaIndex;
                    const activeFilterObj = filtersList.find(f => f.id === activeFilter);
                    const isLiquidActive = activeFilterObj?.isLiquid;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          triggerHaptic('light');
                          setActiveMediaIndex(idx);
                        }}
                        className="flex flex-col items-center gap-1 shrink-0 focus:outline-none group relative"
                      >
                        <div className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all relative ${
                          isActive 
                            ? 'border-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.4)] scale-105' 
                            : 'border-white/10 hover:border-white/20'
                        }`}>
                          {/* Apply the current filter to the thumbnail preview in real-time */}
                          <img 
                            src={imgUrl} 
                            className={`w-full h-full object-cover transition-all duration-300 ${
                              isLiquidActive ? '' : (activeFilterObj?.filterClass || '')
                            }`}
                            style={getCombinedFilterStyle()}
                            alt={`Preview ${idx + 1}`}
                          />
                          
                          {/* Small badge overlay showing index */}
                          <div className="absolute top-0.5 left-0.5 bg-black/75 text-[7px] font-mono font-bold text-gray-300 w-3.5 h-3.5 rounded-full flex items-center justify-center border border-white/10">
                            {idx + 1}
                          </div>

                          {/* Overlay highlighting active Liquid Glass filter state */}
                          {isLiquidActive && (
                            <div className="absolute bottom-0.5 inset-x-0.5 bg-cyan-950/85 border border-cyan-400/20 py-0.2 rounded text-[5px] font-black text-cyan-400 uppercase tracking-widest text-center">
                              {activeFilter.replace('liquid_', '')}
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* EDITOR FOOTER: FILTER PICKER & EFFECTS */}
              <div className="bg-[#08080d] border-t border-white/5 py-3.5 px-4 flex flex-col gap-3 shrink-0">
                {/* Horizontal Filter Picker Carousel */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest px-1">Instagram Filter Suite</span>
                  <div className="flex gap-3.5 overflow-x-auto py-1 scrollbar-none select-none">
                    {filtersList.map(filt => {
                      const isLg = (filt as any).isLiquid;
                      return (
                        <button
                          key={filt.id}
                          onClick={() => {
                            triggerHaptic('selection');
                            setActiveFilter(filt.id);
                          }}
                          className="flex flex-col items-center gap-1.5 shrink-0 focus:outline-none group relative"
                        >
                          <div className={`w-11 h-11 rounded-lg overflow-hidden border-2 transition-all relative ${
                            activeFilter === filt.id 
                              ? (isLg ? 'border-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.5)] scale-105' : 'border-sky-400 scale-105') 
                              : (isLg ? 'border-cyan-500/35 bg-cyan-950/20' : 'border-white/5')
                          }`}>
                            <img 
                              src={selectedMedia[activeMediaIndex]} 
                              className={`w-full h-full object-cover ${isLg ? '' : filt.filterClass}`}
                              style={isLg ? (activeFilter === filt.id ? getFilterStyle(filt.id, liquidIntensity) : getFilterStyle(filt.id, 100)) : {}}
                              alt={filt.name}
                            />
                            {isLg && (
                              <div className="absolute top-0.5 right-0.5 bg-cyan-400 text-black text-[5px] px-0.5 py-[1px] rounded font-black uppercase tracking-wider scale-90">
                                Glass
                              </div>
                            )}
                          </div>
                          <span className={`text-[9px] font-bold ${
                            activeFilter === filt.id 
                              ? (isLg ? 'text-cyan-400 font-black' : 'text-sky-400 font-black') 
                              : (isLg ? 'text-cyan-500/80' : 'text-gray-400')
                          }`}>
                            {filt.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Liquid Glass Intensity Slider */}
                {isLiquidActive && (
                  <div className="px-3 py-2.5 bg-cyan-950/25 border border-cyan-500/25 rounded-xl flex flex-col gap-1.5 animate-fadeIn">
                    <div className="flex justify-between items-center px-1">
                      <span className="text-[10px] font-mono text-cyan-400 font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                        Liquid Glass Intensity Control
                      </span>
                      <span className="text-[10px] font-mono text-cyan-400 font-bold">
                        {liquidIntensity}%
                      </span>
                    </div>
                    <div className="flex items-center gap-3 px-1">
                      <span className="text-[9px] font-mono text-gray-500 uppercase">Min</span>
                      <input 
                        type="range"
                        min="0"
                        max="100"
                        value={liquidIntensity}
                        onChange={(e) => {
                          setLiquidIntensity(Number(e.target.value));
                        }}
                        className="flex-grow accent-cyan-400 h-1 bg-white/5 rounded-lg appearance-none cursor-pointer outline-none focus:ring-1 focus:ring-cyan-400"
                      />
                      <span className="text-[9px] font-mono text-cyan-500 uppercase">Max</span>
                    </div>
                  </div>
                )}

                {/* Effects Picker Suite */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest px-1">Creative FX Overlay</span>
                  <div className="flex gap-2.5">
                    {[
                      { id: 'none', label: 'None' },
                      { id: 'sparkles', label: '✨ Sparkle' },
                      { id: 'vintage', label: '📼 Grain' },
                      { id: 'leak', label: '🔥 Leak' },
                      { id: 'neon', label: '🌌 Glow' },
                    ].map(fx => (
                      <button
                        key={fx.id}
                        onClick={() => {
                          triggerHaptic('selection');
                          setActiveEffect(fx.id);
                        }}
                        className={`py-1 px-3.5 rounded-full text-[9px] font-bold border transition-all ${
                          activeEffect === fx.id 
                            ? 'bg-white text-black border-white' 
                            : 'bg-white/5 text-gray-300 border-white/5'
                        }`}
                      >
                        {fx.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 3: HIGH FIDELITY INSTAGRAM PUBLISH SCREEN */}
          {step === 'publish' && (
            <motion.div 
              key="publish"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-grow flex flex-col h-full bg-[#030307] p-4 gap-4 overflow-y-auto"
            >
              {/* Media Preview & Caption Section */}
              <div className="flex gap-3 bg-[#08080c] border border-white/5 rounded-2xl p-3.5 shadow-xl">
                {/* Media Thumbnail with filter applied */}
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-neutral-950 border border-white/10 shrink-0 relative">
                  <img 
                    src={selectedMedia[0]} 
                    className={`w-full h-full object-cover ${
                      filtersList.find(f => f.id === activeFilter)?.isLiquid ? '' : (filtersList.find(f => f.id === activeFilter)?.filterClass || '')
                    }`}
                    style={getCombinedFilterStyle()}
                    alt="Thumbnail"
                  />
                  {selectedMedia.length > 1 && (
                    <div className="absolute bottom-1 right-1 bg-black/60 px-1 py-0.5 rounded text-[7px] font-black">
                      +{selectedMedia.length - 1}
                    </div>
                  )}
                </div>

                {/* Caption Field */}
                <div className="flex-grow flex flex-col">
                  <textarea
                    placeholder="Write a caption, tell a story, add tags..."
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    className="w-full h-20 bg-transparent text-xs text-white placeholder-gray-500 border-0 focus:ring-0 resize-none outline-none font-sans"
                  />
                </div>
              </div>

              {/* Quick Hashtags */}
              <div className="flex flex-col gap-1 px-1">
                <span className="text-[8.5px] font-mono text-gray-500 uppercase tracking-wider">Trending Quick Tags</span>
                <div className="flex flex-wrap gap-1.5 mt-0.5">
                  {['#aesthetic', '#moodygrams', '#pixelart', '#photodump', '#creatives', '#neonvibe', '#nature'].map(tag => (
                    <button
                      key={tag}
                      onClick={() => {
                        triggerHaptic('light');
                        if (!caption.includes(tag)) {
                          setCaption(prev => prev.trim() + ' ' + tag);
                        }
                      }}
                      className="py-1 px-2.5 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 text-[9px] font-semibold text-sky-400"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tag Friends */}
              <div className="flex flex-col gap-2.5 bg-[#08080c] border border-white/5 rounded-2xl p-4 shadow-xl">
                <span className="text-[10px] font-mono tracking-wider text-gray-400 uppercase">Tag People</span>
                <div className="flex gap-2 overflow-x-auto py-0.5 scrollbar-none">
                  {users.map(u => {
                    const isTagged = taggedUsers.includes(u.id);
                    return (
                      <button
                        key={u.id}
                        onClick={() => {
                          triggerHaptic('selection');
                          if (isTagged) {
                            setTaggedUsers(taggedUsers.filter(id => id !== u.id));
                          } else {
                            setTaggedUsers([...taggedUsers, u.id]);
                            setCaption(prev => prev.trim() + ` @${u.username}`);
                          }
                        }}
                        className={`flex items-center gap-1.5 py-1 px-3 rounded-full text-[9px] font-bold border transition-all ${
                          isTagged 
                            ? 'bg-sky-500 text-black border-sky-400' 
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

              {/* Location Selector */}
              <div className="flex flex-col gap-2.5 bg-[#08080c] border border-white/5 rounded-2xl p-4 shadow-xl">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-mono tracking-wider text-gray-400 uppercase">Add Location</span>
                  {locationName && (
                    <span className="text-[10px] font-bold text-sky-400">{locationName}</span>
                  )}
                </div>
                <div className="flex gap-2 overflow-x-auto py-0.5 scrollbar-none">
                  {['Mumbai, IN', 'Studio HQ', 'Cyberpunk Hub', 'Co-working Deck', 'Cafe Vibe'].map(loc => (
                    <button
                      key={loc}
                      onClick={() => {
                        triggerHaptic('selection');
                        setLocationName(loc === locationName ? '' : loc);
                      }}
                      className={`py-1 px-3.5 rounded-full text-[9px] font-bold border transition-all ${
                        locationName === loc 
                          ? 'bg-white text-black border-white' 
                          : 'bg-white/5 text-gray-300 border-white/5 hover:bg-white/10'
                      }`}
                    >
                      {loc}
                    </button>
                  ))}
                </div>
              </div>

              {/* Advanced Controls & Settings toggles */}
              <div className="bg-[#08080c] border border-white/5 rounded-2xl p-4 flex flex-col gap-3.5 shadow-xl">
                {/* Audience Selector */}
                <div className="flex justify-between items-center pb-2 border-b border-white/5">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-bold">Audience</span>
                    <span className="text-[8px] text-gray-400">Control who can view this feed</span>
                  </div>
                  <div className="flex gap-1.5">
                    {['Everyone', 'Close Friends'].map((aud: any) => (
                      <button
                        key={aud}
                        onClick={() => { triggerHaptic('selection'); setAudience(aud); }}
                        className={`py-1 px-2.5 rounded-md text-[9px] font-mono font-black border transition-all ${
                          audience === aud 
                            ? 'bg-cyan-500/10 border-cyan-400 text-cyan-300' 
                            : 'bg-white/5 text-gray-400 border-transparent'
                        }`}
                      >
                        {aud.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Toggle Share to Story */}
                <div className="flex justify-between items-center">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-bold">Share to Stories</span>
                    <span className="text-[8px] text-gray-400">Instantly syndicate to 24H feed</span>
                  </div>
                  <button
                    onClick={() => { triggerHaptic('light'); setShareToStory(!shareToStory); }}
                    className={`w-9 h-5 rounded-full transition-all flex items-center p-0.5 cursor-pointer ${
                      shareToStory ? 'bg-sky-400 justify-end' : 'bg-gray-700 justify-start'
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full bg-black shadow-md" />
                  </button>
                </div>

                {/* Toggle Cross post FB */}
                <div className="flex justify-between items-center">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-bold">Share to Facebook</span>
                    <span className="text-[8px] text-gray-400">Auto-syndicate across platforms</span>
                  </div>
                  <button
                    onClick={() => { triggerHaptic('light'); setCrossPostFB(!crossPostFB); }}
                    className={`w-9 h-5 rounded-full transition-all flex items-center p-0.5 cursor-pointer ${
                      crossPostFB ? 'bg-sky-400 justify-end' : 'bg-gray-700 justify-start'
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full bg-black shadow-md" />
                  </button>
                </div>

                {/* Allow Downloads */}
                <div className="flex justify-between items-center">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-bold">Allow Downloads</span>
                    <span className="text-[8px] text-gray-400">Let other users save your stream</span>
                  </div>
                  <button
                    onClick={() => { triggerHaptic('light'); setAllowDownloads(!allowDownloads); }}
                    className={`w-9 h-5 rounded-full transition-all flex items-center p-0.5 cursor-pointer ${
                      allowDownloads ? 'bg-sky-400 justify-end' : 'bg-gray-700 justify-start'
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full bg-black shadow-md" />
                  </button>
                </div>

                {/* Schedule Post */}
                <div className="border-t border-white/5 pt-3.5 flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-purple-400" />
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold">Schedule Publication</span>
                        <span className="text-[8px] text-gray-400">Pick a future date and time</span>
                      </div>
                    </div>
                    <button
                      onClick={() => { triggerHaptic('light'); setIsScheduled(!isScheduled); }}
                      className={`w-9 h-5 rounded-full transition-all flex items-center p-0.5 cursor-pointer ${
                        isScheduled ? 'bg-purple-500 justify-end' : 'bg-gray-700 justify-start'
                      }`}
                    >
                      <div className="w-4 h-4 rounded-full bg-black shadow-md" />
                    </button>
                  </div>

                  {isScheduled && (
                    <div className="flex flex-col gap-2 p-3 bg-purple-950/20 rounded-xl border border-purple-500/20 animate-fadeIn">
                      <input
                        type="datetime-local"
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                        className="w-full bg-neutral-900 border border-white/10 text-white p-2 text-xs rounded-lg outline-none font-mono focus:border-purple-500 transition-colors"
                      />
                      <span className="text-[9px] text-purple-300 leading-normal">
                        Staged release queued for future broadcast. Node coordinates remain offline until activation time.
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Options: Save Draft */}
              <div className="flex gap-2.5 mt-2 pb-8">
                <button
                  onClick={() => {
                    triggerHaptic('success');
                    triggerSuccessParty("Post template backed up securely to offline Local Drafts");
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

      {/* TEXT CREATION MODAL OVERLAY */}
      <AnimatePresence>
        {isTextModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/90 z-50 flex flex-col p-4 justify-between"
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center">
              <button 
                onClick={() => setIsTextModalOpen(false)}
                className="text-xs text-gray-400"
              >
                Cancel
              </button>
              <div className="flex gap-1.5">
                {(['classic', 'modern', 'neon', 'serif', 'strong'] as const).map(st => (
                  <button
                    key={st}
                    onClick={() => setTextStyle(st)}
                    className={`py-0.5 px-2 rounded text-[8px] uppercase tracking-wider font-mono font-bold ${
                      textStyle === st ? 'bg-white text-black' : 'bg-white/10 text-white'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
              <button 
                onClick={handleAddText}
                className="text-xs font-bold text-sky-400"
              >
                Done
              </button>
            </div>

            {/* Input Element Panel */}
            <div className="flex-grow flex items-center justify-center p-4">
              <textarea
                autoFocus
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Type something..."
                className={`w-full max-w-sm bg-transparent border-0 text-center font-bold outline-none focus:ring-0 resize-none text-2xl ${
                  textStyle === 'neon' ? 'text-rose-400 font-bold shadow-neon' :
                  textStyle === 'serif' ? 'font-serif text-amber-200' :
                  textStyle === 'strong' ? 'font-black uppercase tracking-wider text-white' :
                  'text-white'
                }`}
                style={{ color: textColor }}
              />
            </div>

            {/* Color circles */}
            <div className="flex gap-2.5 justify-center py-4 border-t border-white/5 overflow-x-auto">
              {['#ffffff', '#ff2d55', '#ff9500', '#ffcc00', '#4cd964', '#5ac8fa', '#007aff', '#5856d6', '#000000'].map(col => (
                <button
                  key={col}
                  onClick={() => setTextColor(col)}
                  className={`w-5 h-5 rounded-full border border-white/30 cursor-pointer transform hover:scale-110 duration-150 shrink-0 ${
                    textColor === col ? 'ring-2 ring-white scale-110' : ''
                  }`}
                  style={{ backgroundColor: col }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* STICKERS SELECTION OVERLAY */}
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
              {stickerEmojis.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => handleAddSticker(emoji)}
                  className="text-4xl py-2 hover:bg-white/5 active:scale-90 transition-all rounded-xl"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MENTION FRIENDS OVERLAY */}
      <AnimatePresence>
        {isMentionModalOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="absolute inset-x-0 bottom-0 max-h-[75%] bg-[#08080d]/95 border-t border-white/15 rounded-t-[32px] z-50 p-5 flex flex-col gap-4 shadow-2xl"
          >
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400 font-mono">Mention Friend</span>
              <button onClick={() => setIsMentionModalOpen(false)} className="p-1 text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex flex-col gap-2 overflow-y-auto max-h-[320px]">
              {users.map(u => (
                <button
                  key={u.id}
                  onClick={() => handleAddMention(u.username)}
                  className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 active:scale-98 transition-all text-left"
                >
                  <img src={u.profilePic} className="w-8 h-8 rounded-full object-cover border border-white/10" alt="" />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold">@{u.username}</span>
                    <span className="text-[10px] text-gray-400">{u.displayName}</span>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LOCATION OVERLAY */}
      <AnimatePresence>
        {isLocationModalOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="absolute inset-x-0 bottom-0 max-h-[75%] bg-[#08080d]/95 border-t border-white/15 rounded-t-[32px] z-50 p-5 flex flex-col gap-4 shadow-2xl"
          >
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400 font-mono">Pin Location</span>
              <button onClick={() => setIsLocationModalOpen(false)} className="p-1 text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex flex-col gap-2 overflow-y-auto max-h-[320px]">
              {['Mumbai, IN', 'Studio HQ', 'Cyberpunk Hub', 'Co-working Deck', 'Bandra West', 'Gateway of India', 'Marina Beach', 'Lonavala Hills'].map(loc => (
                <button
                  key={loc}
                  onClick={() => handleAddLocation(loc)}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 text-left text-xs font-semibold"
                >
                  <MapPin className="w-4 h-4 text-rose-500" />
                  <span>{loc}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MUSIC SELECTION OVERLAY */}
      <AnimatePresence>
        {isMusicModalOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="absolute inset-x-0 bottom-0 max-h-[75%] bg-[#08080d]/95 border-t border-white/15 rounded-t-[32px] z-50 p-5 flex flex-col gap-4 shadow-2xl"
          >
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400 font-mono">Instagram Music Library</span>
              <button onClick={() => setIsMusicModalOpen(false)} className="p-1 text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex flex-col gap-2 overflow-y-auto max-h-[320px]">
              {musicTracks.map(track => (
                <button
                  key={track.title}
                  onClick={() => handleAddMusic(`${track.title} - ${track.artist}`)}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 text-left transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-sky-500/20 border border-sky-500/30 flex items-center justify-center">
                      <Music className="w-4 h-4 text-sky-400" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold">{track.title}</span>
                      <span className="text-[10px] text-gray-400">{track.artist}</span>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono text-gray-500">{track.duration}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
