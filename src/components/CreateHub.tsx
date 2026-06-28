/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { useConnectX } from '../utils/stateManager';
import { useHapticFeedback } from '../hooks/useHapticFeedback';
import { 
  PenTool, Image, Film, Video, History, HelpCircle, ArrowLeft, Plus, Trash2, 
  Smile, Music, Sparkles, Volume2, Calendar, FileText, Check, Crop, Sliders,
  Tag, MapPin, Play, Pause, RefreshCw, Type, Sticker, VolumeX, AlertTriangle, 
  Sparkle, ShieldAlert, BadgeInfo, CheckCircle2, ChevronRight, ChevronLeft,
  Camera, Upload, Download, Link, X, MoreHorizontal, Star, Cpu, Terminal, Shield, Settings
} from 'lucide-react';
import { MOCK_IMAGES } from '../utils/mockData';
import StoryWorkspace from './StoryWorkspace';
import PostWorkspace from './PostWorkspace';
import ReelWorkspace from './ReelWorkspace';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05
    }
  }
};

const itemVariants = {
  hidden: { 
    opacity: 0, 
    scale: 0.8,
    y: 20
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    y: 0,
    transition: { 
      type: "spring", 
      stiffness: 200, 
      damping: 18 
    }
  }
};

interface CreateHubProps {
  onClose?: () => void;
  initialWorkspace?: 'hub' | 'writeup' | 'post' | 'clips' | 'video' | 'stories';
}

export const CreateHub: React.FC<CreateHubProps> = ({ onClose, initialWorkspace = 'hub' }) => {
  const { 
    addPost, addStory, addReel, addVideo, currentUser, users 
  } = useConnectX();
  const triggerHaptic = useHapticFeedback();

  // Active view state: initialWorkspace or fall back to 'hub'
  const [activeWorkspace, setActiveWorkspace] = useState<'hub' | 'writeup' | 'post' | 'clips' | 'video' | 'stories'>(initialWorkspace);

  // ==========================================
  // 0. CAMERA & UPLOAD OPTIONS FLOW STATES
  // ==========================================
  const [creationFlowStep, setCreationFlowStep] = useState<'options' | 'capture' | 'editor'>(
    initialWorkspace === 'writeup' ? 'editor' : 'options'
  );
  const [videoFileUrl, setVideoFileUrl] = useState<string>('https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4');
  
  // Webcam & Capture States
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [activeArMask, setActiveArMask] = useState<string>('none');
  
  // Real-time Computer Vision Face Tracking States
  const [arFaceX, setArFaceX] = useState<number>(50); // Face horizontal position (0-100%)
  const [arFaceY, setArFaceY] = useState<number>(45); // Face vertical position (0-100%)
  const [arFaceWidth, setArFaceWidth] = useState<number>(42); // Face width (0-100%)
  const [arFaceHeight, setArFaceHeight] = useState<number>(42); // Face height (0-100%)
  const [arFaceTilt, setArFaceTilt] = useState<number>(0); // Head rotation roll angle (degrees)
  const [arTrackingConfidence, setArTrackingConfidence] = useState<number>(0); // CV confidence percentage
  const [arAmbientLight, setArAmbientLight] = useState<number>(120); // Computed luminance (0-255)
  
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Automatically sync/reset step when workspace switches
  const [allowDownloads, setAllowDownloads] = useState<boolean>(true);

  useEffect(() => {
    setAllowDownloads(true);
    if (activeWorkspace === 'writeup') {
      setCreationFlowStep('editor');
    } else if (activeWorkspace !== 'hub') {
      setCreationFlowStep('options');
    }

    // Clean up stale media state when switching pages
    if (activeWorkspace !== 'post') {
      setPostSelectedImages([MOCK_IMAGES.sunsetOcean]);
    }
    if (activeWorkspace !== 'clips') {
      setClipVideoUrl(clipPresetVideos[0].url);
    }
    if (activeWorkspace !== 'stories') {
      setStoryBackgroundMedia(null);
    }
    setVideoFileUrl('https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4');
    setVideoThumbnailUrl('');
    setVideoTitle('');
    setVideoDescription('');
    setVideoHashtags([]);
  }, [activeWorkspace]);

  // Handle webcam start / stop
  const startWebcam = async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: true
      });
      setWebcamStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.warn("Webcam access failed, loading high-fidelity simulator:", err);
      setCameraError(err?.message || "Webcam camera hardware not found or blocked.");
    }
  };

  const stopWebcam = () => {
    if (webcamStream) {
      webcamStream.getTracks().forEach(track => track.stop());
      setWebcamStream(null);
    }
    setIsRecording(false);
    setRecordSeconds(0);
  };

  useEffect(() => {
    if (creationFlowStep === 'capture') {
      startWebcam();
    } else {
      stopWebcam();
    }
    return () => stopWebcam();
  }, [creationFlowStep]);

  // Real-time Pixel-Level Computer Vision Face Tracking Engine
  useEffect(() => {
    let animationId: number;
    let cvCanvas: HTMLCanvasElement | null = null;
    let cvCtx: CanvasRenderingContext2D | null = null;

    const processCVFrame = () => {
      const video = videoRef.current;
      if (!video || activeArMask === 'none') {
        // Safe natural noise/float simulation when AR filter is off or camera is offline
        const time = Date.now() * 0.0015;
        setArFaceX(50 + Math.sin(time) * 1.5);
        setArFaceY(45 + Math.cos(time * 0.8) * 1.2);
        setArFaceWidth(44 + Math.sin(time * 0.4) * 1.0);
        setArFaceHeight(44 + Math.cos(time * 0.4) * 1.0);
        setArFaceTilt(Math.sin(time * 0.6) * 1.5);
        setArTrackingConfidence(webcamStream ? 88 : 0);
        setArAmbientLight(140 + Math.sin(time * 0.2) * 15);
        
        animationId = requestAnimationFrame(processCVFrame);
        return;
      }

      // Check if video is loaded and playing with valid dimensions
      if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
        if (!cvCanvas) {
          cvCanvas = document.createElement('canvas');
          // Downscale frame heavily (e.g. 80x60) for hyper-fast, lag-free pixel-level skin tracking
          cvCanvas.width = 80;
          cvCanvas.height = 60;
          cvCtx = cvCanvas.getContext('2d', { willReadFrequently: true });
        }

        if (cvCtx) {
          try {
            // Draw video frame flipped horizontally matching preview
            cvCtx.save();
            cvCtx.translate(cvCanvas.width, 0);
            cvCtx.scale(-1, 1);
            cvCtx.drawImage(video, 0, 0, cvCanvas.width, cvCanvas.height);
            cvCtx.restore();

            const imgData = cvCtx.getImageData(0, 0, cvCanvas.width, cvCanvas.height);
            const data = imgData.data;

            let totalSkinX = 0;
            let totalSkinY = 0;
            let skinPixelCount = 0;
            let minSkinX = cvCanvas.width;
            let maxSkinX = 0;
            let minSkinY = cvCanvas.height;
            let maxSkinY = 0;
            let totalBrightness = 0;

            // Analyze pixels frame-by-frame
            for (let i = 0; i < data.length; i += 4) {
              const r = data[i];
              const g = data[i+1];
              const b = data[i+2];

              // Luminance / Ambient Light calculation
              const brightness = (r + g + b) / 3;
              totalBrightness += brightness;

              // Normalized RGB Skin-Color classification algorithm
              const isSkin = r > 65 && g > 40 && b > 25 && 
                             r > g && r > b && 
                             (r - Math.min(g, b)) > 15 && 
                             Math.abs(r - g) > 12;

              if (isSkin) {
                const pixelIndex = i / 4;
                const x = pixelIndex % cvCanvas.width;
                const y = Math.floor(pixelIndex / cvCanvas.width);

                totalSkinX += x;
                totalSkinY += y;
                skinPixelCount++;

                if (x < minSkinX) minSkinX = x;
                if (x > maxSkinX) maxSkinX = x;
                if (y < minSkinY) minSkinY = y;
                if (y > maxSkinY) maxSkinY = y;
              }
            }

            const avgBrightness = totalBrightness / (cvCanvas.width * cvCanvas.height);
            setArAmbientLight(Math.round(avgBrightness));

            // Face detection confidence check (skin cluster size validation)
            const minSkinPixelsNeeded = 120; // threshold for a cluster
            if (skinPixelCount > minSkinPixelsNeeded) {
              // Smooth coordinates with low-pass filter to prevent high-frequency jittering
              const targetX = (totalSkinX / skinPixelCount) / cvCanvas.width * 100;
              const targetY = (totalSkinY / skinPixelCount) / cvCanvas.height * 100;
              
              // Calculate width & height proportions relative to stream size
              const targetWidth = ((maxSkinX - minSkinX) / cvCanvas.width) * 110;
              const targetHeight = ((maxSkinY - minSkinY) / cvCanvas.height) * 110;

              // Head Tilt calculation based on center-of-mass versus bounding box center symmetry
              const boxCenterX = (minSkinX + maxSkinX) / 2;
              const skewX = (totalSkinX / skinPixelCount) - boxCenterX;
              const targetTilt = skewX * 1.8; // map pixel skew to roll degrees

              setArFaceX(prev => prev + (targetX - prev) * 0.15);
              setArFaceY(prev => prev + (targetY - prev) * 0.15);
              setArFaceWidth(prev => {
                const clamped = Math.max(30, Math.min(65, targetWidth));
                return prev + (clamped - prev) * 0.12;
              });
              setArFaceHeight(prev => {
                const clamped = Math.max(30, Math.min(65, targetHeight));
                return prev + (clamped - prev) * 0.12;
              });
              setArFaceTilt(prev => prev + (targetTilt - prev) * 0.12);

              // Calculate confidence as density of classified skin tone pixels in detected cluster box
              const boxArea = Math.max(1, (maxSkinX - minSkinX) * (maxSkinY - minSkinY));
              const density = skinPixelCount / boxArea;
              const confidence = Math.min(99, Math.round(75 + density * 24));
              setArTrackingConfidence(confidence);
            } else {
              // Decaying tracking confidence when face is occluded or out of frame
              setArTrackingConfidence(prev => Math.max(0, prev - 4));
              // Float gently back to center
              setArFaceX(prev => prev + (50 - prev) * 0.05);
              setArFaceY(prev => prev + (45 - prev) * 0.05);
              setArFaceWidth(prev => prev + (42 - prev) * 0.05);
              setArFaceHeight(prev => prev + (42 - prev) * 0.05);
              setArFaceTilt(prev => prev * 0.95);
            }
          } catch (e) {
            console.error("AR Computer Vision processing error:", e);
          }
        }
      } else {
        // Camera source loading, run smooth placeholder orbit simulation
        const time = Date.now() * 0.0015;
        setArFaceX(50 + Math.sin(time) * 1.5);
        setArFaceY(45 + Math.cos(time * 0.8) * 1.2);
        setArFaceWidth(44 + Math.sin(time * 0.4) * 1.0);
        setArFaceHeight(44 + Math.cos(time * 0.4) * 1.0);
        setArFaceTilt(Math.sin(time * 0.6) * 1.5);
        setArTrackingConfidence(webcamStream ? 72 : 0);
        setArAmbientLight(140 + Math.sin(time * 0.2) * 15);
      }

      animationId = requestAnimationFrame(processCVFrame);
    };

    animationId = requestAnimationFrame(processCVFrame);
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [webcamStream, activeArMask]);

  // Record timer tick
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordSeconds(s => s + 1);
      }, 1000);
    } else {
      setRecordSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Redesigned Creation Flow collapsible panel states
  const [writeupPollOpen, setWriteupPollOpen] = useState(false);
  const [writeupScheduleOpen, setWriteupScheduleOpen] = useState(false);
  const [writeupHashtagsOpen, setWriteupHashtagsOpen] = useState(false);
  const [writeupAttachmentOpen, setWriteupAttachmentOpen] = useState(false);
  const [postTransformOpen, setPostTransformOpen] = useState(false);
  const [postFiltersOpen, setPostFiltersOpen] = useState(true);
  const [postAdvancedOpen, setPostAdvancedOpen] = useState(false);
  const [clipsAudioOpen, setClipsAudioOpen] = useState(false);
  const [clipsEffectsOpen, setClipsEffectsOpen] = useState(false);
  const [clipsStickersOpen, setClipsStickersOpen] = useState(false);
  const [clipsTextOpen, setClipsTextOpen] = useState(false);
  const [clipsAdvancedOpen, setClipsAdvancedOpen] = useState(false);
  const [videoAdvancedOpen, setVideoAdvancedOpen] = useState(false);
  const [storiesWidgetsOpen, setStoriesWidgetsOpen] = useState(false);
  const [storiesMentionsOpen, setStoriesMentionsOpen] = useState(false);
  const [storiesDesignOpen, setStoriesDesignOpen] = useState(false);

  // Success celebration overlay state
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const triggerSuccessParty = (msg: string) => {
    triggerHaptic('success');
    setSuccessMessage(msg);
    setTimeout(() => {
      setSuccessMessage(null);
      setActiveWorkspace(initialWorkspace);
      if (onClose) onClose();
    }, 3500);
  };

  // ==========================================
  // 1. ✍️ WRITEUP WORKSPACE STATE & FUNCTIONS
  // ==========================================
  const [writeupText, setWriteupText] = useState('');
  const [writeupHashtags, setWriteupHashtags] = useState<string[]>([]);
  const [hashInput, setHashInput] = useState('');
  const [mentionQuery, setMentionQuery] = useState('');
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [writeupPollEnabled, setWriteupPollEnabled] = useState(false);
  const [writeupPollQuestion, setWriteupPollQuestion] = useState('');
  const [writeupPollOptions, setWriteupPollOptions] = useState<string[]>(['Absolutely Yes', 'Not yet']);
  const [writeupAttachment, setWriteupAttachment] = useState<string | null>(null);
  const [writeupScheduled, setWriteupScheduled] = useState(false);
  const [writeupScheduleTime, setWriteupScheduleTime] = useState('2026-06-08T10:00');
  const [writeupLocation, setWriteupLocation] = useState('');
  const [filterByTrending, setFilterByTrending] = useState(false);
  const [hidePreciseLocation, setHidePreciseLocation] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locationCoords, setLocationCoords] = useState<{ latitude: number; longitude: number } | null>(null);

  // Draft Autosave & Restore references
  useEffect(() => {
    const savedDraft = localStorage.getItem('cx_writeup_draft');
    if (savedDraft && activeWorkspace === 'writeup' && !writeupText) {
      // Just check if we want to invite user to restore
    }
  }, [activeWorkspace]);

  const saveWriteupDraft = () => {
    localStorage.setItem('cx_writeup_draft', JSON.stringify({
      text: writeupText,
      hashtags: writeupHashtags,
      pollEnabled: writeupPollEnabled,
      pollQuestion: writeupPollQuestion,
      pollOptions: writeupPollOptions,
      attachment: writeupAttachment
    }));
    alert("Draft secured! Your writing progress remains locked inside local cache.");
  };

  const restoreWriteupDraft = () => {
    const saved = localStorage.getItem('cx_writeup_draft');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setWriteupText(parsed.text || '');
        setWriteupHashtags(parsed.hashtags || []);
        setWriteupPollEnabled(parsed.pollEnabled || false);
        setWriteupPollQuestion(parsed.pollQuestion || '');
        setWriteupPollOptions(parsed.pollOptions || ['Absolutely Yes', 'Not yet']);
        setWriteupAttachment(parsed.attachment || null);
        alert("Draft parameters restored successfully!");
      } catch (err) {
        console.error(err);
      }
    } else {
      alert("No temporary draft found inside this browser node.");
    }
  };

  const clearWriteupDraft = () => {
    localStorage.removeItem('cx_writeup_draft');
    setWriteupText('');
    setWriteupHashtags([]);
    setWriteupPollEnabled(false);
    setWriteupPollQuestion('');
    setWriteupPollOptions(['Absolutely Yes', 'Not yet']);
    setWriteupAttachment(null);
    setWriteupLocation('');
    setHidePreciseLocation(false);
    setLocationCoords(null);
  };

  const fetchGeolocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser model.");
      return;
    }
    triggerHaptic('medium');
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocationCoords({ latitude, longitude });
        const formatted = `${latitude.toFixed(4)}° ${latitude >= 0 ? 'N' : 'S'}, ${Math.abs(longitude).toFixed(4)}° ${longitude >= 0 ? 'E' : 'W'}`;
        setWriteupLocation(formatted);
        setIsLocating(false);
        triggerSuccessParty(`Position locked! Coordinates loaded.`);
      },
      (error) => {
        console.error(error);
        setIsLocating(false);
        alert(`Failed to retrieve geolocation: ${error.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleAddHashtag = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = hashInput.trim().replace(/^#/, '');
    if (clean && !writeupHashtags.includes(clean)) {
      setWriteupHashtags([...writeupHashtags, clean]);
    }
    setHashInput('');
  };

  const handleMentionSelect = (username: string) => {
    setWriteupText(prev => prev + ` @${username} `);
    setShowMentionDropdown(false);
    setMentionQuery('');
  };

  const handleAddPollOption = () => {
    if (writeupPollOptions.length < 4) {
      setWriteupPollOptions([...writeupPollOptions, '']);
    }
  };

  const handleUpdatePollOption = (idx: number, val: string) => {
    const next = [...writeupPollOptions];
    next[idx] = val;
    setWriteupPollOptions(next);
  };

  const handleDeletePollOption = (idx: number) => {
    if (writeupPollOptions.length > 2) {
      setWriteupPollOptions(writeupPollOptions.filter((_, i) => i !== idx));
    }
  };

  const applyTextFormat = (tagSymbol: string) => {
    setWriteupText(prev => prev + ` ${tagSymbol}formatted-text${tagSymbol} `);
  };

  const handlePublishWriteup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!writeupText.trim()) return;

    // Compile hashtags and text
    let finalContent = writeupText;
    if (writeupHashtags.length > 0) {
      finalContent += '\n\n' + writeupHashtags.map(h => `#${h}`).join(' ');
    }

    const attachmentsArray = writeupAttachment ? [writeupAttachment] : undefined;

    if (writeupScheduled) {
      alert(`Publication secure queue logged! Scheduled to launch node release automatically at ${writeupScheduleTime}.`);
      clearWriteupDraft();
      triggerSuccessParty("WriteUp Scheduled in Stream queue!");
      return;
    }

    if (writeupPollEnabled) {
      const filteredOptions = writeupPollOptions.map(o => o.trim()).filter(Boolean);
      if (!writeupPollQuestion.trim() || filteredOptions.length < 2) {
        alert("Please specify a poll question and at least 2 option outcomes.");
        return;
      }
      addPost(
        finalContent,
        attachmentsArray,
        'poll',
        {
          question: writeupPollQuestion.trim(),
          options: filteredOptions
        },
        undefined,
        undefined,
        writeupLocation || undefined,
        locationCoords || undefined,
        hidePreciseLocation
      );
    } else {
      addPost(
        finalContent,
        attachmentsArray,
        writeupAttachment ? 'image' : 'text',
        undefined,
        undefined,
        undefined,
        writeupLocation || undefined,
        locationCoords || undefined,
        hidePreciseLocation
      );
    }

    clearWriteupDraft();
    triggerSuccessParty("Facebook-style WriteUp compiled and index-synced successfully!");
  };

  // ==========================================
  // 2. 📸 POST WORKSPACE STATE & FUNCTIONS
  // ==========================================
  const postPresetImages = [
    MOCK_IMAGES.sunsetOcean,
    MOCK_IMAGES.neonCyber,
    MOCK_IMAGES.setup,
    MOCK_IMAGES.mountain,
    MOCK_IMAGES.festival,
    MOCK_IMAGES.techGadget
  ];
  const [postSelectedImages, setPostSelectedImages] = useState<string[]>([MOCK_IMAGES.sunsetOcean]);
  const [postActiveSlide, setPostActiveSlide] = useState(0);
  const [postCaption, setPostCaption] = useState('');
  
  // Crop & Transform state
  const [postFilter, setPostFilter] = useState<'normal' | 'clarendon' | 'lark' | 'juno' | 'moon' | 'valencia'>('normal');
  const [postZoom, setPostZoom] = useState(1.0);
  const [postRotation, setPostRotation] = useState(0);
  const [postAspectRatio, setPostAspectRatio] = useState<'1:1' | '4:5' | '16:9'>('1:1');

  // Coordinated Tagging State
  const [taggedPeople, setTaggedPeople] = useState<{ name: string; x: number; y: number }[]>([]);
  const [taggingMode, setTaggingMode] = useState(false);
  const [tagInputName, setTagInputName] = useState('');
  const [pendingTagCoords, setPendingTagCoords] = useState<{ x: number; y: number } | null>(null);
  const [postLocation, setPostLocation] = useState('Silicon Valley, California');

  const getFilterStyles = (f: string) => {
    switch (f) {
      case 'clarendon': return 'saturate-[1.4] contrast-[1.1] brightness-[1.05]';
      case 'lark': return 'hue-rotate-[-8deg] saturate-[1.1] brightness-[1.05]';
      case 'juno': return 'sepia-[0.15] saturate-[1.3] hue-rotate-[10deg] contrast-[1.05]';
      case 'moon': return 'grayscale-[1.0] contrast-[1.3] brightness-[0.95]';
      case 'valencia': return 'sepia-[0.35] saturate-[1.1] contrast-[0.9]';
      default: return '';
    }
  };

  const handlePostImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!taggingMode) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    setPendingTagCoords({ x, y });
  };

  const handleSaveTag = () => {
    if (pendingTagCoords && tagInputName.trim()) {
      setTaggedPeople([...taggedPeople, { name: tagInputName.trim(), ...pendingTagCoords }]);
      setTagInputName('');
      setPendingTagCoords(null);
    }
  };

  const handleRemoveTag = (idx: number) => {
    setTaggedPeople(taggedPeople.filter((_, i) => i !== idx));
  };

  const handlePublishPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (postSelectedImages.length === 0) return;

    // Compile mentions or tags inside caption if any location
    let finalCaption = postCaption;
    if (postLocation) {
      finalCaption += ` \n📍 ${postLocation}`;
    }
    if (taggedPeople.length > 0) {
      finalCaption += ` \nwith ` + taggedPeople.map(t => `@${t.name}`).join(' ');
    }

    // Publish photo carousel back into post arrays
    addPost(finalCaption, postSelectedImages, 'image', undefined, allowDownloads);
    triggerSuccessParty("Instagram-style visual photography post published!");
  };

  // ==========================================
  // 3. 🎬 CLIPS WORKSPACE STATE & FUNCTIONS
  // ==========================================
  const clipPresetVideos = [
    { name: 'Joyrides Loop', url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4' },
    { name: 'Escapes Horizon', url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4' }
  ];
  const [clipVideoUrl, setClipVideoUrl] = useState(clipPresetVideos[0].url);
  const [clipDuration, setClipDuration] = useState(30); // in seconds (15 to 90s)
  const [clipCaption, setClipCaption] = useState('');
  
  // Audios overlay picker
  const clipAudios = [
    { title: 'Chill Synthwave Pulse', artist: 'HoloSound' },
    { title: 'Lofi Coffee Afternoon', artist: 'BeatEngine' },
    { title: 'Sublime Deep Tech Rhythm', artist: 'Anu G' },
    { title: 'Cybernetic Rain Lounge', artist: 'RetroLoop' }
  ];
  const [selectedClipAudio, setSelectedClipAudio] = useState(clipAudios[0].title);
  const [audioPlay, setAudioPlay] = useState(false);
  const [volumeOriginal, setVolumeOriginal] = useState(80);
  const [volumeMusic, setVolumeMusic] = useState(50);

  // Overlays effects
  const [clipViewportEffect, setClipViewportEffect] = useState<'none' | 'scanline' | 'cyanflicker' | 'vintage'>('none');
  const [placedOverlays, setPlacedOverlays] = useState<{ id: number; text: string; color: string; style: string }[]>([]);
  const [newOverlayText, setNewOverlayText] = useState('');
  const [newOverlayColor, setNewOverlayColor] = useState('cyan');
  const [newOverlayStyle, setNewOverlayStyle] = useState('font-display');

  // Movable stickers picker
  const presetEmojis = ['🔥', '👾', '🚀', '💯', '✨', '🍿', '🎸', '🌟', '💖', '💡'];
  const [placedStickers, setPlacedStickers] = useState<{ id: number; emoji: string; x: number; y: number }[]>([]);

  // Teleprompter / Sensi-Captions ticker simulation
  const [autoCaptionsRunning, setAutoCaptionsRunning] = useState(false);
  const [autoCaptionsProgress, setAutoCaptionsProgress] = useState(0);
  const [activeCaptionPhrase, setActiveCaptionPhrase] = useState('');
  const simulatedSubtitles = [
    { time: 10, text: "Yo! Ready to unlock ConnectX?" },
    { time: 35, text: "The first Liquid Glass workspace is live." },
    { time: 65, text: "Assemble your loops instantly in under 60 seconds!" },
    { time: 90, text: "Let me know your feedback in comments! ✨" }
  ];

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (autoCaptionsRunning && autoCaptionsProgress < 100) {
      timer = setTimeout(() => {
        setAutoCaptionsProgress(prev => {
          const next = prev + 5;
          if (next >= 100) {
            setAutoCaptionsRunning(false);
            // set interactive caption text ticking
            let capIdx = 0;
            const capTick = setInterval(() => {
              if (capIdx < simulatedSubtitles.length) {
                setActiveCaptionPhrase(simulatedSubtitles[capIdx].text);
                capIdx++;
              } else {
                clearInterval(capTick);
                setActiveCaptionPhrase('');
              }
            }, 1800);
          }
          return next;
        });
      }, 100);
    }
    return () => clearTimeout(timer);
  }, [autoCaptionsRunning, autoCaptionsProgress]);

  const handleAddTextOverlay = (e: React.FormEvent) => {
    e.preventDefault();
    if (newOverlayText.trim()) {
      setPlacedOverlays([...placedOverlays, {
        id: Date.now(),
        text: newOverlayText.trim(),
        color: newOverlayColor,
        style: newOverlayStyle
      }]);
      setNewOverlayText('');
    }
  };

  const handlePlaceSticker = (emoji: string) => {
    setPlacedStickers([...placedStickers, {
      id: Date.now(),
      emoji,
      x: 30 + Math.random() * 40,
      y: 20 + Math.random() * 50
    }]);
  };

  const handlePublishClip = (e: React.FormEvent) => {
    e.preventDefault();
    // Gather hashtags from layout text caption
    const hashtags = clipCaption.match(/#\w+/g)?.map(h => h.substring(1)) || ['clips', 'loops'];

    addReel(
      clipCaption || 'Felt creative. Live loop stream sequence!',
      clipVideoUrl,
      selectedClipAudio,
      hashtags,
      allowDownloads
    );
    triggerSuccessParty("Vertical short loop Clip compiled on Reels list!");
  };

  // ==========================================
  // 4. 🎥 VIDEO WORKSPACE STATE & FUNCTIONS
  // ==========================================
  const [videoTitle, setVideoTitle] = useState('');
  const [videoDescription, setVideoDescription] = useState('');
  const [videoThumbnailUrl, setVideoThumbnailUrl] = useState(MOCK_IMAGES.techGadget);
  const [videoHashtags, setVideoHashtags] = useState<string[]>(['#react', '#typescript', '#webdev']);
  const [hashtagInput, setHashtagInput] = useState('');
  const [videoPlaylist, setVideoPlaylist] = useState('Featured Series');

  // Progressive Sync Stream steps states
  const [videoUploadState, setVideoUploadState] = useState<'idle' | 'hashing' | 'uploading' | 'multiplexing' | 'finishing'>('idle');
  const [uploadPercent, setUploadPercent] = useState(0);

  const startVideoUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoTitle.trim()) return;

    setVideoUploadState('hashing');
    setUploadPercent(0);

    setTimeout(() => {
      setVideoUploadState('uploading');
      const timer = setInterval(() => {
        setUploadPercent(p => {
          if (p >= 100) {
            clearInterval(timer);
            setVideoUploadState('multiplexing');
            setTimeout(() => {
              setVideoUploadState('finishing');
              setTimeout(() => {
                // Done! Save and publish
                addVideo(
                  videoTitle,
                  videoDescription,
                  'Tech',
                  videoFileUrl,
                  videoThumbnailUrl,
                  '12:35',
                  '1080p',
                  allowDownloads
                );
                setVideoUploadState('idle');
                triggerSuccessParty(`Widescreen TV video "${videoTitle}" indexed safely!`);
              }, 1200);
            }, 1000);
            return 100;
          }
          return p + 10;
        });
      }, 150);
    }, 1000);
  };

  const addHashtag = (value?: string) => {
    const rawVal = value !== undefined ? value : hashtagInput;
    let clean = rawVal.trim().toLowerCase();
    if (!clean) return;

    clean = clean.replace(/^#+/, '');
    if (!clean) return;
    
    const formatted = '#' + clean;
    if (!videoHashtags.includes(formatted)) {
      setVideoHashtags([...videoHashtags, formatted]);
    }
    setHashtagInput('');
  };

  const handleHashtagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      addHashtag();
    }
  };

  // ==========================================
  // 5. 📖 STORIES WORKSPACE STATE & FUNCTIONS
  // ==========================================
  const storyBackgrounds = [
    { name: 'Pink Retro', class: 'bg-gradient-to-tr from-pink-600 via-purple-700 to-indigo-900' },
    { name: 'Aurora Space', class: 'bg-gradient-to-br from-teal-800 via-indigo-950 to-neutral-900' },
    { name: 'Neon Cyber', class: 'bg-gradient-to-b from-rose-500 via-purple-600 to-sky-750' },
    { name: 'Sleek Eclipse', class: 'bg-gradient-to-tr from-stone-900 via-blue-950 to-neutral-800' }
  ];

  // Draggable story element interface
  interface StoryElement {
    id: string;
    type: 'text' | 'poll' | 'question' | 'link' | 'music' | 'sticker';
    x: number; // percentage from left, e.g. 50
    y: number; // percentage from top, e.g. 50
    scale: number; // multiplier, default 1
    
    // text elements
    text?: string;
    textStyle?: 'classic' | 'modern' | 'neon' | 'serif' | 'strong';
    textColor?: string;
    textBg?: string; // transparent or background color
    
    // poll elements
    pollQuestion?: string;
    pollYes?: string;
    pollNo?: string;
    
    // question elements
    questionPrompt?: string;
    questionTheme?: 'cyan' | 'pink' | 'emerald';
    
    // link elements
    linkUrl?: string;
    linkText?: string;
    
    // music elements
    musicTitle?: string;
    
    // sticker elements
    stickerEmoji?: string;
  }

  const [storyElements, setStoryElements] = useState<StoryElement[]>([]);
  const [storyActiveBg, setStoryActiveBg] = useState(0);
  const [storyBackgroundMedia, setStoryBackgroundMedia] = useState<string | null>(null);
  const [isStoryEditorActive, setIsStoryEditorActive] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('user');
  
  // App-native Instagram-like temporary/contextual overlays
  const [isStickerOverlayOpen, setIsStickerOverlayOpen] = useState(false);
  const [isTextEditorOpen, setIsTextEditorOpen] = useState(false);
  const [textEditorDraft, setTextEditorDraft] = useState('');
  const [textEditorStyle, setTextEditorStyle] = useState<'classic' | 'modern' | 'neon' | 'serif' | 'strong'>('modern');
  const [textEditorColor, setTextEditorColor] = useState('#ffffff');
  const [textEditorBg, setTextEditorBg] = useState('transparent');
  const [textEditorTargetId, setTextEditorTargetId] = useState<string | null>(null); // if editing existing
  
  // Ref for absolute canvas measurements (for perfect mouse/touch coordinates)
  const canvasRef = useRef<HTMLDivElement>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const cameraVideoRef = useRef<HTMLVideoElement>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [draggedElementId, setDraggedElementId] = useState<string | null>(null);

  // Auto start/stop real camera stream when entering/leaving Stories camera view
  useEffect(() => {
    let active = true;
    if (activeWorkspace === 'stories' && !storyBackgroundMedia) {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: { facingMode: cameraFacing }, audio: false })
          .then(stream => {
            if (active) {
              setCameraStream(stream);
              if (cameraVideoRef.current) {
                cameraVideoRef.current.srcObject = stream;
                // Try playing just in case
                cameraVideoRef.current.play().catch(() => {});
              }
            }
          })
          .catch(err => {
            console.warn("Camera stream access failed or is not allowed:", err);
          });
      }
    } else {
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
  }, [activeWorkspace, storyBackgroundMedia, cameraFacing]);
  const [isDraggingActive, setIsDraggingActive] = useState(false);
  const [activeEditingElementId, setActiveEditingElementId] = useState<string | null>(null);
  
  // Keep compatibility states for callbacks or feed indexing
  const [storyAudioTrack, setStoryAudioTrack] = useState('Lo-Fi Wind Vibe');
  const [storyAudioPlaying, setStoryAudioPlaying] = useState(false);
  const [storyQuestionPrompt, setStoryQuestionPrompt] = useState('Drop an anonymous question...');
  const [storyQuestionTheme, setStoryQuestionTheme] = useState<'cyan' | 'pink' | 'emerald'>('cyan');
  const [storyPollEnabled, setStoryPollEnabled] = useState(false);
  const [storyPollQuestion, setStoryPollQuestion] = useState('Are you joining the live hub tomorrow?');
  const [storyPollYesLabel, setStoryPollYesLabel] = useState('Heck Yes');
  const [storyPollNoLabel, setStoryPollNoLabel] = useState('Not yet');
  const [storyMentionsList, setStoryMentionsList] = useState<string[]>([]);
  const [storyCaption, setStoryCaption] = useState('');
  
  // Instagram Story UX specific states
  const [currentFilter, setCurrentFilter] = useState<'none' | 'grayscale' | 'vintage' | 'neon' | 'vhs'>('none');
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [isCapturingAnim, setIsCapturingAnim] = useState(false);
  const [closeFriendsOnly, setCloseFriendsOnly] = useState(false);
  const [isMusicOverlayOpen, setIsMusicOverlayOpen] = useState(false);
  const [drawingColor, setDrawingColor] = useState('#ec4899');
  const [drawingBrushSize, setDrawingBrushSize] = useState(6);
  const [filterToast, setFilterToast] = useState<string | null>(null);
  const [gifSearchQuery, setGifSearchQuery] = useState('');

  const handleToggleStoryMention = (username: string) => {
    if (storyMentionsList.includes(username)) {
      setStoryMentionsList(storyMentionsList.filter(u => u !== username));
    } else {
      setStoryMentionsList([...storyMentionsList, username]);
    }
  };

  const updateElementProp = (id: string, prop: keyof StoryElement, value: any) => {
    setStoryElements(prev => prev.map(el => el.id === id ? { ...el, [prop]: value } : el));
  };

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
        // Delete if empty
        setStoryElements(prev => prev.filter(e => e.id !== textEditorTargetId));
      }
      setIsTextEditorOpen(false);
      return;
    }

    if (textEditorTargetId) {
      // Update
      setStoryElements(prev => prev.map(el => el.id === textEditorTargetId ? {
        ...el,
        text: cleanDraft,
        textStyle: textEditorStyle,
        textColor: textEditorColor,
        textBg: textEditorBg
      } : el));
    } else {
      // Spawn centered
      const newEl: StoryElement = {
        id: 'txt_' + Math.random().toString(36).substr(2, 9),
        type: 'text',
        x: 50,
        y: 45 + (storyElements.filter(e => e.type === 'text').length * 8) % 30, // cascade slightly
        scale: 1,
        text: cleanDraft,
        textStyle: textEditorStyle,
        textColor: textEditorColor,
        textBg: textEditorBg
      };
      setStoryElements(prev => [...prev, newEl]);
    }

    // Automatically parse any typed @mentions and populate lists
    const mentionMatches = cleanDraft.match(/@(\w+)/g);
    if (mentionMatches) {
      const parsedMentions = mentionMatches.map(m => m.substring(1));
      setStoryMentionsList(prev => {
        const union = [...prev];
        parsedMentions.forEach(m => {
          if (!union.includes(m)) union.push(m);
        });
        return union;
      });
    }

    setIsTextEditorOpen(false);
    setTextEditorDraft('');
  };

  const handlePublishStory = (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Resolve Poll widget from canvas
    const canvasPoll = storyElements.find(el => el.type === 'poll');
    const fullPollConfig = canvasPoll ? {
      question: canvasPoll.pollQuestion || 'Are you joining?',
      options: [
        { text: canvasPoll.pollYes || 'Yes', votes: 0 },
        { text: canvasPoll.pollNo || 'No', votes: 0 }
      ]
    } : undefined;

    // 2. Resolve Question widget from canvas
    const canvasQuestion = storyElements.find(el => el.type === 'question');
    const resolvedQuestionPrompt = canvasQuestion ? (canvasQuestion.questionPrompt || 'Ask me anything...') : undefined;

    // 3. Compile all texts, links & emojis into a descriptive caption for the feed
    const textElements = storyElements.filter(el => el.type === 'text');
    const linkElements = storyElements.filter(el => el.type === 'link');
    const emojiElements = storyElements.filter(el => el.type === 'sticker');
    
    let compiledCaption = textElements.map(el => el.text).join(' ');
    
    if (linkElements.length > 0) {
      const linkStrings = linkElements.map(el => `🔗 ${el.linkText || el.linkUrl || 'Link'}`).join(' ');
      compiledCaption = (compiledCaption ? compiledCaption + ' ' : '') + linkStrings;
    }

    if (emojiElements.length > 0) {
      const emojiStrings = emojiElements.map(el => el.stickerEmoji).join('');
      compiledCaption = (compiledCaption ? compiledCaption + ' ' : '') + emojiStrings;
    }

    // Compile mentions list from canvas texts
    const mentionMatches = compiledCaption.match(/@(\w+)/g);
    const mentions = mentionMatches ? mentionMatches.map(m => m.substring(1)) : [];

    // 4. Backing media asset selection
    let activeMedia = storyBackgroundMedia;
    if (!activeMedia) {
      const gradientFallbackImages = [
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800', // sunset ocean mock url
        'https://images.unsplash.com/photo-1515621061946-eff1c2a352bd?w=800', // neon cyber
        'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800', // setup
        'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800'  // mountain
      ];
      activeMedia = gradientFallbackImages[storyActiveBg % gradientFallbackImages.length];
    }

    // Determine mediaType (video or image)
    const isVideoFile = activeMedia.endsWith('.mp4') || 
                        activeMedia.includes('mixkit.co') || 
                        activeMedia.includes('video');
    const mediaType = isVideoFile ? 'video' : 'image';

    addStory(
      activeMedia,
      compiledCaption || "New Interactive Story!",
      resolvedQuestionPrompt,
      fullPollConfig,
      allowDownloads,
      mediaType
    );

    // Reset everything back to selection state
    setStoryElements([]);
    setStoryBackgroundMedia(null);
    setStoryActiveBg(0);

    triggerSuccessParty("Your Instagram-style Story was published successfully!");
  };

  // Helper formatting for overlays lists
  const getOverlayFontClass = (style: string) => {
    switch (style) {
      case 'font-mono': return 'font-mono tracking-wider';
      case 'font-serif': return 'font-serif italic';
      default: return 'font-display font-extrabold tracking-tight uppercase';
    }
  };

  const getOverlayColorClass = (color: string) => {
    switch (color) {
      case 'pink': return 'text-pink-500';
      case 'emerald': return 'text-emerald-400';
      case 'gold': return 'text-yellow-400';
      default: return 'text-cyan-400';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 pb-24 px-2 select-none relative">
      
      {/* SUCCESS OVERLAY PANEL */}
      {successMessage && (
        <div className="fixed inset-0 bg-[#020512]/95 backdrop-blur-md z-50 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300">
          <div className="glass-panel p-8 max-w-sm rounded-[32px] border-cyan-500/25 text-center flex flex-col items-center gap-4 shadow-[#22d3ee]/5 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-500 p-[1.5px] animate-[bounce_1s_infinite]">
              <div className="w-full h-full bg-[#080f26] rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-cyan-400" />
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-display font-black tracking-tight text-white mb-2 uppercase">Creation Synchronized</h3>
              <p className="text-xs text-gray-400 leading-relaxed">{successMessage}</p>
            </div>

            <span className="text-[9px] font-mono py-1 px-3 bg-white/5 border border-white/10 rounded-full text-cyan-300 uppercase tracking-widest font-bold">
              Secure Stream Lock
            </span>
          </div>
        </div>
      )}

      {/* HUB POPUP MENU (Liquid Glass Picker) */}
      {activeWorkspace === 'hub' && (
        <div className="flex flex-col gap-3.5 text-center py-1.5 relative z-10 animate-in fade-in duration-300">
          <div className="flex flex-col gap-0.5 items-center relative">
            <div className="flex items-center justify-between w-full">
              <div className="flex-grow">
                <span className="text-[7.5px] font-mono tracking-[0.22em] text-cyan-400 uppercase font-black">
                  NEW CONTENT STREAM
                </span>
                <h2 className="text-base sm:text-lg font-display font-black text-white uppercase tracking-tight mt-0.5 bg-gradient-to-r from-white via-neutral-200 to-white bg-clip-text text-transparent">
                  Create
                </h2>
              </div>
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="absolute right-0 top-0 p-1.5 bg-white/5 border border-white/10 rounded-full text-gray-400 hover:text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer flex items-center justify-center shadow-lg hover:shadow-cyan-500/10"
                  title="Close Dialog"
                >
                  <Plus className="w-4 h-4 transform rotate-45" />
                </button>
              )}
            </div>
          </div>

          <motion.div 
            className="create-hub-container grid grid-cols-5 gap-1.5 w-full mt-2"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {[
              { 
                id: 'writeup', 
                label: 'WriteUp', 
                tagline: 'Share thoughts',
                emoji: '✍️',
                desc: 'Text, hashtags, polls & scheduling', 
                icon: PenTool,
                glowClass: 'hover:border-white/30 hover:shadow-[0_8px_24px_rgba(0,0,0,0.5)] ring-white/10 text-cyan-400 border-white/10',
                bgClass: 'from-cyan-950/20 to-neutral-950/90',
                iconBg: 'bg-cyan-500/10 text-cyan-455 border-cyan-500/15 group-hover:bg-cyan-500/20',
              },
              { 
                id: 'post', 
                label: 'Post', 
                tagline: 'Upload photo',
                emoji: '📸',
                desc: 'Carousel, crop & tags', 
                icon: Image,
                glowClass: 'hover:border-white/30 hover:shadow-[0_8px_24px_rgba(0,0,0,0.5)] ring-white/10 text-pink-400 border-white/10',
                bgClass: 'from-pink-950/20 to-neutral-950/90',
                iconBg: 'bg-pink-500/10 text-pink-455 border-pink-500/15 group-hover:bg-pink-500/20',
              },
              { 
                id: 'clips', 
                label: 'Clips', 
                tagline: 'Record clip',
                emoji: '🎬',
                desc: 'Short vertical reels & music', 
                icon: Film,
                glowClass: 'hover:border-white/30 hover:shadow-[0_8px_24px_rgba(0,0,0,0.5)] ring-white/10 text-purple-400 border-white/10',
                bgClass: 'from-purple-950/20 to-neutral-950/90',
                iconBg: 'bg-purple-500/10 text-purple-455 border-purple-500/20 group-hover:bg-purple-500/20',
              },
              { 
                id: 'video', 
                label: 'Video', 
                tagline: 'Post video',
                emoji: '🎥',
                desc: 'Long video & thumb upload', 
                icon: Video,
                glowClass: 'hover:border-white/30 hover:shadow-[0_8px_24px_rgba(0,0,0,0.5)] ring-white/10 text-indigo-400 border-white/10',
                bgClass: 'from-indigo-950/20 to-neutral-950/90',
                iconBg: 'bg-indigo-500/10 text-indigo-455 border-indigo-500/15 group-hover:bg-indigo-500/20',
              },
              { 
                id: 'stories', 
                label: 'Stories', 
                tagline: 'Temporary story',
                emoji: '📖',
                desc: '24h ephemeral posts & stickers', 
                icon: History,
                glowClass: 'hover:border-white/30 hover:shadow-[0_8px_24px_rgba(0,0,0,0.5)] ring-white/10 text-amber-400 border-white/10',
                bgClass: 'from-amber-950/20 to-neutral-950/90',
                iconBg: 'bg-amber-500/10 text-amber-455 border-amber-500/25 group-hover:bg-amber-500/20',
              }
            ].map((opt) => {
              const IconComponent = opt.icon;
              return (
                <motion.button
                  key={opt.id}
                  onClick={() => {
                    triggerHaptic('selection');
                    setActiveWorkspace(opt.id as any);
                  }}
                  variants={itemVariants}
                  whileHover={{ 
                    y: -3, 
                    rotate: 0.5,
                    transition: { type: "spring", stiffness: 450, damping: 15 }
                  }}
                  whileTap={{ scale: 0.98 }}
                  className={`glass-panel border border-white/10 group relative overflow-hidden rounded-xl p-2 md:p-3 flex flex-col justify-between items-start text-left h-[105px] ring-1 cursor-pointer ${opt.glowClass}`}
                >
                  {/* Glass reflective gloss overlays */}
                  <div className="absolute inset-x-0 top-0 h-[40%] bg-gradient-to-b from-white/[0.05] to-transparent pointer-events-none transition-opacity duration-300 group-hover:opacity-100"></div>
                  <div className="absolute -inset-full bg-gradient-to-r from-transparent via-white/[0.02] to-transparent group-hover:translate-x-full transition-transform duration-1000 ease-out pointer-events-none"></div>

                  <div className="flex flex-col gap-1.5 relative z-10 w-full">
                    {/* Glowing Icon surround container */}
                    <div className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all duration-300 ${opt.iconBg} shadow-inner`}>
                      <IconComponent className="w-3.5 h-3.5 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6" />
                    </div>

                    <div className="flex flex-col">
                      <span className="text-[8.5px] font-sub font-black text-white uppercase tracking-wider flex items-center gap-1">
                        <span>{opt.emoji}</span>
                        <span className="group-hover:text-white transition-colors">{opt.label}</span>
                      </span>
                      <span className="text-[7.5px] text-gray-400 font-medium tracking-wide mt-0.5 group-hover:text-gray-200 transition-colors">
                        {opt.tagline}
                      </span>
                      <p className="text-[7.5px] text-gray-500 mt-1 leading-normal group-hover:text-gray-300 transition-colors line-clamp-2">
                        {opt.desc}
                      </p>
                    </div>
                  </div>

                  {/* Flow Action tag / Indicator */}
                  <div className="w-full relative z-10 flex justify-between items-center text-[7.5px] font-mono tracking-wider uppercase text-gray-500 group-hover:text-white transition-colors mt-auto pt-1 border-t border-white/5">
                    <span>Init</span>
                    <Plus className="w-2.5 h-2.5 text-cyan-400 opacity-60 group-hover:opacity-100 group-hover:rotate-90 transition-all duration-300" />
                  </div>
                </motion.button>
              );
            })}
          </motion.div>
          
          <div className="text-[8px] font-mono text-gray-500 mt-1">
            Apple Liquid Glass Creation Desk • Autopipelined Content
          </div>
        </div>
      )}


      {/* WORKSPACE DETAILED VIEWS */}
      {activeWorkspace !== 'hub' && activeWorkspace !== 'stories' && activeWorkspace !== 'post' && activeWorkspace !== 'clips' && (
        <div className="flex flex-col gap-4 text-left animate-in fade-in duration-350">
          
          {/* Back handle bar */}
          <div className="flex justify-between items-center">
            <button 
              onClick={() => {
                triggerHaptic('light');
                if (activeWorkspace !== 'writeup' && activeWorkspace !== 'stories' && creationFlowStep !== 'options') {
                  setCreationFlowStep('options');
                } else if (initialWorkspace !== 'hub' && onClose) {
                  onClose();
                } else {
                  setActiveWorkspace('hub');
                }
              }}
              className="py-1.5 px-3 bg-white/5 border border-white/10 hover:bg-white/10 text-xs text-white rounded-xl font-bold flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-lg hover:shadow-cyan-500/5 z-20"
            >
              <ArrowLeft className="w-4 h-4 text-cyan-400" />
              <span>
                {activeWorkspace !== 'writeup' && activeWorkspace !== 'stories' && creationFlowStep !== 'options'
                  ? 'Back to Sourcing'
                  : (initialWorkspace !== 'hub' ? 'Cancel & Close' : 'Back to Creative Deck')}
              </span>
            </button>

            <span className="text-[10px] uppercase font-mono font-extrabold text-gray-500 flex items-center gap-1.5 z-20">
              <span>Node: {activeWorkspace.toUpperCase()}</span>
              {activeWorkspace !== 'writeup' && activeWorkspace !== 'stories' && (
                <>
                  <span className="text-gray-700">•</span>
                  <span className="text-cyan-400">{creationFlowStep.toUpperCase()}</span>
                </>
              )}
            </span>
          </div>

          {/* ======================================= */}
          {/* CAMERA & UPLOAD OPTIONS SELECTION SLOTS */}
          {/* ======================================= */}
          {activeWorkspace !== 'writeup' && activeWorkspace !== 'stories' && creationFlowStep === 'options' && (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center max-w-2xl mx-auto w-full animate-in zoom-in-95 duration-305 z-10">
              <span className="text-[10px] font-mono tracking-[0.25em] text-cyan-400 uppercase font-black bg-cyan-400/10 py-1.5 px-4 rounded-full border border-cyan-400/20 mb-3 block">
                {activeWorkspace === 'post' ? '📸 POST MODEL' : activeWorkspace === 'clips' ? '🎬 CLIPS MODEL' : activeWorkspace === 'video' ? '🎥 VIDEO MODEL' : '📖 STORY MODEL'}
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-tight mt-1">
                Choose Import Stream
              </h2>
              <p className="text-xs text-gray-400 max-w-md mt-2 mb-8 leading-relaxed">
                Connect and sync real-time content. Record live feed using device sensor, or upload from directory gallery.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                {/* Mode A: Capture Card */}
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('medium');
                    setCreationFlowStep('capture');
                  }}
                  className="group relative flex flex-col items-center justify-center p-6 bg-[#070b19]/80 hover:bg-[#0b1227]/90 border border-white/10 hover:border-white/35 rounded-[28px] text-center cursor-pointer transition-all duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.5)] overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-105 transition-opacity" />
                  <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/15 flex items-center justify-center text-white group-hover:scale-110 transition-transform mb-4">
                    <Camera className="w-6.5 h-6.5" />
                  </div>
                  <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                    Capture Live Feed
                  </h3>
                  <p className="text-[11px] text-gray-400 mt-1.5 leading-relaxed max-w-xs">
                    {activeWorkspace === 'post' && "Shoot a high-res photo in Photo Mode."}
                    {activeWorkspace === 'clips' && "Record short vertical clips for stream sequence."}
                    {activeWorkspace === 'video' && "Capture long-form cinematic video feed."}
                    {activeWorkspace === 'stories' && "Record or snap temporary story snippets."}
                  </p>
                </button>

                {/* Mode B: Upload Card */}
                <label className="group relative flex flex-col items-center justify-center p-6 bg-[#070b19]/80 hover:bg-[#0b1227]/90 border border-white/10 hover:border-white/35 rounded-[28px] text-center cursor-pointer transition-all duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.5)] overflow-hidden">
                  <input
                    type="file"
                    className="hidden"
                    accept={
                      activeWorkspace === 'post' ? 'image/*' : 
                      activeWorkspace === 'clips' ? 'video/*' : 
                      activeWorkspace === 'video' ? 'video/*' : 
                      'image/*,video/*'
                    }
                    onChange={(e) => {
                      triggerHaptic('medium');
                      const file = e.target.files?.[0];
                      if (file) {
                        const url = URL.createObjectURL(file);
                        if (activeWorkspace === 'post') {
                          setPostSelectedImages([url]);
                        } else if (activeWorkspace === 'clips') {
                          setClipVideoUrl(url);
                        } else if (activeWorkspace === 'video') {
                          setVideoFileUrl(url);
                        } else if (activeWorkspace === 'stories') {
                          setStoryBackgroundMedia(url);
                        }
                        setCreationFlowStep('editor');
                      }
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-105 transition-opacity" />
                  <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/15 flex items-center justify-center text-white group-hover:scale-110 transition-transform mb-4">
                    <Upload className="w-6.5 h-6.5" />
                  </div>
                  <h3 className="text-sm font-bold text-white group-hover:text-pink-300 transition-colors">
                    Upload from Gallery
                  </h3>
                  <p className="text-[11px] text-gray-400 mt-1.5 leading-relaxed max-w-xs">
                    Import files from your device. Supports standard video/image content synchronization.
                  </p>
                </label>
              </div>
            </div>
          )}

          {/* ======================================= */}
          {/* DEVICE LIVE INTUITIVE CAMERA SENSOR    */}
          {/* ======================================= */}
          {activeWorkspace !== 'writeup' && creationFlowStep === 'capture' && (
            <div className="flex flex-col items-center justify-center max-w-2xl mx-auto w-full gap-5 py-2 animate-in slide-in-from-bottom-8 duration-300 z-10">
              
              <div className="flex justify-between items-center w-full px-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[10px] font-mono tracking-wider font-extrabold text-white uppercase">
                    {isRecording ? `REC ${Math.floor(recordSeconds / 60)}:${String(recordSeconds % 60).padStart(2, '0')}` : 'CAMERA INSTANCE'}
                  </span>
                </div>
                <div className="bg-white/5 border border-white/10 px-2 py-0.5 rounded text-[9px] font-mono text-gray-400">
                  {activeWorkspace === 'post' ? 'PHOTO MODE' : activeWorkspace === 'clips' ? 'CLIP RECORDING' : activeWorkspace === 'video' ? 'LONG VIDEO' : 'STORY MODE'}
                </div>
              </div>

              <div className="relative w-full aspect-video sm:aspect-[4/3] rounded-[24px] bg-black border border-white/10 overflow-hidden shadow-2xl flex flex-col items-center justify-center group min-h-[250px] sm:min-h-[350px]">
                <div className="absolute inset-0 border border-white/5 grid grid-cols-3 grid-rows-3 pointer-events-none z-10 opacity-45">
                  <div className="border-r border-b border-white/5" />
                  <div className="border-r border-b border-white/5" />
                  <div className="border-b border-white/5" />
                  <div className="border-r border-b border-white/5" />
                  <div className="border-r border-b border-white/5" />
                  <div className="border-b border-white/5" />
                  <div className="border-r border-white/5" />
                  <div className="border-r border-white/5" />
                  <div />
                </div>

                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] pointer-events-none z-10 opacity-20" />

                {webcamStream && !cameraError ? (
                  <video 
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover transform -scale-x-100 ${activeArMask === 'glass_ar' ? 'glass-ar-active-feed' : ''}`}
                  />
                ) : (
                  <div className="relative w-full h-full flex items-center justify-center p-6 text-center overflow-hidden">
                    {activeWorkspace === 'post' && (
                      <div className={`absolute inset-0 bg-cover bg-center blur-sm transform scale-105 saturate-[1.2] ${activeArMask === 'glass_ar' ? 'glass-ar-active-feed' : ''}`} style={{ backgroundImage: `url(${MOCK_IMAGES.neonCyber})` }} />
                    )}
                    {activeWorkspace === 'clips' && (
                      <div className={`absolute inset-0 bg-cover bg-center blur-sm transform scale-105 saturate-[1.2] ${activeArMask === 'glass_ar' ? 'glass-ar-active-feed' : ''}`} style={{ backgroundImage: `url(${MOCK_IMAGES.sunsetOcean})` }} />
                    )}
                    {activeWorkspace === 'video' && (
                      <div className={`absolute inset-0 bg-cover bg-center blur-sm transform scale-105 saturate-[1.2] ${activeArMask === 'glass_ar' ? 'glass-ar-active-feed' : ''}`} style={{ backgroundImage: `url(${MOCK_IMAGES.setup})` }} />
                    )}
                    {activeWorkspace === 'stories' && (
                      <div className={`absolute inset-0 bg-cover bg-center blur-sm transform scale-105 saturate-[1.2] ${activeArMask === 'glass_ar' ? 'glass-ar-active-feed' : ''}`} style={{ backgroundImage: `url(${MOCK_IMAGES.mountain})` }} />
                    )}
                    
                    <div className="p-5 py-7 glass-panel rounded-3xl border-white/10 max-w-sm relative z-10 m-3 backdrop-blur-md bg-[#020510]/50 shadow-2xl">
                      <Sparkles className="w-8 h-8 text-cyan-400 mx-auto animate-pulse mb-3" />
                      <h4 className="text-xs font-extrabold text-white font-mono uppercase tracking-[0.1em]">Virtual Camera Active</h4>
                      <p className="text-[10px] text-gray-300 mt-2 leading-relaxed">
                        Camera hardware simulated successfully in this sandbox node. Tap below to capture a high-quality preset stream feed!
                      </p>
                      {cameraError && (
                        <div className="text-[8px] bg-amber-500/10 border border-amber-500/25 text-amber-400 font-mono py-1 px-2.5 rounded-lg mt-3 leading-normal">
                          Notice: {cameraError}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Real-time AR Face Mask Stylesheet & Overlays */}
                <style dangerouslySetInnerHTML={{__html: `
                  @keyframes arFloat {
                    0%, 100% { transform: translateY(0px) scale(1); }
                    50% { transform: translateY(-6px) scale(1.02); }
                  }
                  @keyframes arScanline {
                    0% { top: 0%; }
                    100% { top: 100%; }
                  }
                  @keyframes arMatrix {
                    0% { transform: translateY(-100%); }
                    100% { transform: translateY(100%); }
                  }
                  @keyframes arRotateGear {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                  }
                  @keyframes arRotateGearRev {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(-360deg); }
                  }
                  @keyframes arBlink {
                    0%, 100% { opacity: 0.2; }
                    50% { opacity: 0.9; }
                  }
                  @keyframes glassArFilter {
                    0%, 100% { filter: saturate(1.1) contrast(1.1) hue-rotate(0deg) brightness(1.02) drop-shadow(0 0 10px rgba(6,182,212,0.25)); }
                    50% { filter: saturate(1.4) contrast(1.2) hue-rotate(20deg) brightness(1.1) drop-shadow(0 0 20px rgba(236,72,153,0.35)); }
                  }
                  .animate-arFloat { animation: arFloat 3.5s ease-in-out infinite; }
                  .animate-arScanline { animation: arScanline 2.5s linear infinite; }
                  .animate-arMatrix { animation: arMatrix 4s linear infinite; }
                  .animate-arRotateGear { animation: arRotateGear 10s linear infinite; }
                  .animate-arRotateGearRev { animation: arRotateGearRev 8s linear infinite; }
                  .animate-arBlink { animation: arBlink 1.5s ease-in-out infinite; }
                  .glass-ar-active-feed { animation: glassArFilter 5s ease-in-out infinite; }
                `}} />

                 {activeArMask !== 'none' && (
                  <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden">
                    <div 
                      style={{
                        position: 'absolute',
                        left: `${arFaceX}%`,
                        top: `${arFaceY}%`,
                        width: '280px',
                        height: '280px',
                        transform: `translate(-50%, -50%) scale(${arFaceWidth / 42}) rotate(${arFaceTilt}deg)`,
                      }}
                      className="flex items-center justify-center transition-all duration-75 ease-out"
                    >
                      
                      {activeArMask === 'glass_ar' && (
                        <div className="relative w-full h-full flex items-center justify-center">
                          {/* Outer Glass Ring */}
                          <div className="absolute w-52 h-52 border border-cyan-400/25 rounded-full animate-pulse shadow-[0_0_20px_rgba(6,182,212,0.15)]" />
                          <div className="absolute w-44 h-44 border border-dashed border-white/15 rounded-full animate-arRotateGear" />

                          {/* Futuristic Glass Mask Visor Shield */}
                          <div className="absolute w-48 h-36 bg-white/10 backdrop-blur-xl border border-white/35 rounded-[32px] shadow-[0_0_35px_rgba(6,182,212,0.35),inset_0_0_20px_rgba(255,255,255,0.25)] overflow-hidden flex flex-col justify-between p-3.5 animate-pulse">
                            
                            {/* Moving Diagonal Light Reflection Highlight */}
                            <div className="absolute inset-y-0 -left-1/4 w-12 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[30deg] animate-arScanline" style={{ animationDuration: '3s', animationIterationCount: 'infinite' }} />

                            {/* Hexagonal Grid Patterns Inside Glass Visor */}
                            <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#22d3ee_1px,transparent_1px)] [background-size:12px_12px]" />

                            {/* Top Header info */}
                            <div className="flex justify-between items-center z-10">
                              <span className="text-[7px] font-mono text-cyan-300 font-black tracking-widest flex items-center gap-1">
                                <Cpu className="w-2.5 h-2.5 text-cyan-400 animate-spin" style={{ animationDuration: '6s' }} />
                                GLASS_AR_CV_OS
                              </span>
                              <span className="text-[6px] font-mono text-white/70 bg-cyan-400/25 px-1 py-0.2 rounded border border-cyan-500/20">LIGHT: {arAmbientLight} lm</span>
                            </div>

                            {/* Center Sights / Dual-Lens */}
                            <div className="flex justify-around items-center z-10 my-1">
                              <div className="w-11 h-11 border border-cyan-400/40 rounded-full flex items-center justify-center relative bg-cyan-950/20">
                                <div className="absolute inset-1 border border-cyan-300 border-dashed rounded-full animate-spin" />
                                <div className="w-4 h-4 bg-cyan-400/20 rounded-full flex items-center justify-center">
                                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-ping" />
                                </div>
                              </div>
                              <div className="w-11 h-11 border border-cyan-400/40 rounded-full flex items-center justify-center relative bg-cyan-950/20">
                                <div className="absolute inset-1 border border-cyan-300 border-dashed rounded-full animate-spin" style={{ animationDuration: '4s' }} />
                                <div className="w-4 h-4 bg-pink-500/20 rounded-full flex items-center justify-center">
                                  <div className="w-2 h-2 bg-pink-400 rounded-full animate-ping" style={{ animationDelay: '0.4s' }} />
                                </div>
                              </div>
                            </div>

                            {/* Bottom Diagnostic parameters */}
                            <div className="flex justify-between items-end z-10">
                              <div className="flex flex-col text-[5px] font-mono text-cyan-400/90 leading-tight">
                                <div className="text-emerald-400 font-bold">LOCK_OK: {arTrackingConfidence}%</div>
                                <div className="text-pink-400 animate-pulse">TILT: {arFaceTilt.toFixed(1)}°</div>
                              </div>
                              <div className="flex flex-col text-[5px] font-mono text-right text-cyan-400/90 leading-tight">
                                <div>SCALE: {arFaceWidth.toFixed(1)}%</div>
                                <div>60 FPS (CV)</div>
                              </div>
                            </div>

                            {/* Real-time scanline scan bar */}
                            <div className="absolute left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_8px_rgba(34,211,238,0.8)] animate-arScanline" />
                          </div>
                        </div>
                      )}

                      {activeArMask === 'cyber_hud' && (
                        <div className="relative w-full h-full flex items-center justify-center">
                          <div className="absolute w-44 h-44 border border-cyan-500/30 rounded-lg flex items-center justify-center">
                            <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-cyan-400" />
                            <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-cyan-400" />
                            <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-cyan-400" />
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-cyan-400" />
                            <div className="absolute left-0 right-0 h-[2px] bg-cyan-400/50 shadow-[0_0_8px_rgba(34,211,238,0.5)] animate-arScanline" />
                          </div>

                          <div className="absolute left-[20%] top-[40%] w-12 h-12 flex items-center justify-center">
                            <div className="absolute inset-0 border border-cyan-400/40 rounded-full animate-pulse" />
                            <div className="absolute w-8 h-8 border border-dashed border-cyan-400/60 rounded-full animate-arRotateGear" />
                            <div className="absolute w-2 h-2 bg-cyan-400 rounded-full" />
                            <span className="absolute -top-4 text-[6px] font-mono text-cyan-400">L_EYE</span>
                          </div>

                          <div className="absolute right-[20%] top-[40%] w-14 h-14 flex items-center justify-center">
                            <div className="absolute inset-0 border-2 border-cyan-400 rounded-full shadow-[0_0_8px_rgba(34,211,238,0.4)] animate-pulse" />
                            <div className="absolute w-10 h-10 border border-cyan-400/80 rounded-full border-t-transparent border-b-transparent animate-spin" style={{ animationDuration: '3s' }} />
                            <div className="absolute w-6 h-6 border-2 border-dotted border-cyan-300 rounded-full animate-arRotateGearRev" />
                            <div className="absolute w-3 h-3 bg-red-500 rounded-full animate-ping" />
                            <span className="absolute -top-4 text-[6px] font-mono text-cyan-400">R_LENS</span>
                          </div>

                          <div className="absolute left-[15%] bottom-[25%] font-mono text-[5px] text-cyan-400/80 leading-normal bg-black/40 p-1 rounded border border-cyan-500/20">
                            <div>SYS_OK: 100%</div>
                            <div>LOCK: {arTrackingConfidence}%</div>
                            <div>LUM: {arAmbientLight} cd</div>
                          </div>

                          <div className="absolute right-[15%] bottom-[25%] font-mono text-[5px] text-cyan-400/80 leading-normal bg-black/40 p-1 rounded border border-cyan-500/20 text-right">
                            <div>XY: {arFaceX.toFixed(0)}, {arFaceY.toFixed(0)}</div>
                            <div>TILT: {arFaceTilt.toFixed(1)}°</div>
                            <div>60.00 FPS</div>
                          </div>
                        </div>
                      )}

                      {activeArMask === 'cyberpunk_hacker' && (
                        <div className="relative w-full h-full flex items-center justify-center">
                          <div className="absolute w-56 h-10 bg-emerald-500/10 border-2 border-emerald-400 rounded-lg top-[38%] flex items-center justify-between px-4 shadow-[0_0_15px_rgba(52,211,153,0.3)]">
                            <div className="absolute inset-x-0 h-[1px] bg-emerald-400/30 animate-arScanline" />
                            <span className="text-[7px] font-mono text-emerald-400 font-extrabold tracking-wider animate-pulse">DEC_CR PY_LOCK</span>
                            <div className="flex gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                              <span className="text-[7px] font-mono text-emerald-400 font-black">AR_V2</span>
                            </div>
                          </div>

                          <div className="absolute left-[24%] top-[39%] w-8 h-8 border border-emerald-400/60 rounded-full flex items-center justify-center">
                            <div className="w-4 h-4 border border-dashed border-emerald-400/80 rounded-full" />
                            <div className="w-1 h-1 bg-emerald-400 rounded-full" />
                          </div>
                          <div className="absolute right-[24%] top-[39%] w-8 h-8 border border-emerald-400/60 rounded-full flex items-center justify-center">
                            <div className="w-4 h-4 border border-dashed border-emerald-400/80 rounded-full" />
                            <div className="w-1 h-1 bg-emerald-400 rounded-full" />
                          </div>

                          <div className="absolute left-[10%] top-[48%] h-20 w-8 overflow-hidden opacity-80 border-l border-emerald-500/30 pl-1">
                            <div className="text-[5px] font-mono text-emerald-400 font-bold whitespace-nowrap animate-arMatrix">
                              10101011<br/>01101001<br/>11001101<br/>00110011<br/>11100010<br/>01011101
                            </div>
                          </div>

                          <div className="absolute w-48 h-48 border border-dashed border-emerald-500/15 rounded-full flex items-center justify-center">
                            <span className="text-[6px] font-mono text-emerald-400/40 uppercase absolute bottom-2">SECURE SHELL PROTOCOL</span>
                          </div>
                        </div>
                      )}

                      {activeArMask === 'cute_blush' && (
                        <div className="relative w-full h-full flex items-center justify-center">
                          <div className="absolute left-[20%] top-[50%] w-10 h-6 bg-pink-400/35 rounded-full filter blur-[4px] shadow-[0_0_10px_rgba(244,114,182,0.4)]" />
                          <div className="absolute right-[20%] top-[50%] w-10 h-6 bg-pink-400/35 rounded-full filter blur-[4px] shadow-[0_0_10px_rgba(244,114,182,0.4)]" />

                          <div className="absolute left-[16%] top-[51%] flex flex-col gap-0.5">
                            <div className="w-5 h-[1.5px] bg-pink-300/60 rotate-[12deg] rounded-full" />
                            <div className="w-6 h-[1.5px] bg-pink-300/60 rounded-full" />
                            <div className="w-5 h-[1.5px] bg-pink-300/60 -rotate-[12deg] rounded-full" />
                          </div>

                          <div className="absolute right-[16%] top-[51%] flex flex-col gap-0.5 items-end">
                            <div className="w-5 h-[1.5px] bg-pink-300/60 -rotate-[12deg] rounded-full" />
                            <div className="w-6 h-[1.5px] bg-pink-300/60 rounded-full" />
                            <div className="w-5 h-[1.5px] bg-pink-300/60 rotate-[12deg] rounded-full" />
                          </div>

                          <div className="absolute left-[15%] top-[25%] animate-bounce" style={{ animationDuration: '3s' }}>
                            <Sparkles className="w-4 h-4 text-yellow-300 filter drop-shadow-[0_0_4px_#facc15]" />
                          </div>
                          <div className="absolute right-[15%] top-[20%] animate-bounce" style={{ animationDuration: '4s' }}>
                            <Sparkles className="w-3.5 h-3.5 text-pink-300 filter drop-shadow-[0_0_4px_#f472b6]" />
                          </div>
                          <div className="absolute left-[45%] top-[15%] animate-pulse">
                            <Sparkle className="w-5 h-5 text-cyan-300 filter drop-shadow-[0_0_6px_#67e8f9]" />
                          </div>
                          <div className="absolute right-[40%] top-[55%] animate-bounce" style={{ animationDuration: '2.5s' }}>
                            <Sparkle className="w-3 h-3 text-yellow-300 filter drop-shadow-[0_0_3px_#facc15]" />
                          </div>
                        </div>
                      )}

                      {activeArMask === 'gold_halo' && (
                        <div className="relative w-full h-full flex items-center justify-center">
                          <div className="absolute top-[8%] w-36 h-8 border-[3px] border-yellow-300/80 rounded-full filter drop-shadow-[0_0_12px_rgba(250,204,21,0.8)] flex items-center justify-center transform -rotate-[5deg]">
                            <div className="absolute inset-0.5 border border-white rounded-full animate-pulse" />
                          </div>

                          <div className="absolute top-[20%] w-24 h-12 flex items-end justify-center">
                            <svg viewBox="0 0 100 50" className="w-full h-full fill-yellow-400 stroke-yellow-500 stroke-2 filter drop-shadow-[0_0_8px_rgba(234,179,8,0.7)]">
                              <path d="M 10 50 L 90 50 L 90 40 L 80 20 L 70 35 L 50 10 L 30 35 L 20 20 L 10 40 Z" />
                              <circle cx="50" cy="10" r="3" fill="#ef4444" />
                              <circle cx="20" cy="20" r="2.5" fill="#3b82f6" />
                              <circle cx="80" cy="20" r="2.5" fill="#3b82f6" />
                              <circle cx="50" cy="35" r="2" fill="#22c55e" />
                            </svg>
                          </div>

                          <div className="absolute top-[28%] left-[20%] animate-ping" style={{ animationDuration: '2s' }}>
                            <div className="w-1.5 h-1.5 bg-yellow-300 rounded-full filter blur-[0.5px]" />
                          </div>
                          <div className="absolute top-[25%] right-[20%] animate-ping" style={{ animationDuration: '3s' }}>
                            <div className="w-1 h-1 bg-white rounded-full filter blur-[0.5px]" />
                          </div>
                        </div>
                      )}

                      {activeArMask === 'steampunk_goggles' && (
                        <div className="relative w-full h-full flex items-center justify-center">
                          <div className="absolute w-12 h-2 bg-amber-800 border border-amber-600 top-[44%] z-10" />

                          <div className="absolute left-[20%] top-[38%] w-16 h-16 flex items-center justify-center bg-amber-950/40 rounded-full border-[3px] border-amber-600 shadow-[0_0_12px_rgba(245,158,11,0.5)]">
                            <div className="absolute inset-0 border border-amber-500 rounded-full border-dashed animate-arRotateGear" />
                            <div className="w-12 h-12 rounded-full bg-amber-500/15 border border-amber-400 flex items-center justify-center">
                              <div className="absolute w-10 h-[1px] bg-amber-400/40" />
                              <div className="absolute h-10 w-[1px] bg-amber-400/40" />
                              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                            </div>
                            <div className="absolute -top-1.5 -left-1 w-4 h-4 bg-amber-700 rounded border border-amber-500 flex items-center justify-center text-[5px] font-mono text-amber-200 animate-spin" style={{ animationDuration: '6s' }}>⚓</div>
                          </div>

                          <div className="absolute right-[20%] top-[38%] w-16 h-16 flex items-center justify-center bg-amber-950/40 rounded-full border-[3px] border-amber-600 shadow-[0_0_12px_rgba(245,158,11,0.5)]">
                            <div className="absolute inset-0 border border-amber-500 rounded-full border-dashed animate-arRotateGearRev" />
                            <div className="w-12 h-12 rounded-full bg-amber-500/15 border border-amber-400 flex items-center justify-center">
                              <div className="w-6 h-6 border border-dashed border-amber-400/60 rounded-full animate-spin" style={{ animationDuration: '12s' }} />
                              <div className="absolute w-10 h-[1px] bg-amber-400/40" />
                              <div className="absolute h-10 w-[1px] bg-amber-400/40" />
                              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                            </div>
                            <div className="absolute -top-1.5 -right-1 w-4 h-4 bg-amber-700 rounded border border-amber-500 flex items-center justify-center text-[5px] font-mono text-amber-200 animate-spin" style={{ animationDuration: '4s' }}>⚙️</div>
                          </div>

                          <div className="absolute left-[16%] top-[56%] w-7 h-7 bg-amber-900/80 border border-amber-600 rounded-full flex items-center justify-center font-mono text-[4px] text-amber-400">
                            <div className="w-[1px] h-3 bg-red-400 origin-bottom transform rotate-[45deg] absolute bottom-3.5" />
                            <div className="absolute bottom-1">BAR</div>
                          </div>

                          <div className="absolute right-[16%] top-[56%] w-7 h-7 bg-amber-900/80 border border-amber-600 rounded-full flex items-center justify-center font-mono text-[4px] text-amber-400">
                            <div className="w-[1px] h-3 bg-red-400 origin-bottom transform -rotate-[30deg] absolute bottom-3.5" />
                            <div className="absolute bottom-1">PSI</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeArMask !== 'none' && (
                  <>
                    {/* Real-time Computer Vision Bounding Box Overlay */}
                    <div 
                      style={{
                        position: 'absolute',
                        left: `${arFaceX}%`,
                        top: `${arFaceY}%`,
                        width: `${arFaceWidth * 1.5}%`,
                        height: `${arFaceHeight * 1.5}%`,
                        transform: `translate(-50%, -50%) rotate(${arFaceTilt}deg)`,
                      }}
                      className="border-2 border-dashed border-cyan-400/40 rounded-3xl pointer-events-none transition-all duration-75 ease-out z-20"
                    >
                      {/* Bounding box corner targets */}
                      <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-cyan-400" />
                      <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-cyan-400" />
                      <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-cyan-400" />
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-cyan-400" />
                      
                      {/* Tracking target crosshair */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-30">
                        <div className="w-4 h-[1px] bg-cyan-400" />
                        <div className="h-4 w-[1px] bg-cyan-400" />
                      </div>
                      
                      {/* Tracking target label */}
                      <span className="absolute -top-5 left-1/2 transform -translate-x-1/2 text-[6px] font-mono font-black text-cyan-400 uppercase tracking-widest bg-[#050508]/80 px-1.5 py-0.5 rounded border border-cyan-500/30 animate-pulse whitespace-nowrap">
                        FACE_LOCK: {arTrackingConfidence}%
                      </span>
                    </div>

                    {/* Real-time Computer Vision Diagnostics HUD Overlay */}
                    <div className="absolute bottom-12 left-4 z-20 bg-[#02040b]/85 backdrop-blur-md border border-cyan-500/25 p-2 rounded-xl font-mono text-[6.5px] text-cyan-300 leading-normal flex flex-col gap-0.5 shadow-[0_0_15px_rgba(6,182,212,0.18)] min-w-[125px] pointer-events-none">
                      <div className="flex items-center gap-1.5 border-b border-cyan-500/20 pb-1 mb-1 justify-between">
                        <span className="font-extrabold uppercase tracking-widest text-white text-[7px] flex items-center gap-1">
                          <Cpu className="w-2.5 h-2.5 text-cyan-400 animate-pulse" />
                          CV ENGINE V2.4
                        </span>
                        <span className={`w-1.5 h-1.5 rounded-full ${arTrackingConfidence > 50 ? 'bg-emerald-400 animate-ping' : 'bg-rose-500 animate-pulse'}`} />
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">TRACK_STATUS:</span>
                        <span className={arTrackingConfidence > 50 ? 'text-emerald-400 font-extrabold' : 'text-amber-400'}>
                          {arTrackingConfidence > 50 ? 'SYS_LOCK' : 'SEARCHING'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">LOCK_CONFIDENCE:</span>
                        <span className="text-white">{arTrackingConfidence}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">COORD_X:</span>
                        <span className="text-white">{(arFaceX * 19.2).toFixed(1)} px</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">COORD_Y:</span>
                        <span className="text-white">{(arFaceY * 10.8).toFixed(1)} px</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">HEAD_TILT_ROLL:</span>
                        <span className="text-white">{arFaceTilt.toFixed(1)}°</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">AMBIENT_LUM:</span>
                        <span className="text-white">{arAmbientLight} cd/m²</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">ROI_DIMENSION:</span>
                        <span className="text-white">{arFaceWidth.toFixed(0)}x{arFaceHeight.toFixed(0)} mm</span>
                      </div>
                    </div>
                  </>
                )}

                <div className="absolute top-4 left-4 z-10 bg-black/60 backdrop-blur border border-white/10 py-1 px-2 rounded-xl text-[8px] font-mono text-gray-300 flex items-center gap-1.5 shadow-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  <span>ISO 100</span>
                  <span>•</span>
                  <span>1080P/60FPS</span>
                </div>

                <div className="absolute top-4 right-4 z-10 bg-black/60 backdrop-blur border border-white/10 py-1 px-2 rounded-xl text-[8px] font-mono text-gray-300 flex items-center gap-1.5 shadow-md">
                  <span>WLI: 5400K</span>
                  <span>•</span>
                  <span>SHUTTER: 1/125</span>
                </div>

                {/* Dedicated Glass AR Toggle Button */}
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('medium');
                    setActiveArMask(activeArMask === 'glass_ar' ? 'none' : 'glass_ar');
                  }}
                  className={`absolute top-12 right-4 z-20 px-2.5 py-1.5 rounded-xl text-[8.5px] font-mono font-black uppercase tracking-wider border transition-all duration-300 flex items-center gap-1.5 shadow-lg ${
                    activeArMask === 'glass_ar'
                      ? 'bg-gradient-to-r from-cyan-500/25 to-pink-500/25 border-cyan-400 text-white shadow-[0_0_12px_rgba(34,211,238,0.35)] scale-105'
                      : 'bg-black/70 backdrop-blur border-white/10 text-gray-300 hover:text-white hover:border-white/20 hover:scale-[1.02]'
                  }`}
                >
                  <Sparkles className={`w-3 h-3 ${activeArMask === 'glass_ar' ? 'text-cyan-300 animate-spin' : 'text-gray-400'}`} style={{ animationDuration: '4s' }} />
                  <span>Glass AR: {activeArMask === 'glass_ar' ? 'ON' : 'OFF'}</span>
                </button>

                {isRecording && (
                  <div className="absolute bottom-4 left-4 z-10 bg-red-650/80 backdrop-blur border border-red-500/20 py-1 px-2.5 rounded-xl text-[9px] font-mono font-black text-white animate-pulse shadow-md flex items-center gap-1">
                    <span>🔴 VIDEO LIVE WRITING</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col items-center justify-center gap-3 w-full mt-2">
                {/* AR Masks Horizontal Lens Selection Panel */}
                <div className="w-full flex flex-col gap-2 bg-[#050508]/60 backdrop-blur border border-white/5 p-3 rounded-2xl">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] font-mono text-cyan-400 font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                      Live AR Face Filters
                    </span>
                    {activeArMask !== 'none' && (
                      <span className="text-[7px] font-mono text-cyan-400/85 animate-pulse bg-cyan-950/40 border border-cyan-500/20 py-0.5 px-2 rounded-full">
                        Lens Active: {activeArMask.toUpperCase()}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none scroll-smooth">
                    {[
                      { id: 'none', name: 'Original', icon: X, color: 'text-gray-400 border-white/10 bg-white/5' },
                      { id: 'glass_ar', name: 'Glass AR', icon: Sparkles, color: 'text-cyan-300 border-cyan-400/30 bg-cyan-950/30 shadow-[0_0_8px_rgba(6,182,212,0.2)]' },
                      { id: 'cyber_hud', name: 'Cyber HUD', icon: Cpu, color: 'text-cyan-400 border-cyan-500/25 bg-cyan-950/25' },
                      { id: 'cyberpunk_hacker', name: 'Hacker Visor', icon: Terminal, color: 'text-emerald-400 border-emerald-500/25 bg-emerald-950/25' },
                      { id: 'cute_blush', name: 'Blush Sparkle', icon: Sparkles, color: 'text-pink-400 border-pink-500/25 bg-pink-950/25' },
                      { id: 'gold_halo', name: 'Aurelia Crown', icon: Shield, color: 'text-yellow-400 border-yellow-500/25 bg-yellow-950/25' },
                      { id: 'steampunk_goggles', name: 'Steampunk', icon: Settings, color: 'text-amber-500 border-amber-500/25 bg-amber-950/25' },
                    ].map((mask) => {
                      const IconComponent = mask.icon;
                      const isSelected = activeArMask === mask.id;
                      return (
                        <button
                          key={mask.id}
                          type="button"
                          onClick={() => {
                            triggerHaptic('selection');
                            setActiveArMask(mask.id);
                          }}
                          className={`flex items-center gap-1.5 shrink-0 py-1.5 px-3 rounded-full text-[10px] font-semibold uppercase tracking-wider border transition-all duration-300 ${
                            isSelected
                              ? 'bg-gradient-to-r from-sky-500/20 to-purple-500/20 border-cyan-400 text-cyan-400 shadow-md shadow-cyan-500/10 scale-105'
                              : `${mask.color} hover:brightness-110 active:scale-95`
                          }`}
                        >
                          <IconComponent className="w-3.5 h-3.5" />
                          <span>{mask.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center gap-8 justify-center">
                  
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      setCreationFlowStep('options');
                    }}
                    className="p-3 bg-white/5 border border-white/10 text-gray-300 hover:text-white rounded-full hover:bg-white/10 active:scale-95 transition-all text-xs"
                    title="Change Input"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>

                  {activeWorkspace === 'post' ? (
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('double');
                        const captureUrl = MOCK_IMAGES.neonCyber; 
                        setPostSelectedImages([captureUrl]);
                        setCreationFlowStep('editor');
                      }}
                      className="w-16 h-16 rounded-full border-4 border-white p-1 bg-white/10 hover:bg-white/20 active:scale-90 transition-all flex items-center justify-center relative cursor-pointer"
                      title="Capture Photo"
                    >
                      <div className="w-full h-full bg-white rounded-full shadow-inner shadow-black/25" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic(isRecording ? [40, 20, 45] : 30);
                        if (isRecording) {
                          setIsRecording(false);
                          if (activeWorkspace === 'clips') {
                            setClipVideoUrl(clipPresetVideos[1].url);
                          } else if (activeWorkspace === 'video') {
                            setVideoFileUrl('https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4');
                          } else if (activeWorkspace === 'stories') {
                            setStoryBackgroundMedia(MOCK_IMAGES.sunsetOcean);
                          }
                          setCreationFlowStep('editor');
                        } else {
                          setIsRecording(true);
                        }
                      }}
                      className={`w-16 h-16 rounded-full border-4 border-white p-1 bg-white/10 hover:bg-white/20 active:scale-90 transition-all flex items-center justify-center relative cursor-pointer ${isRecording ? 'border-red-500' : 'border-white'}`}
                      title={isRecording ? 'Stop Recording' : 'Start Recording'}
                    >
                      {isRecording ? (
                        <div className="w-6 h-6 bg-red-500 rounded shadow-md animate-pulse" />
                      ) : (
                        <div className="w-12 h-12 bg-red-650 rounded-full shadow-md hover:bg-red-600 transition-colors" />
                      )}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      setCreationFlowStep('options');
                    }}
                    className="p-3 bg-red-550/10 border border-red-500/10 text-red-400 hover:text-red-300 rounded-full hover:bg-red-500/20 active:scale-95 transition-all text-xs"
                    title="Cancel Capture"
                  >
                    <Plus className="w-4 h-4 transform rotate-45" />
                  </button>

                </div>

                <p className="text-[10px] text-gray-500 font-medium">
                  {activeWorkspace === 'post' ? 'Tap shutter to compile image' : isRecording ? 'Recording sequence. Tap again to commit & lock segment.' : 'Tap trigger to begin stream recording'}
                </p>
              </div>

            </div>
          )}

          {/* Render detailed forms only if creationFlowStep is 'editor' (or if writeup which is always editing) */}
          {(activeWorkspace === 'writeup' || creationFlowStep === 'editor') && (
            <>
              {/* ======================================= */}
              {/* A. WRITEUP DETAILED FORM (Threads Style)*/}
              {/* ======================================= */}
              {activeWORKSPACE_RENDERER('writeup') && (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6 text-left">
                  
                  {/* Left column: Text Editor (3/5 width on desktop) */}
                  <div className="md:col-span-3 flex flex-col gap-4">
                    
                    {/* Tiny header/banner with local draft actions */}
                    <div className="flex justify-between items-center bg-white/5 p-2 px-3 rounded-2xl border border-white/5">
                      <span className="text-[10px] text-gray-400 font-mono flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                        Local Draft Cache Manager
                      </span>
                      <div className="flex gap-1.5">
                        <button 
                          type="button" 
                          onClick={restoreWriteupDraft}
                          className="py-1 px-2.5 bg-cyan-400/10 hover:bg-cyan-400/20 border border-cyan-400/20 text-cyan-400 rounded-lg text-4xs font-mono font-bold transition-all"
                        >
                          Restore Draft
                        </button>
                        <button 
                          type="button" 
                          onClick={saveWriteupDraft}
                          className="py-1 px-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 rounded-lg text-4xs font-mono font-bold transition-all"
                        >
                          Save Draft
                        </button>
                      </div>
                    </div>

                    {/* Text area and format bar container */}
                    <div className="relative flex flex-col bg-[#0b0c16]/50 border border-white/5 rounded-3xl p-4 focus-within:border-cyan-400/50 transition-colors">
                      
                      {/* Textarea */}
                      <textarea
                        required
                        placeholder="Share what's on your mind... Use @username to mention or add tags below..."
                        rows={8}
                        value={writeupText}
                        onChange={e => {
                          setWriteupText(e.target.value);
                          const match = e.target.value.match(/@(\w*)$/);
                          if (match) {
                            setMentionQuery(match[1]);
                            setShowMentionDropdown(true);
                          } else {
                            setShowMentionDropdown(false);
                          }
                        }}
                        className="w-full bg-transparent border-none text-sm text-white leading-relaxed resize-none focus:outline-none placeholder:text-gray-500 font-sans min-h-[160px]"
                      />

                      {/* Formatting toolbar & character counter in-line at the bottom */}
                      <div className="flex justify-between items-center border-t border-white/5 pt-3 mt-3">
                        {/* Format Bar */}
                        <div className="flex gap-1 bg-white/5 p-1 rounded-xl">
                          {[
                            { l: 'B', tag: '**', title: 'Bold' },
                            { l: 'I', tag: '*', title: 'Italic' },
                            { l: 'H', tag: '###', title: 'Header' },
                            { l: 'C', tag: '`', title: 'Code' },
                            { l: 'Q', tag: '> ', title: 'Quote' }
                          ].map(f => (
                            <button
                              key={f.l}
                              type="button"
                              onClick={() => applyTextFormat(f.tag)}
                              className="w-6 h-6 flex items-center justify-center text-xs font-mono font-black text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                              title={f.title}
                            >
                              {f.l}
                            </button>
                          ))}
                        </div>

                        {/* Word & character counts */}
                        <div className="text-[10px] font-mono text-gray-500 flex gap-3">
                          <span>{writeupText.split(/\s+/).filter(Boolean).length} words</span>
                          <span>{writeupText.length} chars</span>
                        </div>
                      </div>

                      {/* Connection Mention Dropdown overlay absolute */}
                      {showMentionDropdown && (
                        <div className="absolute left-4 right-4 bottom-14 bg-neutral-950/95 backdrop-blur border border-white/10 rounded-2xl p-2 flex flex-col gap-1 max-h-36 overflow-y-auto z-10 shadow-2xl">
                          <span className="text-[9px] text-gray-500 font-mono px-2 py-1 uppercase border-b border-white/5">Mention connects</span>
                          {users.filter(u => u.username.toLowerCase().includes(mentionQuery.toLowerCase())).map(usr => (
                            <button
                              key={usr.id}
                              type="button"
                              onClick={() => handleMentionSelect(usr.username)}
                              className="flex items-center gap-2 py-1.5 px-2 hover:bg-white/5 rounded-xl text-left transition-colors"
                            >
                              <img src={usr.profilePic} className="w-5 h-5 rounded-full object-cover" alt="avatar" />
                              <span className="text-xs text-white">@{usr.username}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Live Post Draft Preview (Liquid Glass-styled) */}
                    <div className="mt-4 p-5 rounded-3xl relative overflow-hidden border border-white/10 bg-white/[0.02] backdrop-blur-xl shadow-[0_12px_40px_rgba(0,0,0,0.5)] flex flex-col gap-3.5 transition-all duration-300 hover:border-cyan-500/20 group text-left">
                      {/* Glossy sheen reflection */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/[0.04] to-white/0 pointer-events-none" />
                      
                      <div className="flex justify-between items-center border-b border-white/5 pb-2.5">
                        <span className="text-[10px] font-mono tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-cyan-400 font-extrabold uppercase flex items-center gap-1.5 animate-pulse">
                          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                          LIQUID GLASS DRAFT PREVIEW
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
                          <span className="text-[8px] font-mono text-gray-500 uppercase font-black">Staged</span>
                        </div>
                      </div>
                      
                      {/* Header with User Info */}
                      <div className="flex items-center gap-3">
                        <img 
                          src={currentUser?.profilePic || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"} 
                          className="w-9 h-9 rounded-full border border-white/15 object-cover shadow-sm" 
                          alt="User avatar" 
                        />
                        <div className="flex flex-col text-left">
                          <span className="text-xs font-bold text-white leading-tight">
                            {currentUser?.displayName || 'Creator'}
                          </span>
                          <span className="text-[9.5px] font-mono text-gray-400">
                            @{currentUser?.username || 'username'} • Just now
                          </span>
                        </div>
                      </div>

                      {/* Post Content preview */}
                      <div className="text-xs text-gray-200 whitespace-pre-wrap leading-relaxed font-sans min-h-[40px] text-left">
                        {writeupText ? writeupText : <span className="text-gray-500 italic">Start typing above to compile real-time draft preview...</span>}
                      </div>

                      {/* Attachment Preview in Draft */}
                      {writeupAttachment && (
                        <div className="rounded-2xl overflow-hidden border border-white/10 aspect-video relative mt-1 bg-neutral-950/80 shadow-md">
                          <img src={writeupAttachment} className="w-full h-full object-cover" alt="Draft Attachment" />
                        </div>
                      )}

                      {/* Interactive Poll Preview in Draft */}
                      {writeupPollEnabled && writeupPollQuestion.trim() && (
                        <div className="mt-2.5 p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col gap-2.5">
                          <span className="text-[10px] font-mono text-pink-400 font-bold flex items-center gap-1.5">
                            🗳️ POLL: {writeupPollQuestion}
                          </span>
                          <div className="flex flex-col gap-2">
                            {writeupPollOptions.map(o => o.trim()).filter(Boolean).map((opt, i) => (
                              <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-2 px-3 text-[10px] text-gray-300 font-bold text-left transition-colors hover:bg-white/10">
                                {opt}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Hashtags list */}
                      {writeupHashtags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {writeupHashtags.map(t => (
                            <span key={t} className="text-[10px] font-mono text-cyan-400 font-bold bg-cyan-400/5 px-2 py-0.5 rounded-md border border-cyan-400/10">
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Liquid Glass Location Badge */}
                      {writeupLocation && (
                        <div className="mt-2.5 self-start inline-flex items-center gap-2 bg-gradient-to-r from-rose-500/10 via-pink-500/10 to-rose-500/10 border border-rose-500/30 backdrop-blur-xl px-4 py-2 rounded-full text-[10px] font-black text-rose-300 font-mono tracking-wide shadow-[0_4px_16px_rgba(244,63,94,0.12)] hover:shadow-[0_4px_24px_rgba(244,63,94,0.25)] hover:border-rose-500/50 hover:scale-[1.02] transition-all duration-300 select-none cursor-pointer">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                          </span>
                          <MapPin className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                          <span>{writeupLocation}</span>
                          {locationCoords && (
                            <span className="text-[8.5px] text-rose-300/60 font-medium">
                              {hidePreciseLocation ? '(Precise GPS: Masked)' : `(${locationCoords.latitude.toFixed(3)}, ${locationCoords.longitude.toFixed(3)})`}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                  </div>

                  {/* Right column: Settings & Options (2/5 width on desktop) */}
                  <div className="md:col-span-2 flex flex-col gap-4">
                    
                    {/* Unified Settings List with collapsibles */}
                    <div className="bg-[#0b0c16]/30 border border-white/5 rounded-3xl p-4 flex flex-col gap-3">
                      <div className="pb-1 border-b border-white/5">
                        <span className="text-3xs uppercase tracking-wider font-mono text-gray-500 font-bold">Post Settings</span>
                      </div>

                      {/* 1. Hashtags item (always visible but clean) */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] uppercase font-mono text-gray-400">Hashtags</label>
                        <form onSubmit={handleAddHashtag} className="flex gap-2">
                          <div className="flex-grow flex items-center bg-white/5 rounded-xl border border-white/10 focus-within:border-cyan-400 px-3 py-1.5 transition-colors">
                            <span className="text-gray-500 text-xs font-mono">#</span>
                            <input
                              type="text"
                              value={hashInput}
                              onChange={e => setHashInput(e.target.value)}
                              placeholder="trending-tag"
                              className="bg-transparent border-none text-xs text-white outline-none w-full py-0.5 ml-0.5"
                            />
                          </div>
                          <button 
                            type="submit" 
                            className="py-1 px-3 bg-cyan-400/10 hover:bg-cyan-400/20 border border-cyan-400/20 text-cyan-400 rounded-xl text-3xs font-bold transition-all"
                          >
                            + Add
                          </button>
                        </form>

                        {/* Tags Chip grid */}
                        {writeupHashtags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {writeupHashtags.map(t => (
                              <div key={t} className="flex items-center gap-1 bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 text-4xs py-0.5 px-2 rounded-full font-semibold font-mono">
                                <span>#{t}</span>
                                <button type="button" onClick={() => setWriteupHashtags(writeupHashtags.filter(x => x !== t))} className="text-cyan-300 font-bold ml-0.5">×</button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Preselected Recommended Tags */}
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <span className="text-[9px] font-mono text-gray-500 uppercase">Suggests:</span>
                          {['web3', 'innovation', 'cyber', 'lossless', 'studio'].map(tag => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => { if (!writeupHashtags.includes(tag)) setWriteupHashtags([...writeupHashtags, tag]) }}
                              className="bg-white/5 hover:bg-white/10 text-gray-400 text-[10px] py-0.5 px-1.5 rounded border border-white/5 font-mono transition-all"
                            >
                              #{tag}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 2. Visual Attachment Selector (Collapsible style row) */}
                      <div className="border-t border-white/5 pt-3 flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <Image className="w-4 h-4 text-cyan-400" />
                            <span className="text-xs font-bold text-white">Attach Visual Image</span>
                          </div>
                          <select
                            value={writeupAttachment || ''}
                            onChange={e => setWriteupAttachment(e.target.value || null)}
                            className="bg-neutral-900 border border-white/10 text-white rounded-lg text-3xs py-1 px-1.5 outline-none font-sans"
                          >
                            <option value="">None</option>
                            <option value={MOCK_IMAGES.sunsetOcean}>Sunset Ocean</option>
                            <option value={MOCK_IMAGES.neonCyber}>Neon Cyberpunk</option>
                            <option value={MOCK_IMAGES.setup}>Workstation Desk</option>
                            <option value={MOCK_IMAGES.mountain}>Snowy Peak</option>
                          </select>
                        </div>

                        {writeupAttachment && (
                          <div className="aspect-video w-full rounded-2xl overflow-hidden border border-white/10 relative mt-1 group animate-in slide-in-from-top-2 duration-200">
                            <img src={writeupAttachment} className="w-full h-full object-cover" alt="Attached preview" />
                            <button 
                              type="button" 
                              onClick={() => setWriteupAttachment(null)}
                              className="absolute top-2 right-2 w-5 h-5 bg-black/60 hover:bg-red-600 rounded-full text-white flex items-center justify-center transition-all font-bold text-xs"
                            >
                              ×
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Tag Location */}
                      <div className="border-t border-white/5 pt-3 flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-rose-500" />
                            <span className="text-xs font-bold text-white">Tag Location</span>
                          </div>
                          
                          {/* Filter by Trending Toggle Switch */}
                          <div className="flex items-center gap-1.5 bg-cyan-500/5 border border-cyan-500/10 rounded-lg p-1 px-2 transition-all">
                            <span className="text-[8.5px] text-cyan-400 font-bold tracking-wider uppercase">Filter by Trending</span>
                            <button
                              type="button"
                              onClick={() => {
                                triggerHaptic('selection');
                                setFilterByTrending(!filterByTrending);
                              }}
                              className={`relative inline-flex h-3.5 w-6.5 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                filterByTrending ? 'bg-cyan-500' : 'bg-white/10'
                              }`}
                            >
                              <span
                                className={`pointer-events-none inline-block h-2.5 w-2.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                  filterByTrending ? 'translate-x-3' : 'translate-x-0'
                                }`}
                              />
                            </button>
                          </div>

                          {writeupLocation && (
                            <button
                              type="button"
                              onClick={() => {
                                triggerHaptic('light');
                                setWriteupLocation('');
                              }}
                              className="text-[9px] text-gray-400 hover:text-white transition-colors"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                        
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            value={writeupLocation}
                            onChange={e => setWriteupLocation(e.target.value)}
                            placeholder={filterByTrending ? "Select or enter trending location tag..." : "Enter custom location..."}
                            className="flex-grow bg-neutral-900 border border-white/10 rounded-xl p-2 text-xs text-white outline-none focus:border-rose-500 transition-all placeholder:text-gray-500"
                          />
                          <button
                            type="button"
                            onClick={fetchGeolocation}
                            disabled={isLocating}
                            className={`flex items-center justify-center px-3.5 rounded-xl border transition-all cursor-pointer ${
                              isLocating
                                ? 'bg-rose-500/20 border-rose-500/30 text-rose-400 animate-pulse'
                                : 'bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/20 text-rose-400 hover:text-rose-300 hover:scale-[1.03] active:scale-95'
                            }`}
                            title="Auto-detect geolocation coords"
                          >
                            {isLocating ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <div className="flex items-center gap-1 text-[9px] font-bold tracking-wider font-mono uppercase">
                                <Sparkle className="w-3 h-3 text-rose-400 animate-pulse" />
                                <span>GPS</span>
                              </div>
                            )}
                          </button>
                        </div>

                        {/* Privacy Mode Toggle for precise coordinates */}
                        {writeupLocation && (
                          <div className="flex items-center justify-between bg-white/[0.02] border border-white/5 rounded-xl p-2 px-3 mt-0.5 animate-in fade-in slide-in-from-top-1 duration-150">
                            <div className="flex flex-col text-left">
                              <span className="text-[10px] font-bold text-gray-300">Privacy Mode</span>
                              <span className="text-[8.5px] font-mono text-gray-500">Hide precise coordinate telemetry</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                triggerHaptic('selection');
                                setHidePreciseLocation(!hidePreciseLocation);
                              }}
                              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                hidePreciseLocation ? 'bg-rose-500' : 'bg-white/10'
                              }`}
                            >
                              <span
                                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                  hidePreciseLocation ? 'translate-x-4' : 'translate-x-0'
                                }`}
                              />
                            </button>
                          </div>
                        )}

                        {/* Premium Ticker Matcher Container */}
                        {filterByTrending && (
                          <div className="p-2.5 bg-gradient-to-r from-cyan-500/10 via-cyan-500/[0.03] to-transparent border border-cyan-500/15 rounded-xl flex flex-col gap-1.5 animate-in slide-in-from-top-2 duration-200 text-left">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-bold text-cyan-400 flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-cyan-400 animate-pulse" />
                                Most Popular Trend Matcher
                              </span>
                              <span className="text-[7px] font-mono text-cyan-500 uppercase tracking-widest bg-cyan-500/20 px-1 py-0.2 rounded">Active Ticker</span>
                            </div>
                            <p className="text-[9px] text-gray-400 leading-normal">
                              Quickly link your post writeup and location metadata to <strong className="text-rose-400 font-bold">#ConnectXVibe</strong>, the highest-volume trending hashtag on the network ticker.
                            </p>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  triggerHaptic('success');
                                  // Set location
                                  setWriteupLocation('#ConnectXVibe Core');
                                  // Append hashtag to text if not present
                                  if (!writeupText.includes('#ConnectXVibe')) {
                                    setWriteupText(prev => prev ? `${prev} #ConnectXVibe` : '#ConnectXVibe');
                                  }
                                }}
                                className="flex-1 py-1.5 px-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-[9px] font-bold flex items-center justify-center gap-1.5 transition-all shadow-[0_0_10px_rgba(6,182,212,0.15)] hover:scale-[1.01] active:scale-95 cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5 text-white shrink-0" />
                                <span>Associate #ConnectXVibe</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Location Quick Picks */}
                        <div className="flex gap-1.5 overflow-x-auto py-0.5 scrollbar-none">
                          {(filterByTrending 
                            ? ['#ConnectXVibe', '#TokyoCyberpunk', '#LiquidGlass', '#CreatorCoin', '#Web3Atmosphere']
                            : ['Silicon Valley, CA', 'Studio HQ', 'Mumbai, IN', 'Cyberpunk Hub', 'Cafe Vibe']
                          ).map(loc => (
                            <button
                              key={loc}
                              type="button"
                              onClick={() => {
                                triggerHaptic('selection');
                                setWriteupLocation(loc);
                                if (filterByTrending && !writeupText.includes(loc)) {
                                  setWriteupText(prev => prev ? `${prev} ${loc}` : loc);
                                }
                              }}
                              className={`py-1 px-2.5 rounded-full text-[9px] font-bold border whitespace-nowrap transition-all ${
                                writeupLocation === loc 
                                  ? 'bg-rose-500 text-white border-rose-500' 
                                  : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10'
                              }`}
                            >
                              {loc}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 3. Multi-Choice Poll (Toggle & Inline Expand) */}
                      <div className="border-t border-white/5 pt-3">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <HelpCircle className="w-4 h-4 text-pink-500" />
                            <span className="text-xs font-bold text-white">Include Interactive Poll</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={writeupPollEnabled}
                            onChange={e => setWriteupPollEnabled(e.target.checked)}
                            className="w-4 h-4 accent-pink-500 cursor-pointer"
                          />
                        </div>

                        {writeupPollEnabled && (
                          <div className="flex flex-col gap-2.5 mt-3 p-3 bg-white/5 rounded-2xl border border-white/5 animate-in slide-in-from-top-2 duration-255 duration-200">
                            <div>
                              <label className="text-5xs uppercase tracking-wider font-mono text-gray-400 block mb-1">Poll Question</label>
                              <input
                                type="text"
                                required
                                value={writeupPollQuestion}
                                onChange={e => setWriteupPollQuestion(e.target.value)}
                                placeholder="Ex: Release tomorrow?"
                                className="w-full bg-neutral-900 border border-white/10 focus:border-pink-500 outline-none p-2 rounded-lg text-xs text-white"
                              />
                            </div>

                            <div className="flex flex-col gap-1.5">
                              <label className="text-5xs uppercase tracking-wider font-mono text-gray-400 block mb-0.5">Poll Outcomes</label>
                              {writeupPollOptions.map((opt, oIdx) => (
                                <div key={oIdx} className="flex gap-1.5 items-center">
                                  <input
                                    type="text"
                                    required
                                    value={opt}
                                    onChange={e => handleUpdatePollOption(oIdx, e.target.value)}
                                    placeholder={`Option ${oIdx + 1}`}
                                    className="flex-grow bg-neutral-900 border border-white/10 outline-none p-1.5 px-2.5 rounded-lg text-xs text-white"
                                  />
                                  {writeupPollOptions.length > 2 && (
                                    <button 
                                      type="button" 
                                      onClick={() => handleDeletePollOption(oIdx)}
                                      className="text-red-400 p-1 hover:text-red-300 font-bold"
                                    >
                                      ×
                                    </button>
                                  )}
                                </div>
                              ))}

                              {writeupPollOptions.length < 4 && (
                                <button
                                  type="button"
                                  onClick={handleAddPollOption}
                                  className="mt-1 py-1 px-2.5 border border-dashed border-white/10 text-gray-400 hover:text-white rounded-lg text-4xs hover:bg-white/5 cursor-pointer font-semibold transition-colors"
                                >
                                  + Add Custom Outcome
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 4. Scheduled Publishing (Toggle & Inline Expand) */}
                      <div className="border-t border-white/5 pt-3">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-indigo-400" />
                            <span className="text-xs font-bold text-white">Scheduled Publishing</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={writeupScheduled}
                            onChange={e => setWriteupScheduled(e.target.checked)}
                            className="w-4 h-4 accent-indigo-500 cursor-pointer"
                          />
                        </div>

                        {writeupScheduled && (
                          <div className="flex flex-col gap-2 mt-3 p-3 bg-white/5 rounded-2xl border border-white/5 animate-in slide-in-from-top-2 duration-200">
                            <input
                              type="datetime-local"
                              value={writeupScheduleTime}
                              onChange={e => setWriteupScheduleTime(e.target.value)}
                              className="w-full bg-neutral-900 border border-white/10 text-white p-2 text-xs rounded-lg outline-none font-mono"
                            />
                            <span className="text-[10px] text-gray-500 leading-normal">
                              Post remains buffered in offline staging queue until specified timestamp handshake.
                            </span>
                          </div>
                        )}
                      </div>

                    </div>

                    {/* Publish Action button */}
                    <button
                      type="button"
                      onClick={handlePublishWriteup}
                      disabled={!writeupText.trim()}
                      className="w-full py-3.5 bg-gradient-to-r from-blue-500 to-cyan-500 disabled:from-blue-900/40 disabled:to-cyan-900/40 disabled:text-gray-600 text-white font-bold text-xs rounded-2xl shadow-xl active:scale-95 transition-all outline-none border border-cyan-400/20"
                    >
                      {writeupScheduled ? 'Schedule WriteUp Post' : 'Publish WriteUp Now'}
                    </button>

                  </div>

                </div>
              )}

          {/* ======================================= */}
          {activeWorkspace === 'video' && (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 text-left">
              
              {/* Left Column: Upload Video Thumbnail & Playlists (2/5 width on desktop) */}
              <div className="md:col-span-2 flex flex-col gap-4">
                
                {/* Upload Video Thumbnail */}
                <div className="bg-[#0b0c16]/30 border border-white/5 p-5 rounded-3xl flex flex-col gap-4">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Upload Video Thumbnail</span>
                  
                  <div className="aspect-video w-full rounded-2xl overflow-hidden border border-white/10 relative group bg-neutral-950 shadow-inner flex items-center justify-center">
                    {videoThumbnailUrl ? (
                      <img src={videoThumbnailUrl} className="w-full h-full object-cover select-none" alt="Thumbnail video cover" />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-gray-500">
                        <Image className="w-8 h-8 text-gray-600 animate-pulse" />
                        <span className="text-[10px] font-mono uppercase tracking-widest">No Thumbnail Selected</span>
                      </div>
                    )}
                    {videoThumbnailUrl && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none group-hover:bg-black/50 transition-colors z-10">
                        <div className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                          <Play className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    )}
                    <span className="absolute bottom-2 right-2 bg-black/70 text-[9px] font-mono text-white p-1 rounded font-bold z-10">
                      12:35
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <label className="flex-grow py-2.5 px-3 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-center text-xs rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-md">
                      <Upload className="w-4 h-4" />
                      <span>{videoThumbnailUrl ? 'Replace Thumbnail' : 'Choose Thumbnail'}</span>
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/png, image/jpeg, image/webp" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const url = URL.createObjectURL(file);
                            setVideoThumbnailUrl(url);
                          }
                        }}
                      />
                    </label>
                    {videoThumbnailUrl && (
                      <button
                        type="button"
                        onClick={() => setVideoThumbnailUrl('')}
                        className="py-2.5 px-4 bg-red-500/10 hover:bg-red-500/20 active:scale-95 text-red-400 border border-red-500/20 font-bold text-xs rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Playlist Assignments */}
                <div className="bg-[#0b0c16]/30 border border-white/5 p-4 rounded-3xl flex flex-col gap-3">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400 flex items-center gap-1.5 border-b border-white/5 pb-2">
                    <FileText className="w-4 h-4 text-cyan-400" /> Playlist Association
                  </span>

                  <select
                    value={videoPlaylist}
                    onChange={e => setVideoPlaylist(e.target.value)}
                    className="w-full bg-neutral-900 border border-white/10 text-white rounded-lg text-xs p-2 outline-none font-sans"
                  >
                    <option value="Featured Series">Featured Core Series</option>
                    <option value="Advanced Tutorials">Advanced Tutorials Node</option>
                    <option value="Creator Vlog Streams">Creator Vlog Streams</option>
                  </select>
                </div>

              </div>

              {/* Right Column: Main Metadata Forms (3/5 width on desktop) */}
              <div className="md:col-span-3 flex flex-col gap-4">
                
                <div className="bg-[#0b0c16]/30 border border-white/5 rounded-3xl p-5 flex flex-col gap-4">
                  
                  {videoUploadState !== 'idle' ? (
                    <div className="flex flex-col items-center justify-center p-10 text-center gap-4">
                      
                      {videoUploadState === 'hashing' && (
                        <div className="flex flex-col items-center gap-2">
                          <RefreshCw className="w-10 h-10 text-cyan-400 animate-spin" />
                          <h4 className="text-sm font-sub font-black text-white uppercase">Hashing binary streams</h4>
                          <p className="text-5xs font-mono text-gray-500">CHECKSUM LOCK SHA-256 INITIALIZED</p>
                        </div>
                      )}

                      {videoUploadState === 'uploading' && (
                        <div className="flex flex-col items-center gap-3.5 w-full">
                          <div className="relative w-12 h-12 bg-neutral-900 rounded-full flex items-center justify-center border border-indigo-400/20">
                            <ArrowLeft className="w-6 h-6 text-indigo-400 rotate-90" />
                          </div>
                          
                          <div className="w-full">
                            <div className="flex justify-between items-center text-5xs font-mono text-gray-400 mb-1">
                              <span>CYBER ASSET STREAM SYNC</span>
                              <span>{uploadPercent}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-neutral-950 rounded-full overflow-hidden border border-white/5 flex">
                              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-100" style={{ width: `${uploadPercent}%` }}></div>
                            </div>
                          </div>
                          <span className="text-5xs font-mono text-indigo-300">DATA RATE SIMULATION: 12.4 MB/S PACKETS</span>
                        </div>
                      )}

                      {videoUploadState === 'multiplexing' && (
                        <div className="flex flex-col items-center gap-2">
                          <Sparkles className="w-10 h-10 text-pink-400 animate-bounce" />
                          <h4 className="text-sm font-sub font-black text-white uppercase">Multiplexing video codecs</h4>
                          <p className="text-5xs font-mono text-gray-400">FINISHING HANDSHAKES ON REVENUE TRACKING TIERS</p>
                        </div>
                      )}

                      {videoUploadState === 'finishing' && (
                        <div className="flex flex-col items-center gap-2">
                          <Check className="w-10 h-10 text-emerald-400 animate-pulse" />
                          <h4 className="text-sm font-sub font-black text-emerald-400 uppercase">Synchronized Completed!</h4>
                          <span className="text-[10px] text-gray-500 font-mono">NODE COMPILED WITH CERTIFIED STATUS</span>
                        </div>
                      )}

                    </div>
                  ) : (
                    <form onSubmit={startVideoUpload} className="flex flex-col gap-4">
                      
                      {/* Video Title */}
                      <div className="text-left select-none relative">
                        <label className="text-[10px] uppercase font-mono text-gray-400 block mb-1">Video Header Title</label>
                        <input
                          type="text"
                          required
                          value={videoTitle}
                          onChange={e => setVideoTitle(e.target.value)}
                          placeholder="Ex: Complete Flutter Framework Lessons"
                          className="w-full py-2.5 px-3 bg-white/5 border border-white/10 rounded-xl focus:border-indigo-500 outline-none text-xs text-white"
                        />
                      </div>

                      {/* Video description */}
                      <div>
                        <label className="text-[10px] uppercase font-mono text-gray-400 block mb-1">Video description metadata</label>
                        <textarea
                          rows={4}
                          value={videoDescription}
                          onChange={e => setVideoDescription(e.target.value)}
                          placeholder="Input structured summaries, time-indexes, credits parameters..."
                          className="w-full bg-white/5 border border-white/10 focus:border-indigo-500 text-xs py-3 px-4 rounded-2xl outline-none text-white leading-relaxed resize-none"
                        />
                      </div>

                      {/* Add Hashtags */}
                      <div className="flex flex-col gap-2 select-none">
                        <label className="text-[10px] uppercase font-mono text-gray-400 block mb-1">Add Hashtags</label>
                        
                        {/* Hashtag chips */}
                        <div className="flex flex-wrap gap-1.5 mb-1 animate-in fade-in duration-200">
                          {videoHashtags.map(tag => (
                            <div 
                              key={tag} 
                              className="flex items-center gap-1 bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs py-1 px-2.5 rounded-full font-sans font-medium transition-all hover:bg-indigo-500/20"
                            >
                              <span>{tag}</span>
                              <button 
                                type="button" 
                                onClick={() => setVideoHashtags(videoHashtags.filter(t => t !== tag))} 
                                className="text-indigo-400 hover:text-white cursor-pointer ml-1 text-xs focus:outline-none flex items-center justify-center w-3.5 h-3.5 rounded-full hover:bg-white/10"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>

                        {/* Hashtag input */}
                        <input
                          type="text"
                          value={hashtagInput}
                          onChange={e => setHashtagInput(e.target.value)}
                          onKeyDown={handleHashtagKeyDown}
                          onBlur={() => addHashtag()}
                          placeholder="Enter hashtags (e.g. #tech #coding #react)"
                          className="w-full py-2.5 px-3 bg-white/5 border border-white/10 rounded-xl focus:border-indigo-500 outline-none text-xs text-white placeholder-gray-500"
                        />
                      </div>

                      {/* Publish button */}
                      <button
                        type="submit"
                        className="py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-2xl outline-none shadow-xl cursor-pointer mt-2"
                      >
                        Publish Widescreen TV Video
                      </button>

                    </form>
                  )}

                </div>

              </div>

            </div>
          )}

            </>
          )}

        </div>
      )}

      {/* ======================================= */}
      {/* E. 24H INSTAGRAM-STYLE STORY WORKSPACE */}
      {/* ======================================= */}
      {activeWorkspace === 'stories' && (
        <StoryWorkspace
          users={users}
          currentUser={currentUser}
          addStory={addStory}
          triggerSuccessParty={triggerSuccessParty}
          triggerHaptic={triggerHaptic}
          initialMedia={undefined}
          onClose={() => {
            triggerHaptic('light');
            if (initialWorkspace !== 'hub' && onClose) {
              onClose();
            } else {
              setActiveWorkspace('hub');
            }
          }}
        />
      )}

      {activeWorkspace === 'post' && (
        <PostWorkspace
          users={users}
          currentUser={currentUser}
          addPost={addPost}
          triggerSuccessParty={triggerSuccessParty}
          triggerHaptic={triggerHaptic}
          initialMedia={undefined}
          onClose={() => {
            triggerHaptic('light');
            if (initialWorkspace !== 'hub' && onClose) {
              onClose();
            } else {
              setActiveWorkspace('hub');
            }
          }}
        />
      )}

      {activeWorkspace === 'clips' && (
        <ReelWorkspace
          users={users}
          currentUser={currentUser}
          addReel={addReel}
          triggerSuccessParty={triggerSuccessParty}
          triggerHaptic={triggerHaptic}
          initialVideoUrl={undefined}
          onClose={() => {
            triggerHaptic('light');
            if (initialWorkspace !== 'hub' && onClose) {
              onClose();
            } else {
              setActiveWorkspace('hub');
            }
          }}
        />
      )}

    </div>
  );

  // Helper renderer selector
  function activeWORKSPACE_RENDERER(workspace: typeof activeWorkspace) {
    return activeWorkspace === workspace;
  }
};
export default CreateHub;
