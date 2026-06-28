/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useConnectX, useSearchHistory } from '../utils/stateManager';
import { useHapticFeedback } from '../hooks/useHapticFeedback';
import { FeedPost, Story, StoryViewer, MiniUser, ConnectXUser, PostComment } from '../types';
import { UnifiedSocialActionBar } from './UnifiedSocialActionBar';
import { CommentItem } from './CommentItem';
import { PostInsightsModal } from './PostInsightsModal';
import { PostPromotionModal } from './PostPromotionModal';
import { SkeletonLoader, EmptyState, ErrorState } from './StateFeedback';
import { StoryAvatar } from './StoryAvatar';
import { 
  Heart, MessageCircle, Share2, Search, Bell, Plus, Vote, 
  Send, Smile, ThumbsUp, Laugh, AlertCircle, X, ChevronRight,
  Eye, CornerDownRight, ExternalLink, Check, SlidersHorizontal, ShieldCheck,
  Link2, RefreshCw, Layers, Fingerprint, Network, QrCode, Sparkles, Zap, Calendar, MapPin, Users, ChevronDown, ArrowUpDown,
  Flag, AlertTriangle, ShieldAlert
} from 'lucide-react';
import { MOCK_AVATARS, MOCK_IMAGES } from '../utils/mockData';

const APP_START_TIME = Date.now();

const getCommentCreationTime = (comm: PostComment): number => {
  if (comm.id && comm.id.startsWith('comm_')) {
    const tsStr = comm.id.split('_')[1];
    if (tsStr) {
      const tsNum = parseInt(tsStr, 10);
      if (!isNaN(tsNum)) return tsNum;
    }
  }
  
  if (comm.timestamp) {
    const parsed = Date.parse(comm.timestamp);
    if (!isNaN(parsed)) return parsed;
    
    const tsLower = comm.timestamp.toLowerCase();
    if (tsLower.endsWith('h ago')) {
      const h = parseInt(tsLower.split('h')[0], 10);
      if (!isNaN(h)) return APP_START_TIME - h * 60 * 60 * 1000;
    } else if (tsLower.endsWith('m ago')) {
      const m = parseInt(tsLower.split('m')[0], 10);
      if (!isNaN(m)) return APP_START_TIME - m * 60 * 1000;
    } else if (tsLower.endsWith('s ago')) {
      const s = parseInt(tsLower.split('s')[0], 10);
      if (!isNaN(s)) return APP_START_TIME - s * 1000;
    } else if (tsLower.endsWith('d ago')) {
      const d = parseInt(tsLower.split('d')[0], 10);
      if (!isNaN(d)) return APP_START_TIME - d * 24 * 60 * 60 * 1000;
    } else if (tsLower === 'just now') {
      return APP_START_TIME;
    }
  }
  
  return APP_START_TIME;
};

const getRelativeTimeString = (creationTime: number, now: number): string => {
  const diffMs = now - creationTime;
  if (diffMs < 1000) {
    return 'Just now';
  }
  const diffSecs = Math.floor(diffMs / 1000);
  if (diffSecs < 60) {
    return `${diffSecs}s ago`;
  }
  const diffMins = Math.floor(diffSecs / 60);
  if (diffMins < 60) {
    return `${diffMins}m ago`;
  }
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

const TRENDING_TOPICS = [
  { tag: '#ConnectXVibe', count: '142.5k vibes', type: 'Vibe Match', isHot: true },
  { tag: '#LiquidGlass', count: '98.3k posts', type: 'UI Artistry', isHot: true },
  { tag: '#CreatorCoin', count: '64.1k hubs', type: 'Token Economy', isHot: false },
  { tag: '#Web3Atmosphere', count: '45.8k streams', type: 'Ambient Node', isHot: false },
  { tag: '#NextGenVlogs', count: '32.4k vlogs', type: 'Pro Output', isHot: false }
];

const POPULAR_SEARCH_TOPICS = [
  { term: 'UI/UX Design', count: '12k queries', type: 'Design & Craft', isHot: true },
  { term: 'Web3 Ecosystem', count: '9k queries', type: 'Technology', isHot: true },
  { term: 'React Components', count: '15k queries', type: 'Development', isHot: true },
  { term: 'Tailwind Styling', count: '8k queries', type: 'Frontend', isHot: false },
  { term: 'NextJS Server Side', count: '7k queries', type: 'Architecture', isHot: false },
  { term: 'Creator Economy', count: '11k queries', type: 'Business Model', isHot: true },
  { term: 'Generative AI Tools', count: '24k queries', type: 'Automation', isHot: true },
  { term: 'Interactive Prototypes', count: '5k queries', type: 'UX Research', isHot: false },
  { term: 'Digital Nomad Life', count: '6k queries', type: 'Vibe & Community', isHot: false },
  { term: 'Vlogging Hardware', count: '8k queries', type: 'Media Production', isHot: false },
  { term: 'Tokenomics Design', count: '4k queries', type: 'Fintech', isHot: false },
  { term: 'Motion Design 101', count: '10k queries', type: 'Animation', isHot: true }
];

// Shared CommentItem is now imported from './CommentItem'

interface HomeFeedProps {
  onOpenCreateMenu: () => void;
  onSelectUserTab: (tab: string) => void;
  onSearchQuery: (query: string) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export const HomeFeed: React.FC<HomeFeedProps> = ({ 
  onOpenCreateMenu, 
  onSelectUserTab, 
  onSearchQuery,
  searchQuery,
  onSearchChange
}) => {
  const { 
    currentUser, posts, stories, users, toggleReaction, voteInPoll, addComment, toggleLikeComment, flagComment, selectChatUser, updatePostStats, setViewedUserId
  } = useConnectX();

  const [search, setSearch] = useState(searchQuery || '');
  const { searches: recentSearches, addSearch, removeSearch, clearAll } = useSearchHistory();
  const [showDesktopDropdown, setShowDesktopDropdown] = useState(false);
  const [showMobileDropdown, setShowMobileDropdown] = useState(false);
  const desktopSearchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);

  // Real-time completions based on popular hashtags (dynamic from posts) and trending topics
  const searchSuggestions = React.useMemo(() => {
    const trimmed = search.trim().toLowerCase();
    if (!trimmed) return [];

    const queryWithoutHash = trimmed.startsWith('#') ? trimmed.slice(1) : trimmed;

    // 1. Compile all hashtags from posts dynamically
    const postHashtagMap = new Map<string, { count: number; original: string }>();
    posts.forEach(post => {
      if (post.hashtags) {
        post.hashtags.forEach(tag => {
          const cleanedText = tag.startsWith('#') ? tag.slice(1) : tag;
          const lower = cleanedText.toLowerCase();
          if (postHashtagMap.has(lower)) {
            postHashtagMap.get(lower)!.count += 1;
          } else {
            postHashtagMap.set(lower, { count: 1, original: tag.startsWith('#') ? tag : `#${tag}` });
          }
        });
      }
    });

    const suggestionsList: Array<{ tag: string; count: string; type: string; isHot: boolean; score: number }> = [];

    // Add trending topics that match
    TRENDING_TOPICS.forEach(topic => {
      const topicLower = topic.tag.toLowerCase();
      const topicWithoutHash = topicLower.startsWith('#') ? topicLower.slice(1) : topicLower;
      
      // Calculate matching score (starts with is higher than includes)
      let score = -1;
      if (topicWithoutHash.startsWith(queryWithoutHash) || topicLower.startsWith(trimmed)) {
        score = 10;
      } else if (topicLower.includes(trimmed) || topicWithoutHash.includes(queryWithoutHash)) {
        score = 5;
      }

      if (score > 0) {
        suggestionsList.push({
          tag: topic.tag,
          count: topic.count,
          type: topic.type,
          isHot: topic.isHot,
          score
        });
      }
    });

    // Add popular search topics that match (predictive keyword completions)
    POPULAR_SEARCH_TOPICS.forEach(topic => {
      const termLower = topic.term.toLowerCase();
      let score = -1;
      if (termLower.startsWith(trimmed)) {
        score = 9;
      } else if (termLower.includes(trimmed)) {
        score = 4.5;
      }

      if (score > 0) {
        suggestionsList.push({
          tag: topic.term,
          count: topic.count,
          type: topic.type,
          isHot: topic.isHot,
          score
        });
      }
    });

    // Add post hashtags that match (if not already included as a trending topic)
    postHashtagMap.forEach((data, lowerName) => {
      const lowerWithHash = `#${lowerName}`;
      if (suggestionsList.some(item => item.tag.toLowerCase() === lowerWithHash || item.tag.toLowerCase() === data.original.toLowerCase())) {
        return;
      }

      let score = -1;
      if (lowerName.startsWith(queryWithoutHash) || lowerWithHash.startsWith(trimmed)) {
        score = 8;
      } else if (lowerName.includes(queryWithoutHash) || lowerWithHash.includes(trimmed)) {
        score = 4;
      }

      if (score > 0) {
        suggestionsList.push({
          tag: data.original,
          count: `${data.count} post${data.count > 1 ? 's' : ''}`,
          type: 'Popular Hashtag',
          isHot: data.count > 1,
          score
        });
      }
    });

    // Sort by matching score (relevance) first, then by whether they are hot, then alphabetically
    return suggestionsList.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.isHot !== a.isHot) return (b.isHot ? 1 : 0) - (a.isHot ? 1 : 0);
      return a.tag.localeCompare(b.tag);
    });
  }, [search, posts]);

  const addRecentSearch = (query: string) => {
    addSearch(query);
  };

  const handleRecentSearchClick = (query: string) => {
    updateSearchValue(query);
    onSearchQuery(query);
    addRecentSearch(query);
    showToast(`Filtering feed for: "${query}"`, "info");
    setShowDesktopDropdown(false);
    setShowMobileDropdown(false);
  };

  const removeRecentSearch = (e: React.MouseEvent, query: string) => {
    e.stopPropagation();
    removeSearch(query);
  };

  const clearAllRecentSearches = (e: React.MouseEvent) => {
    e.stopPropagation();
    clearAll();
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (desktopSearchRef.current && !desktopSearchRef.current.contains(e.target as Node)) {
        setShowDesktopDropdown(false);
      }
      if (mobileSearchRef.current && !mobileSearchRef.current.contains(e.target as Node)) {
        setShowMobileDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  const [filter, setFilter] = useState<'All' | 'Posts' | 'Images' | 'Reels' | 'Videos'>('All');
  const [feedState, setFeedState] = useState<'loading' | 'error' | 'success'>('success');
  const [errorMessage, setErrorMessage] = useState('');

  // Expose window hook for Behance showcase
  useEffect(() => {
    (window as any).overrideHomeFeedFilter = (newFilter: 'All' | 'Posts' | 'Images' | 'Reels' | 'Videos') => {
      setFilter(newFilter);
    };
    (window as any).resetHomeFeed = () => {
      setInsightsPost(null);
      setPromotionPost(null);
      setActiveSharePost(null);
      setSharePreviewPost(null);
    };
    return () => {
      delete (window as any).overrideHomeFeedFilter;
      delete (window as any).resetHomeFeed;
    };
  }, []);

  
  // Interactive insights & promotion dashboard states
  const [insightsPost, setInsightsPost] = useState<FeedPost | null>(null);
  const [insightsType, setInsightsType] = useState<'writeup' | 'post'>('post');
  const [promotionPost, setPromotionPost] = useState<FeedPost | null>(null);
  const [promotionType, setPromotionType] = useState<'writeup' | 'post'>('post');

  const triggerHaptic = useHapticFeedback();

  // Quick Share configurations and temporary selections
  const [activeSharePost, setActiveSharePost] = useState<FeedPost | null>(null);
  const [sharePreviewPost, setSharePreviewPost] = useState<FeedPost | null>(null);
  const [shareClipboardCopied, setShareClipboardCopied] = useState(false);
  const [shareConfig, setShareConfig] = useState({
    includeSignature: true,
    hifiGlassRefraction: true,
    includeTelemetry: false,
    shortenLink: false
  });
  
  // Toast notifications for liquid share actions
  const [activeToast, setActiveToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Pull-to-refresh mechanism states & parameters
  const [pullY, setPullY] = useState<number>(0);
  const [isPulling, setIsPulling] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const startTouchY = useRef<number>(0);
  const isAtTopRef = useRef<boolean>(true);

  // Touch handlers for the pull-to-refresh gesture
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isRefreshing) return;
    
    // Check if the primary viewport containment is at the top
    const scrollContainer = document.querySelector('main') || document.documentElement;
    const isAtTop = scrollContainer.scrollTop <= 2;
    isAtTopRef.current = isAtTop;
    
    if (isAtTop) {
      startTouchY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isRefreshing || !isPulling || !isAtTopRef.current) return;
    
    const currentY = e.touches[0].clientY;
    const diffY = currentY - startTouchY.current;
    
    if (diffY > 1) {
      // Pull down gesture
      const resistance = 0.45;
      const dragY = Math.min(diffY * resistance, 95); // Cap at 95px displacement
      setPullY(dragY);
      
      // Prevent browser default scroll behaviors when dragging past 5px limit
      if (dragY > 5 && e.cancelable) {
        e.preventDefault();
      }
    } else {
      setPullY(0);
    }
  };

  const handleTouchEnd = () => {
    if (isRefreshing || !isPulling) return;
    setIsPulling(false);
    
    if (pullY >= 65) {
      triggerLiquidRefresh();
    } else {
      setPullY(0);
    }
  };

  const triggerLiquidRefresh = () => {
    setIsRefreshing(true);
    setPullY(65); // Lock pull visual position during refreshing stage
    triggerHaptic('medium');
    setFeedState('loading');
    
    setTimeout(() => {
      setFeedState('success');
      setIsRefreshing(false);
      setPullY(0);
      triggerHaptic('success');
      showToast("Feed successfully synced & decrypted! 📡", "success");
    }, 1300);
  };

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setActiveToast({ message, type });
    setTimeout(() => {
      setActiveToast((current) => current && current.message === message ? null : current);
    }, 4000);
  };

  useEffect(() => {
    if (searchQuery !== undefined && searchQuery !== search) {
      setSearch(searchQuery);
      if (searchQuery) {
        showToast(`Filtering feed for: "${searchQuery}"`, "info");
      }
    }
  }, [searchQuery]);

  const updateSearchValue = (value: string) => {
    setSearch(value);
    if (onSearchChange) {
      onSearchChange(value);
    }
  };

  const generateDynamicLink = (post: FeedPost) => {
    const baseUrl = `https://connectx.app/share/posts/${post.id}`;
    const params: string[] = [];
    
    if (currentUser) {
      params.push(`ref=${currentUser.username}`);
    }
    if (shareConfig.includeSignature) {
      params.push(`sign=liquid_signature_${post.user.username}`);
    }
    if (shareConfig.hifiGlassRefraction) {
      params.push(`layer=visionos_high_index`);
    }
    if (shareConfig.includeTelemetry) {
      params.push(`telemetry=iphone17_pro_specular_v2`);
    }
    if (shareConfig.shortenLink) {
      params.push(`short=1`);
    }
    
    const queryStr = params.length > 0 ? `?${params.join('&')}` : '';
    return `${baseUrl}${queryStr}`;
  };

  const handleQuickShare = (post: FeedPost) => {
    triggerHaptic('medium');
    setSharePreviewPost(post);
  };

  const executeSharingDialog = (post: FeedPost) => {
    triggerHaptic('medium');
    setSharePreviewPost(null);
    const targetLink = generateDynamicLink(post);
    
    if (navigator.share) {
      navigator.share({
        title: `ConnectX Post by @${post.user.username}`,
        text: post.content ? (post.content.length > 120 ? `${post.content.substring(0, 117)}...` : post.content) : 'Check out this post on ConnectX!',
        url: targetLink,
      })
      .then(() => {
        triggerHaptic('success');
        updatePostStats(post.id, { shares: (post.shares || 0) + 1 });
        showToast("Shared successfully with Dynamic Link!");
      })
      .catch((error) => {
        // If aborted or failed (e.g. in sandbox/iframe environments), fallback to custom Liquid Link Hub
        console.log('Native share dismissed or failed, fallback to Liquid Link Hub:', error);
        setActiveSharePost(post);
        setShareClipboardCopied(false);
        if (navigator.clipboard) {
          navigator.clipboard.writeText(targetLink)
            .then(() => {
              setShareClipboardCopied(true);
              triggerHaptic('success');
              updatePostStats(post.id, { shares: (post.shares || 0) + 1 });
              showToast("Link in clipboard! Specular route customizing.");
              setTimeout(() => setShareClipboardCopied(false), 3000);
            })
            .catch(() => {
              setShareClipboardCopied(false);
              showToast("Specular parameter route loaded.", "info");
            });
        }
      });
    } else {
      // Fallback for browsers/iframes without navigator.share
      setActiveSharePost(post);
      setShareClipboardCopied(false);
      
      if (navigator.clipboard) {
        navigator.clipboard.writeText(targetLink)
          .then(() => {
            setShareClipboardCopied(true);
            triggerHaptic('success');
            updatePostStats(post.id, { shares: (post.shares || 0) + 1 });
            showToast("Copied to clipboard! Customizing spatial layers.");
            setTimeout(() => setShareClipboardCopied(false), 3000);
          })
          .catch(() => {
            setShareClipboardCopied(false);
            showToast("Spatial layers initialized.", "info");
          });
      }
    }
  };

  const handleToggleOption = (key: keyof typeof shareConfig) => {
    triggerHaptic('light');
    const updatedConfig = { ...shareConfig, [key]: !shareConfig[key] };
    setShareConfig(updatedConfig);
    setShareClipboardCopied(false);
    
    if (activeSharePost) {
      const targetLink = generateDynamicLink(activeSharePost);
      if (navigator.clipboard) {
         navigator.clipboard.writeText(targetLink)
          .then(() => {
            setShareClipboardCopied(true);
            triggerHaptic('success');
            setTimeout(() => setShareClipboardCopied(false), 3000);
          });
      }
    }
  };
  
  // Reaction picker state
  const [hoveredPostId, setHoveredPostId] = useState<string | null>(null);
  
  // Comment modal state (using ID-driven state for real-time reactivity)
  const [commentingPostId, setCommentingPostId] = useState<string | null>(null);
  const [newCommentText, setNewCommentText] = useState('');
  const [connectionsOnly, setConnectionsOnly] = useState(false);
  const [commentSort, setCommentSort] = useState<'newest' | 'oldest' | 'mostLiked'>('newest');
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);

  // Derived comment post from the central posts list to keep likes/replies updated instantly
  const commentingPost = useMemo(() => {
    if (!commentingPostId) return null;
    return posts.find(p => p.id === commentingPostId) || null;
  }, [posts, commentingPostId]);

  const setCommentingPost = (post: FeedPost | null) => {
    setCommentingPostId(post ? post.id : null);
  };

  // Custom Dynamic Quick Reaction Menu and Animating Floating Emojis States
  const [activeReactionPostId, setActiveReactionPostId] = useState<string | null>(null);
  const [floatingEmojis, setFloatingEmojis] = useState<{ [postId: string]: Array<{ id: string; emoji: string; x: number; delay: number; duration: number }> }>({});

  const longPressTimer = useRef<any>(null);
  const longPressTriggered = useRef(false);
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);

  const isInteractiveElement = (el: HTMLElement | null): boolean => {
    if (!el) return false;
    const tagName = el.tagName.toLowerCase();
    if (['button', 'a', 'input', 'select', 'textarea', 'option'].includes(tagName)) {
      return true;
    }
    if (el.closest('button') || el.closest('a') || el.closest('input')) {
      return true;
    }
    return false;
  };

  const startLongPress = (e: React.MouseEvent | React.TouchEvent, postId: string) => {
    if ('button' in e && e.button !== 0) return;

    const target = e.target as HTMLElement;
    if (isInteractiveElement(target)) {
      return;
    }

    if ('touches' in e && e.touches[0]) {
      touchStartPos.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
    } else if ('clientX' in e) {
      touchStartPos.current = {
        x: e.clientX,
        y: e.clientY
      };
    }

    longPressTriggered.current = false;
    
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }

    longPressTimer.current = setTimeout(() => {
      longPressTriggered.current = true;
      triggerHaptic('heavy');
      setActiveReactionPostId(postId);
    }, 500);
  };

  const cancelLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleTouchMoveLocal = (e: React.TouchEvent) => {
    if (!touchStartPos.current || !e.touches[0]) return;
    const currX = e.touches[0].clientX;
    const currY = e.touches[0].clientY;
    const dist = Math.hypot(currX - touchStartPos.current.x, currY - touchStartPos.current.y);
    
    if (dist > 10) {
      cancelLongPress();
    }
  };

  const handleMouseUpLocal = (e: React.MouseEvent) => {
    if (longPressTriggered.current) {
      e.preventDefault();
      e.stopPropagation();
    }
    cancelLongPress();
  };

  const triggerEmojiAnimation = (postId: string, emoji: string) => {
    const count = 6;
    const newEmojis = Array.from({ length: count }).map((_, idx) => ({
      id: `${postId}_emoji_${Date.now()}_${idx}_${Math.random()}`,
      emoji,
      x: (Math.random() - 0.5) * 80,
      delay: idx * 0.05,
      duration: 1 + Math.random() * 0.8
    }));

    setFloatingEmojis(prev => ({
      ...prev,
      [postId]: [...(prev[postId] || []), ...newEmojis]
    }));

    setTimeout(() => {
      setFloatingEmojis(prev => {
        const current = prev[postId] || [];
        const idsToRemove = new Set(newEmojis.map(e => e.id));
        return {
          ...prev,
          [postId]: current.filter(e => !idsToRemove.has(e.id))
        };
      });
    }, 3000);
  };

  // Group active stories by user, uniquely
  const uniqueUsersWithStories = React.useMemo(() => {
    const userMap: { [userId: string]: { user: any; hasUnviewed: boolean; latestStoryCreatedAt: number } } = {};
    
    stories.forEach(story => {
      const uId = story.user.id;
      const hasUnviewed = !story.viewers.some(v => v.userId === currentUser?.id);
      
      if (!userMap[uId]) {
        userMap[uId] = {
          user: story.user,
          hasUnviewed: hasUnviewed,
          latestStoryCreatedAt: story.createdAt || 0
        };
      } else {
        if (hasUnviewed) {
          userMap[uId].hasUnviewed = true;
        }
        if ((story.createdAt || 0) > userMap[uId].latestStoryCreatedAt) {
          userMap[uId].latestStoryCreatedAt = story.createdAt || 0;
        }
      }
    });

    return Object.values(userMap).sort((a, b) => {
      if (a.hasUnviewed && !b.hasUnviewed) return -1;
      if (!a.hasUnviewed && b.hasUnviewed) return 1;
      return b.latestStoryCreatedAt - a.latestStoryCreatedAt;
    });
  }, [stories, currentUser?.id]);

  // Handle Search Input dispatch
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = search.trim();
    if (trimmed) {
      onSearchQuery(trimmed);
      addRecentSearch(trimmed);
      showToast(`Filtering feed for: "${trimmed}"`, "info");
    }
    setShowDesktopDropdown(false);
    setShowMobileDropdown(false);
  };

  // Submit Comments
  const handlePostCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentingPost || !newCommentText.trim()) return;
    addComment(commentingPost.id, newCommentText.trim());
    setNewCommentText('');
  };

  const getReactionEmoji = (type?: string) => {
    switch (type) {
      case 'love': return '💖';
      case 'laugh': return '😂';
      case 'wow': return '😮';
      case 'sad': return '😢';
      default: return '👍';
    }
  };

  // Filter posts list
  const filteredPosts = posts.filter(post => {
    // Current tab media filters
    if (filter === 'Posts') {
      if (post.mediaType !== 'text' && post.mediaType !== 'poll') return false;
    } else if (filter === 'Images') {
      if (post.mediaType !== 'image') return false;
    } else if (filter === 'Reels') {
      if (!(post.mediaType === 'video' && post.content.includes('#reel'))) return false;
    } else if (filter === 'Videos') {
      if (!(post.mediaType === 'video' && !post.content.includes('#reel'))) return false;
    }

    // Dynamic search term filtering
    const query = search.trim().toLowerCase();
    if (query) {
      const matchText = post.content.toLowerCase().includes(query);
      const matchUser = post.user.displayName.toLowerCase().includes(query) || post.user.username.toLowerCase().includes(query);
      const matchPoll = post.poll?.options?.some(opt => opt.text.toLowerCase().includes(query)) || false;
      const matchLocation = post.location?.toLowerCase().includes(query) || false;
      return matchText || matchUser || matchPoll || matchLocation;
    }

    return true;
  });

  const handleFilterChange = (tab: typeof filter) => {
    setFeedState('loading');
    setFilter(tab);
    setTimeout(() => {
      setFeedState('success');
    }, 450);
  };

  return (
    <div 
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="w-full max-w-2xl mx-auto flex flex-col gap-4 selection:bg-pink-500 pb-16 px-2 font-sans"
    >
      
      {/* LIQUID-GLASS PULL TO REFRESH SPINNER */}
      <motion.div
        style={{ height: pullY, opacity: pullY > 5 ? 1 : 0 }}
        animate={{ 
          height: isPulling ? pullY : isRefreshing ? 75 : 0,
          opacity: isPulling ? Math.min(pullY / 45, 1) : isRefreshing ? 1 : 0 
        }}
        transition={isPulling ? { type: 'just' } : { type: 'spring', damping: 22, stiffness: 200 }}
        className="w-full overflow-hidden flex items-center justify-center relative shrink-0 z-40"
      >
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {/* Glowing cyan gradient pulse backdrop */}
          <div 
            className={`absolute w-36 h-12 bg-gradient-to-r from-cyan-400/20 via-sky-500/10 to-teal-400/20 rounded-full blur-2xl transition-all duration-700 ${
              isRefreshing ? 'animate-pulse scale-125 opacity-100' : 'scale-100 opacity-70'
            }`}
          />
          <div className="absolute w-12 h-12 bg-cyan-500/10 rounded-full blur-lg animate-ping" />
        </div>

        {/* Liquid Glass Capsule structure */}
        <div 
          className="relative flex items-center gap-3 p-2 px-4 bg-gradient-to-r from-[#0a1128]/42 to-[#0e1b3d]/35 backdrop-blur-[8px] saturate-[260%] rounded-full border border-cyan-500/50 shadow-[0_12px_32px_rgba(0,0,0,0.6),0_0_20px_rgba(6,182,212,0.25),inset_0_2px_3.5px_rgba(255,255,255,0.45)] select-none transition-all duration-300"
          style={{
            transform: `scale(${Math.min(0.6 + (pullY / 140), 1)})`,
          }}
        >
          {/* Top highlight refraction line */}
          <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-300/60 to-transparent" />
          
          {/* Custom Liquid Glass Spinner Circle */}
          <div className="relative w-5 h-5 flex items-center justify-center shrink-0">
            {/* Spinning/pulsing neon tracker rings */}
            <div className={`absolute inset-0 rounded-full border-2 border-cyan-500/20 ${isRefreshing ? 'animate-ping opacity-75' : ''}`} />
            
            <div 
              className={`w-full h-full rounded-full border-2 border-transparent border-t-cyan-400 border-r-cyan-400/45 transition-transform ${isRefreshing ? 'animate-spin' : ''}`}
              style={{ 
                transform: isRefreshing ? undefined : `rotate(${pullY * 5.5}deg)` 
              }}
            >
              {/* Core specular highlight drop */}
              <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-cyan-300 rounded-full shadow-[0_0_8px_rgba(34,211,238,1)]" />
            </div>
          </div>

          <div className="flex flex-col text-left">
            <span className="text-[9.5px] font-mono font-black text-white tracking-widest leading-none">
              {isRefreshing 
                ? "SYNCING PEER DIODES" 
                : pullY >= 65 
                  ? "RELEASE TO TRANSFER" 
                  : "PULL TO DECRYPT FEED"
              }
            </span>
            <span className="text-[7.5px] font-mono font-bold text-cyan-400/85 tracking-wider mt-0.5 leading-none uppercase">
              {isRefreshing ? "RE-ESTABLISHING CRYPTO LINK" : `Displacement: ${Math.round(pullY)}px`}
            </span>
          </div>

          {/* Glowing Status Indicator Orb */}
          <div className="relative flex h-2 w-2 shrink-0">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isRefreshing ? 'bg-pink-400' : 'bg-cyan-400'}`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${isRefreshing ? 'bg-pink-500' : 'bg-cyan-500 shadow-[0_0_8px_rgba(34,211,238,1)]'}`}></span>
          </div>
        </div>
      </motion.div>

      {/* 1. TOP HEADER SECTION */}
      <div className="flex items-center justify-between gap-3 py-1.5 border-b border-white/5">
        <h1 className="text-2xl font-display font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 via-blue-500 to-pink-500 bg-clip-text text-transparent">
          ConnectX
        </h1>
        
        {/* Search bar form */}
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-xs hidden sm:block">
          <div ref={desktopSearchRef} className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
            <input
              type="text"
              placeholder="Search people, hashtags, vlogs..."
              value={search}
              onFocus={() => setShowDesktopDropdown(true)}
              onClick={() => setShowDesktopDropdown(true)}
              onChange={(e) => updateSearchValue(e.target.value)}
              className="w-full pl-8 pr-8 py-1.5 bg-neutral-900/60 border border-white/10 rounded-full text-[11px] outline-none focus:border-cyan-400 focus:bg-neutral-900 transition-all text-white font-medium"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  updateSearchValue('');
                  onSearchQuery('');
                  showToast("Search filter cleared", "info");
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-gray-500 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
            {showDesktopDropdown && (recentSearches.length > 0 || TRENDING_TOPICS.length > 0 || searchSuggestions.length > 0) && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-black/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-50 p-2 text-left overflow-hidden flex flex-col gap-2 min-w-[220px]">
                {/* Real-time Query suggestions when typing */}
                {search.trim() !== '' && (
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between px-1.5 py-0.5 border-b border-cyan-500/20">
                      <span className="text-[7.5px] font-mono font-bold text-cyan-450 uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5 text-cyan-400 animate-pulse" />
                        Query completions
                      </span>
                      <span className="text-[6.5px] font-mono text-cyan-400 uppercase tracking-widest bg-cyan-950/40 px-1 rounded-sm border border-cyan-500/15">Real-time</span>
                    </div>
                    {searchSuggestions.length > 0 ? (
                      <div className="flex flex-col gap-0.5 max-h-[160px] overflow-y-auto no-scrollbar">
                        {searchSuggestions.map((suggestion, index) => (
                          <div
                            key={index}
                            onClick={() => handleRecentSearchClick(suggestion.tag)}
                            className="group/suggest flex items-center justify-between px-2 py-1.5 hover:bg-cyan-500/10 rounded-lg cursor-pointer transition-all duration-150 relative overflow-hidden"
                          >
                            <div className="flex items-center gap-2 relative z-10 truncate">
                              {suggestion.isHot ? (
                                <Zap className="w-2.5 h-2.5 text-cyan-400 animate-pulse shrink-0" />
                              ) : (
                                <span className="text-gray-500 group-hover/suggest:text-cyan-400 transition-colors text-[9px] shrink-0 font-bold">#</span>
                              )}
                              <div className="flex flex-col truncate">
                                <span className="text-[10px] font-black tracking-tight text-white group-hover/suggest:text-cyan-400 transition-colors truncate">
                                  {suggestion.tag}
                                </span>
                                <span className="text-[7.5px] text-gray-400 leading-none">
                                  {suggestion.type}
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-col items-end relative z-10 shrink-0">
                              <span className="text-[8px] font-mono font-semibold text-gray-400 group-hover/suggest:text-white transition-colors">
                                {suggestion.count}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="px-2 py-1.5 text-center text-gray-500 text-[9px] font-mono">
                        No matches. Press Enter to search
                      </div>
                    )}
                  </div>
                )}

                {/* Recent Searches / Matches (Horizontal Scrollable Carousel) */}
                {recentSearches.length > 0 && (
                  (() => {
                    const matched = search.trim() === '' 
                      ? recentSearches 
                      : recentSearches.filter(q => q.toLowerCase().includes(search.trim().toLowerCase()));
                    if (matched.length === 0) return null;
                    return (
                      <div className="flex flex-col gap-1.5 px-1.5 py-1.5 bg-white/[0.02] rounded-lg border border-white/5">
                        <div className="flex items-center justify-between px-0.5">
                          <span className="text-[7.5px] font-mono font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                            <span>🕒</span> {search.trim() === '' ? 'Recent Searches' : 'Recent Matches'}
                          </span>
                          {search.trim() === '' && (
                            <button 
                              type="button"
                              onClick={clearAllRecentSearches}
                              className="text-[7.5px] font-mono text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
                            >
                              Clear All
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 select-none">
                          {matched.map((query, index) => (
                            <div key={index} className="flex items-center shrink-0 bg-neutral-900 border border-white/10 hover:border-cyan-400/40 rounded-full pl-2.5 pr-1.5 py-0.5 transition-all">
                              <button
                                type="button"
                                onClick={() => handleRecentSearchClick(query)}
                                className="text-white hover:text-cyan-300 text-[9px] font-medium transition-colors select-none cursor-pointer max-w-[80px] truncate"
                              >
                                {query}
                              </button>
                              <button
                                type="button"
                                onClick={(e) => removeRecentSearch(e, query)}
                                className="ml-1 p-0.5 hover:bg-white/10 rounded-full text-gray-500 hover:text-white transition-colors cursor-pointer shrink-0"
                                title="Remove search"
                              >
                                <X className="w-2 h-2" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()
                )}

                {/* Trending Topics Area (only shown when search is empty) */}
                {search.trim() === '' && (
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between px-1.5 py-0.5 border-b border-white/5">
                      <span className="text-[7.5px] font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5 text-yellow-400 animate-pulse" />
                        Trending Now
                      </span>
                      <span className="text-[6.5px] font-mono text-cyan-400 uppercase tracking-widest bg-cyan-950/40 px-1.5 py-0.5 rounded-sm border border-cyan-500/20">Vibe Hub</span>
                    </div>
                    <div className="flex flex-col gap-0.5 max-h-[180px] overflow-y-auto no-scrollbar">
                      {TRENDING_TOPICS.map((topic, index) => (
                        <div
                          key={index}
                          onClick={() => handleRecentSearchClick(topic.tag)}
                          className="group/trend flex items-center justify-between px-2 py-1 hover:bg-white/5 rounded-lg cursor-pointer transition-all duration-150 relative overflow-hidden"
                        >
                          {topic.isHot && (
                            <div className="absolute inset-0 bg-cyan-500/[0.02] group-hover/trend:bg-cyan-500/[0.05] transition-all"></div>
                          )}
                          <div className="flex items-center gap-2 relative z-10 truncate">
                            {topic.isHot ? (
                              <Zap className="w-2.5 h-2.5 text-yellow-400 animate-pulse shrink-0" />
                            ) : (
                              <span className="text-gray-600 group-hover/trend:text-cyan-400 transition-colors text-[9px] shrink-0 font-bold">#</span>
                            )}
                            <div className="flex flex-col truncate">
                              <span className="text-[10px] font-black tracking-tight text-white group-hover/trend:text-cyan-400 transition-colors truncate">
                                {topic.tag}
                              </span>
                              <span className="text-[7.5px] text-gray-450 leading-none">
                                {topic.type}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end relative z-10 shrink-0">
                            <span className="text-[8px] font-mono font-semibold text-gray-400 group-hover/trend:text-white transition-colors">
                              {topic.count}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </form>

        <div className="flex items-center gap-1.5">
          {/* Notifications link shortcut */}
          <button 
            onClick={() => onSelectUserTab('Notifications')}
            className="p-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all relative cursor-pointer"
          >
            <Bell className="w-3.5 h-3.5 text-gray-200" />
            <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-pink-500 rounded-full ring-1 ring-black animate-ping"></span>
          </button>
        </div>
      </div>

      {/* Mobile Search - Visible only below sm */}
      <form onSubmit={handleSearchSubmit} className="sm:hidden block">
        <div ref={mobileSearchRef} className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 group-focus-within:text-cyan-400 transition-colors" />
          <input
            type="text"
            placeholder="Search communities, trends..."
            value={search}
            onFocus={() => setShowMobileDropdown(true)}
            onClick={() => setShowMobileDropdown(true)}
            onChange={(e) => updateSearchValue(e.target.value)}
            className="w-full pl-8 pr-8 py-1.5 bg-neutral-900 border border-white/10 rounded-full text-[11px] outline-none focus:border-cyan-400 transition-all text-white"
          />
          {search && (
            <button
              type="button"
              onClick={() => {
                updateSearchValue('');
                onSearchQuery('');
                showToast("Search filter cleared", "info");
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-gray-500 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          )}
          {showMobileDropdown && (recentSearches.length > 0 || TRENDING_TOPICS.length > 0 || searchSuggestions.length > 0) && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-black/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-50 p-2 text-left overflow-hidden flex flex-col gap-2 min-w-[220px]">
              {/* Real-time Query suggestions when typing */}
              {search.trim() !== '' && (
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between px-1.5 py-0.5 border-b border-cyan-500/20">
                    <span className="text-[7.5px] font-mono font-bold text-cyan-450 uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5 text-cyan-400 animate-pulse" />
                      Query completions
                    </span>
                    <span className="text-[6.5px] font-mono text-cyan-400 uppercase tracking-widest bg-cyan-950/40 px-1 rounded-sm border border-cyan-500/15">Real-time</span>
                  </div>
                  {searchSuggestions.length > 0 ? (
                    <div className="flex flex-col gap-0.5 max-h-[160px] overflow-y-auto no-scrollbar">
                      {searchSuggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          onClick={() => handleRecentSearchClick(suggestion.tag)}
                          className="group/suggest flex items-center justify-between px-2 py-1.5 hover:bg-cyan-500/10 rounded-lg cursor-pointer transition-all duration-150 relative overflow-hidden"
                        >
                          <div className="flex items-center gap-2 relative z-10 truncate">
                            {suggestion.isHot ? (
                              <Zap className="w-2.5 h-2.5 text-cyan-400 animate-pulse shrink-0" />
                            ) : (
                              <span className="text-gray-500 group-hover/suggest:text-cyan-400 transition-colors text-[9px] shrink-0 font-bold">#</span>
                            )}
                            <div className="flex flex-col truncate">
                              <span className="text-[10px] font-black tracking-tight text-white group-hover/suggest:text-cyan-400 transition-colors truncate">
                                {suggestion.tag}
                              </span>
                              <span className="text-[7.5px] text-gray-400 leading-none">
                                {suggestion.type}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end relative z-10 shrink-0">
                            <span className="text-[8px] font-mono font-semibold text-gray-400 group-hover/suggest:text-white transition-colors">
                              {suggestion.count}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="px-2 py-1.5 text-center text-gray-500 text-[9px] font-mono">
                      No matches. Press Enter to search
                    </div>
                  )}
                </div>
              )}

              {/* Recent Searches / Matches (Horizontal Scrollable Carousel) */}
              {recentSearches.length > 0 && (
                (() => {
                  const matched = search.trim() === '' 
                    ? recentSearches 
                    : recentSearches.filter(q => q.toLowerCase().includes(search.trim().toLowerCase()));
                  if (matched.length === 0) return null;
                  return (
                    <div className="flex flex-col gap-1.5 px-1.5 py-1.5 bg-white/[0.02] rounded-lg border border-white/5">
                      <div className="flex items-center justify-between px-0.5">
                        <span className="text-[7.5px] font-mono font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                          <span>🕒</span> {search.trim() === '' ? 'Recent Searches' : 'Recent Matches'}
                        </span>
                        {search.trim() === '' && (
                          <button 
                            type="button"
                            onClick={clearAllRecentSearches}
                            className="text-[7.5px] font-mono text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
                          >
                            Clear All
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 select-none">
                        {matched.map((query, index) => (
                          <div key={index} className="flex items-center shrink-0 bg-neutral-900 border border-white/10 hover:border-cyan-400/40 rounded-full pl-2.5 pr-1.5 py-0.5 transition-all">
                            <button
                              type="button"
                              onClick={() => handleRecentSearchClick(query)}
                              className="text-white hover:text-cyan-300 text-[9px] font-medium transition-colors select-none cursor-pointer max-w-[80px] truncate"
                            >
                              {query}
                            </button>
                            <button
                              type="button"
                              onClick={(e) => removeRecentSearch(e, query)}
                              className="ml-1 p-0.5 hover:bg-white/10 rounded-full text-gray-500 hover:text-white transition-colors cursor-pointer shrink-0"
                              title="Remove search"
                            >
                              <X className="w-2 h-2" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()
              )}

              {/* Trending Topics Area (only shown when search is empty) */}
              {search.trim() === '' && (
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between px-1.5 py-0.5 border-b border-white/5">
                    <span className="text-[7.5px] font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5 text-yellow-400 animate-pulse" />
                      Trending Now
                    </span>
                    <span className="text-[6.5px] font-mono text-cyan-400 uppercase tracking-widest bg-cyan-950/40 px-1.5 py-0.5 rounded-sm border border-cyan-500/20">Vibe Hub</span>
                  </div>
                  <div className="flex flex-col gap-0.5 max-h-[180px] overflow-y-auto no-scrollbar">
                    {TRENDING_TOPICS.map((topic, index) => (
                      <div
                        key={index}
                        onClick={() => handleRecentSearchClick(topic.tag)}
                        className="group/trend flex items-center justify-between px-2 py-1 hover:bg-white/5 rounded-lg cursor-pointer transition-all duration-150 relative overflow-hidden"
                      >
                        {topic.isHot && (
                          <div className="absolute inset-0 bg-cyan-500/[0.02] group-hover/trend:bg-cyan-500/[0.05] transition-all"></div>
                        )}
                        <div className="flex items-center gap-2 relative z-10 truncate">
                          {topic.isHot ? (
                            <Zap className="w-2.5 h-2.5 text-yellow-400 animate-pulse shrink-0" />
                          ) : (
                            <span className="text-gray-650 group-hover/trend:text-cyan-400 transition-colors text-[9px] shrink-0 font-bold">#</span>
                          )}
                          <div className="flex flex-col truncate">
                            <span className="text-[10px] font-black tracking-tight text-white group-hover/trend:text-cyan-400 transition-colors truncate">
                              {topic.tag}
                            </span>
                            <span className="text-[7.5px] text-gray-450 leading-none">
                              {topic.type}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end relative z-10 shrink-0">
                          <span className="text-[8px] font-mono font-semibold text-gray-400 group-hover/trend:text-white transition-colors">
                            {topic.count}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </form>

      {/* 2. STORIES TRAY SECTION */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between px-1">
          <span className="text-[8.5px] font-mono font-bold uppercase tracking-wider text-gray-400">Stories</span>
          <span className="text-[7.5px] font-mono text-cyan-400">24H EPHEMERAL</span>
        </div>
        
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 px-1">
          {/* Create Own Story */}
          <div className="flex flex-col items-center shrink-0 group relative">
            <StoryAvatar userId={currentUser?.id || ''} size="md" onClickOverride={onOpenCreateMenu} />
            {uniqueUsersWithStories.every(u => u.user.id !== currentUser?.id) && (
              <div 
                onClick={onOpenCreateMenu}
                className="absolute bottom-4 right-0 w-3.5 h-3.5 bg-yellow-400 text-black border border-zinc-950 rounded-full flex items-center justify-center font-bold text-[8px] cursor-pointer pointer-events-auto shadow-md"
              >
                +
              </div>
            )}
            <span className="text-[7.5px] font-medium text-gray-500 truncate w-12 text-center mt-0.5">My Story</span>
          </div>

          {/* Render Active Stories */}
          {uniqueUsersWithStories
            .filter(item => item.user.id !== currentUser?.id)
            .map((item) => (
              <div
                key={item.user.id}
                className="flex flex-col items-center shrink-0 group"
              >
                <StoryAvatar userId={item.user.id} size="md" />
                <span className="text-[7.5px] font-semibold text-gray-300 truncate w-12 text-center mt-0.5 group-hover:text-yellow-400 transition-colors">
                  {item.user.displayName}
                </span>
              </div>
            ))}
        </div>
      </div>

      {/* 3. FEED FILTERS SECTION */}
      <div className="flex-col gap-1 flex border-b border-white/5 pb-1">
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
            {(['All', 'Posts', 'Images', 'Reels', 'Videos'] as const).map((tab) => {
              const isActive = filter === tab;
              return (
                <button
                  key={tab}
                  onClick={() => handleFilterChange(tab)}
                  className={`py-0.5 px-2.5 rounded-full text-[9px] font-bold transition-all cursor-pointer relative overflow-hidden shrink-0 ${
                    isActive 
                      ? 'bg-gradient-to-tr from-[#2563FF]/30 to-[#FF2E9A]/30 text-white border border-white/35 shadow-[0_4px_12px_rgba(37,99,255,0.25),inset_0_1px_1px_rgba(255,255,255,0.35)]' 
                      : 'bg-white/[0.04] text-gray-400 hover:bg-white/[0.08] hover:text-white border border-white/10'
                  }`}
                >
                  {/* Glass gloss shine on active */}
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
                  )}
                  {tab}
                </button>
              );
            })}
          </div>

          {/* Miniature interactive sandbox indicator */}
          <div className="flex items-center gap-1 py-0.5 px-2 bg-neutral-900 border border-white/5 rounded-full">
            <span className="text-[8px] font-mono text-gray-500 font-bold uppercase shrink-0">State:</span>
            <select 
              value={feedState}
              onChange={(e) => {
                const s = e.target.value as any;
                if (s === 'error') setErrorMessage('Gateway timeout during socket handshakes.');
                setFeedState(s);
              }}
              className="bg-transparent text-[9px] font-mono text-cyan-400 font-black uppercase outline-none cursor-pointer"
            >
              <option value="success" className="bg-black text-white">Live Success</option>
              <option value="loading" className="bg-black text-white">Shimmer Load</option>
              <option value="error" className="bg-black text-white">Error Guard</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3b. ACTIVE TREND FILTER BANNER */}
      {search.trim() !== '' && (
        <motion.div 
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="flex items-center justify-between p-2 px-3 bg-gradient-to-r from-cyan-500/5 via-blue-500/5 to-pink-500/5 backdrop-blur-[8px] saturate-[240%] rounded-xl border border-cyan-500/35 border-t-white/35 shadow-[0_12px_28px_rgba(0,0,0,0.5),inset_0_1.5px_2px_rgba(255,255,255,0.35),0_0_15px_rgba(6,182,212,0.15)] shrink-0 select-none mt-1"
        >
          <div className="flex items-center gap-2">
            <div className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </div>
            <span className="text-[9px] font-mono font-bold text-cyan-400 uppercase tracking-widest">
              Active Stream Filter:
            </span>
            <span className="text-xs font-black font-mono text-white px-2 py-0.5 bg-white/5 border border-white/10 rounded-lg">
              {search}
            </span>
            <span className="text-[9.5px] font-medium text-gray-400">
              ({filteredPosts.length} matches)
            </span>
          </div>

          <button
            onClick={() => {
              updateSearchValue('');
              onSearchQuery('');
              showToast("Search filter cleared", "info");
            }}
            className="flex items-center gap-1 py-1 px-2.5 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-[9px] font-black text-gray-300 hover:text-white cursor-pointer transition-colors"
          >
            Clear Filter <X className="w-2.5 h-2.5" />
          </button>
        </motion.div>
      )}

      {/* 4. POSTS LIST FEED */}
      <div className="flex flex-col gap-2.5">
        {feedState === 'loading' ? (
          <SkeletonLoader variant="feed" count={3} />
        ) : feedState === 'error' ? (
          <ErrorState 
            message={errorMessage} 
            onRetry={() => {
              setFeedState('loading');
              setTimeout(() => setFeedState('success'), 700);
            }} 
            onRefresh={() => {
              setFeedState('loading');
              setTimeout(() => setFeedState('success'), 600);
            }}
          />
        ) : filteredPosts.length === 0 ? (
          <EmptyState 
            icon={AlertCircle}
            title={`No ${filter} found`}
            description={`We couldn't detect any live publications in the "${filter}" enclave database yet.`}
            actionLabel="Create Your First Post"
            onAction={onOpenCreateMenu}
            variant="pink"
          />
        ) : (
          filteredPosts.map((post) => {
            const reactionCount = Object.keys(post.reactions).length;
            const hasVoted = post.poll?.votedOptionIndex !== undefined;
            const currentUserReaction = currentUser ? post.reactions[currentUser.id] : undefined;

            return (
              <article 
                key={post.id} 
                className="liquid-glass-card rounded-xl p-2.5 border-white/10 relative shadow-[0_8px_30px_rgba(0,0,0,0.5)] select-none"
                onMouseDown={(e) => startLongPress(e, post.id)}
                onMouseUp={handleMouseUpLocal}
                onMouseLeave={cancelLongPress}
                onTouchStart={(e) => startLongPress(e, post.id)}
                onTouchEnd={cancelLongPress}
                onTouchMove={handleTouchMoveLocal}
                onContextMenu={(e) => {
                  if (activeReactionPostId === post.id || longPressTriggered.current) {
                    e.preventDefault();
                  }
                }}
              >
                {/* Gloss Line Reflector */}
                <div className="absolute top-0 left-5 right-5 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

                {/* Post Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {/* Circle Avatar */}
                    <StoryAvatar userId={post.user.id} size="sm" />
                    <div>
                      <h3 
                        onClick={() => setViewedUserId(post.user.id)}
                        className="text-xs font-bold text-white tracking-tight leading-none mb-0.5 hover:text-yellow-400 transition-colors cursor-pointer"
                      >
                        {post.user.displayName}
                      </h3>
                      <span 
                        className="text-[7.5px] font-mono text-gray-500/90 tracking-wider flex items-center gap-1 flex-wrap"
                      >
                        <span onClick={() => setViewedUserId(post.user.id)} className="hover:text-yellow-400 cursor-pointer transition-colors">@{post.user.username}</span>
                        <span>•</span>
                        <span>{post.timestamp}</span>
                        {post.location && (
                          <>
                            <span>•</span>
                            <span 
                              onClick={() => {
                                triggerHaptic('selection');
                                setSearch(post.location);
                              }}
                              className="inline-flex items-center gap-1.5 text-rose-400 hover:text-rose-300 cursor-pointer font-black transition-colors"
                              title="Search this location"
                            >
                              <div className="flex items-center gap-0.5">
                                <MapPin className="w-2.5 h-2.5 text-rose-500" />
                                {post.location}
                              </div>
                              {post.locationCoords && (
                                <>
                                  {!post.hidePreciseLocation ? (
                                    <span className="text-[6.5px] text-rose-400/60 font-mono font-normal">
                                      ({post.locationCoords.latitude.toFixed(3)}, {post.locationCoords.longitude.toFixed(3)})
                                    </span>
                                  ) : (
                                    <span className="text-[6.5px] text-gray-500 font-mono font-normal" title="Precise GPS coordinates masked for privacy">
                                      (GPS Masked)
                                    </span>
                                  )}
                                </>
                              )}
                            </span>
                          </>
                        )}
                        {post.scheduledTime && (
                          <span className="inline-flex items-center gap-0.5 bg-purple-500/20 border border-purple-500/40 text-purple-300 text-[6.5px] px-1 py-0.2 rounded font-black uppercase tracking-wider ml-1">
                            <Calendar className="w-2 h-2 text-purple-300" />
                            Scheduled
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                  
                  {/* Connect quick context check & Floating Quick Share capsules */}
                  <div className="flex items-center gap-1.5">
                    {currentUser && post.user.id !== currentUser.id && (
                      <button 
                        onClick={() => {
                          const targetUser = users.find(u => u.id === post.user.id);
                          if (targetUser) selectChatUser(targetUser); 
                        }}
                        className="text-[7.5px] font-extrabold py-0.2 px-1.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 rounded-full transition-all text-[#2563FF] uppercase tracking-widest cursor-pointer whitespace-nowrap"
                      >
                        Connect
                      </button>
                    )}
                    
                    {/* Share icon feature remains functional but total public count is hidden */}
                  </div>
                </div>

                {/* Content Text */}
                <p className="text-[10px] leading-snug text-gray-200 mb-2 whitespace-pre-wrap">
                  {post.content}
                </p>

                {/* Render Media with Hover Glass Quick Share Overlay */}
                {post.mediaUrls && post.mediaUrls.length > 0 && (
                  <div className="rounded-lg overflow-hidden mb-2.5 border border-white/10 relative max-h-96 group">
                    <img 
                      src={post.mediaUrls[0]} 
                      alt="Post media" 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer"
                    />
                    {/* Glowing overlay layer */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-white/10 pointer-events-none"></div>
                    

                  </div>
                )}

                {/* Render Poll */}
                {post.mediaType === 'poll' && post.poll && (
                  <div className="bg-white/5 rounded-lg border border-white/10 p-2 mb-2 flex flex-col gap-2">
                    <span className="text-[9px] font-semibold text-gray-300 font-mono flex items-center gap-1.5">
                      <Vote className="w-3 h-3 text-cyan-400" /> Interactive Poll Selection:
                    </span>
                    <h4 className="text-[9.5px] font-bold text-white">{post.poll.question}</h4>
                    
                    <div className="flex flex-col gap-1">
                      {post.poll.options.map((option, idx) => {
                        const totalVotes = post.poll?.options.reduce((acc, curr) => acc + curr.votes, 0) || 1;
                        const percent = Math.round((option.votes / totalVotes) * 100);
                        const isThisChoice = post.poll?.votedOptionIndex === idx;

                        return (
                          <button
                            key={idx}
                            disabled={hasVoted}
                            onClick={() => voteInPoll(post.id, idx)}
                            className="w-full relative py-1.5 px-2.5 rounded-md text-left text-[9px] font-medium border border-white/10 transition-all overflow-hidden bg-black/40 group active:scale-[0.99] disabled:active:scale-100 cursor-pointer"
                          >
                            {/* Filling progress indicator */}
                            <div 
                              className={`absolute left-0 top-0 bottom-0 transition-all duration-700 pointer-events-none ${
                                isThisChoice 
                                  ? 'bg-cyan-500/20 border-r-2 border-cyan-400' 
                                  : 'bg-white/5'
                              }`}
                              style={{ width: `${percent}%` }}
                            ></div>

                            <div className="flex items-center justify-between relative z-10">
                              <span className={`grow text-left flex items-center gap-1.5 ${isThisChoice ? 'text-cyan-400 font-bold' : 'text-gray-300'}`}>
                                {option.text}
                                {isThisChoice && <Check className="w-3 h-3 text-cyan-400" />}
                              </span>
                              <span className="text-gray-400 font-mono font-bold">{percent}%</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Social Actions Panel */}
                <UnifiedSocialActionBar
                  item={post}
                  contentType={post.mediaType === 'text' ? 'writeup' : 'post'}
                  onOpenInsights={() => {
                    setInsightsPost(post);
                    setInsightsType(post.mediaType === 'text' ? 'writeup' : 'post');
                  }}
                  onOpenPromotion={() => {
                    setPromotionPost(post);
                    setPromotionType(post.mediaType === 'text' ? 'writeup' : 'post');
                  }}
                  onOpenComments={() => setCommentingPost(post)}
                />

                {/* Custom Quick-Reaction Floating Overlay Menu */}
                <AnimatePresence>
                  {activeReactionPostId === post.id && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-[#070b19]/75 backdrop-blur-xs rounded-xl z-30 flex items-center justify-center"
                    >
                      {/* Click outside backdrop close */}
                      <div 
                        className="absolute inset-0 rounded-xl"
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerHaptic('light');
                          setActiveReactionPostId(null);
                        }}
                      />
                      
                      <motion.div
                        initial={{ scale: 0.8, y: 15, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.8, y: 15, opacity: 0 }}
                        transition={{ type: 'spring', damping: 15, stiffness: 300 }}
                        className="relative bg-[#0d1530]/45 backdrop-blur-[8px] saturate-[260%] [box-shadow:0_14px_45px_rgba(0,0,0,0.7),0_0_20px_rgba(6,182,212,0.25),inset_0_2px_4px_rgba(255,255,255,0.45)] border border-cyan-500/45 rounded-full px-4 py-2.5 flex items-center gap-3.5 z-40"
                      >
                        {/* Top shine line */}
                        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />
                        
                        {[
                          { key: 'like', emoji: '👍', label: 'Like' },
                          { key: 'love', emoji: '💖', label: 'Love' },
                          { key: 'laugh', emoji: '😂', label: 'Laugh' },
                          { key: 'wow', emoji: '😮', label: 'Wow' },
                          { key: 'sad', emoji: '😢', label: 'Sad' },
                        ].map((reactionOption) => (
                          <button
                            key={reactionOption.key}
                            onClick={(e) => {
                              e.stopPropagation();
                              triggerHaptic('medium');
                              toggleReaction(post.id, reactionOption.key as any);
                              triggerEmojiAnimation(post.id, reactionOption.emoji);
                              setActiveReactionPostId(null);
                              showToast(`Reacted with ${reactionOption.emoji}!`);
                            }}
                            className="relative group p-1.5 hover:scale-140 active:scale-95 transition-all duration-150 text-2xl cursor-pointer"
                          >
                            {reactionOption.emoji}
                            <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-black/90 border border-white/10 text-white text-[7.5px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-mono select-none">
                              {reactionOption.label}
                            </span>
                          </button>
                        ))}

                        {/* Dismiss button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            triggerHaptic('light');
                            setActiveReactionPostId(null);
                          }}
                          className="p-1 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 text-gray-400 hover:text-white transition-all scale-90 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Floating Emojis Fountain Container */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl z-20">
                  <AnimatePresence>
                    {floatingEmojis[post.id]?.map((item) => (
                      <motion.span
                        key={item.id}
                        initial={{ opacity: 0, scale: 0.5, y: 50, x: item.x }}
                        animate={{ 
                          opacity: [0, 1, 1, 0], 
                          scale: [0.5, 1.3, 1, 0.7], 
                          y: -180 - Math.random() * 60,
                          x: item.x + (Math.random() - 0.5) * 60
                        }}
                        exit={{ opacity: 0 }}
                        transition={{ 
                          duration: item.duration, 
                          delay: item.delay,
                          ease: "easeOut"
                        }}
                        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-3xl select-none"
                      >
                        {item.emoji}
                      </motion.span>
                    ))}
                  </AnimatePresence>
                </div>

              </article>
            );
          })
        )}
      </div>

      {/* 6. EXPANDED COMMENTS MODAL TRAY */}
      {commentingPost && (() => {
        const totalCommentLikes = commentingPost.comments.reduce((acc, comm) => acc + (comm.likes?.length || 0), 0);
        
        return (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-40 flex items-end justify-center select-none animate-in fade-in duration-150">
            <div className="w-full max-w-lg bg-[#0e142a] border-t border-white/15 rounded-t-3xl max-h-[75vh] flex flex-col shadow-2xl relative">
              
              {/* Close touch handle */}
              <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto my-3 cursor-pointer" onClick={() => setCommentingPost(null)}></div>
              
              {/* Header */}
              <div className="flex items-center justify-between px-5 pb-3 border-b border-white/5">
                <div className="flex flex-col">
                  <h4 className="text-sm font-bold text-white">Post Reactions & Comments</h4>
                  <span className="text-5xs font-mono text-gray-400 tracking-wider">SECURE E2E COMMENT ENGINE</span>
                </div>
                <button 
                  onClick={() => setCommentingPost(null)}
                  className="p-1 rounded-full bg-white/5 text-gray-400 hover:text-white"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Comments list body */}
              <div className="flex-1 overflow-y-auto p-5 gap-4 flex flex-col custom-scrollbar">
                {/* Original Post Preview */}
                <div className="p-3 bg-white/5 rounded-xl border border-white/5 mb-1 text-left">
                  <span className="text-4xs font-mono text-cyan-400 font-semibold block mb-1">Original Post by @{commentingPost.user.username}</span>
                  <p className="text-3xs text-gray-400 italic line-clamp-2">"{commentingPost.content}"</p>
                </div>

                {/* Sleek Real-time Total Comment Likes Display Tag */}
                <div className="flex items-center justify-between p-2.5 bg-gradient-to-r from-pink-500/10 via-pink-500/5 to-transparent border border-pink-500/10 rounded-xl mb-1 text-left animate-in fade-in slide-in-from-top-1 duration-300">
                  <div className="flex items-center gap-2">
                    <div className="relative flex items-center justify-center w-6 h-6 rounded-lg bg-pink-500/20 text-pink-400 shadow-[0_0_8px_rgba(236,72,153,0.15)]">
                      <Heart className="w-3.5 h-3.5 fill-pink-500 text-pink-500 animate-pulse" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-gray-200 leading-tight">Total Discussion Likes</span>
                      <span className="text-[7px] font-mono text-gray-500 uppercase tracking-widest">Real-time engagement telemetry</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-pink-500/20 border border-pink-500/25 rounded-md text-xs font-mono font-bold text-pink-400 shadow-[0_0_12px_rgba(236,72,153,0.1)] transition-all duration-300 transform hover:scale-105">
                    <span>{totalCommentLikes}</span>
                    <span className="text-[7px] text-pink-500 uppercase font-sans font-bold">likes</span>
                  </div>
                </div>

                {/* Comment Controls (Filter & Sort Row) */}
                {commentingPost.comments.length > 0 && (
                <div className="flex gap-2 mb-2.5 animate-in fade-in duration-200">
                  {/* Connections Only Filter Button */}
                  {currentUser && (
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('selection');
                        setConnectionsOnly(!connectionsOnly);
                      }}
                      className={`flex-1 flex items-center justify-between p-2.5 rounded-xl border transition-all duration-300 ${
                        connectionsOnly 
                          ? 'bg-cyan-500/10 border-cyan-400/30 text-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.1)]' 
                          : 'bg-white/[0.03] border-white/5 text-gray-400 hover:text-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 text-left">
                        <Users className={`w-3.5 h-3.5 ${connectionsOnly ? 'text-cyan-400 animate-pulse' : 'text-gray-400'}`} />
                        <div className="flex flex-col">
                          <span className={`text-[10px] font-bold leading-tight ${connectionsOnly ? 'text-cyan-400' : 'text-gray-200'}`}>Connections Only</span>
                          <span className="text-[7px] font-mono text-gray-500 uppercase tracking-widest">Filter status</span>
                        </div>
                      </div>
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${connectionsOnly ? 'bg-cyan-400/20 text-cyan-300' : 'bg-white/5 text-gray-500'}`}>
                        {connectionsOnly ? 'ON' : 'OFF'}
                      </span>
                    </button>
                  )}

                  {/* Sort Comments Dropdown Control */}
                  <div className="flex-1 flex items-center justify-between p-2.5 bg-white/[0.03] border border-white/5 rounded-xl relative">
                    <div className="flex items-center gap-2 text-left pointer-events-none">
                      <ArrowUpDown className="w-3.5 h-3.5 text-cyan-400" />
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-gray-200 leading-tight">Sort By</span>
                        <span className="text-[7px] font-mono text-gray-500 uppercase tracking-widest">Comment order</span>
                      </div>
                    </div>
                    
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic('selection');
                          setIsSortDropdownOpen(!isSortDropdownOpen);
                        }}
                        className="flex items-center gap-1.5 bg-neutral-900 border border-white/10 text-[10px] font-bold text-gray-200 rounded-lg py-1.5 px-3 hover:bg-neutral-800 focus:border-cyan-400/50 transition-colors"
                      >
                        <span>
                          {commentSort === 'newest' && 'Newest'}
                          {commentSort === 'oldest' && 'Oldest'}
                          {commentSort === 'mostLiked' && 'Most Liked'}
                        </span>
                        <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${isSortDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {isSortDropdownOpen && (
                        <>
                          {/* Close backdrop click interceptor */}
                          <div 
                            className="fixed inset-0 z-40 cursor-default" 
                            onClick={() => setIsSortDropdownOpen(false)} 
                          />
                          
                          {/* Dropdown Options Popup */}
                          <div className="absolute right-0 mt-1.5 w-36 bg-neutral-900 border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden flex flex-col p-1 animate-in fade-in slide-in-from-top-2 duration-150">
                            <button
                              type="button"
                              onClick={() => {
                                triggerHaptic('selection');
                                setCommentSort('newest');
                                setIsSortDropdownOpen(false);
                              }}
                              className={`flex items-center justify-between w-full text-left px-2.5 py-2 text-[10px] font-bold rounded-lg transition-colors ${
                                commentSort === 'newest' 
                                  ? 'bg-cyan-500/10 text-cyan-400' 
                                  : 'text-gray-300 hover:bg-white/5'
                              }`}
                            >
                              <div className="flex items-center gap-1.5">
                                <Sparkles className="w-3 h-3 text-cyan-400 shrink-0" />
                                <span>Newest</span>
                              </div>
                              {commentSort === 'newest' && <Check className="w-3 h-3 text-cyan-400 shrink-0" />}
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                triggerHaptic('selection');
                                setCommentSort('oldest');
                                setIsSortDropdownOpen(false);
                              }}
                              className={`flex items-center justify-between w-full text-left px-2.5 py-2 text-[10px] font-bold rounded-lg transition-colors ${
                                commentSort === 'oldest' 
                                  ? 'bg-cyan-500/10 text-cyan-400' 
                                  : 'text-gray-300 hover:bg-white/5'
                              }`}
                            >
                              <div className="flex items-center gap-1.5">
                                <Calendar className="w-3 h-3 text-cyan-400 shrink-0" />
                                <span>Oldest</span>
                              </div>
                              {commentSort === 'oldest' && <Check className="w-3 h-3 text-cyan-400 shrink-0" />}
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                triggerHaptic('selection');
                                setCommentSort('mostLiked');
                                setIsSortDropdownOpen(false);
                              }}
                              className={`flex items-center justify-between w-full text-left px-2.5 py-2 text-[10px] font-bold rounded-lg transition-colors ${
                                commentSort === 'mostLiked' 
                                  ? 'bg-cyan-500/10 text-cyan-400' 
                                  : 'text-gray-300 hover:bg-white/5'
                              }`}
                            >
                              <div className="flex items-center gap-1.5">
                                <Heart className="w-3 h-3 text-pink-500 shrink-0 fill-pink-500/10" />
                                <span>Most Liked</span>
                              </div>
                              {commentSort === 'mostLiked' && <Check className="w-3 h-3 text-cyan-400 shrink-0" />}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {(() => {
                // Filter comments
                let processedComments = (connectionsOnly && currentUser)
                  ? commentingPost.comments.filter(comm => currentUser.connects.includes(comm.user.id) || comm.user.id === currentUser.id)
                  : commentingPost.comments;

                // Sort comments
                processedComments = [...processedComments].sort((a, b) => {
                  const timeA = getCommentCreationTime(a);
                  const timeB = getCommentCreationTime(b);
                  if (commentSort === 'mostLiked') {
                    const likesA = (a.likes || []).length;
                    const likesB = (b.likes || []).length;
                    if (likesB !== likesA) {
                      return likesB - likesA;
                    }
                    // fallback to newest if likes are equal
                    return timeB - timeA;
                  } else if (commentSort === 'oldest') {
                    return timeA - timeB;
                  } else {
                    // default 'newest'
                    return timeB - timeA;
                  }
                });

                // Separate into root comments
                const rootComments = processedComments.filter(c => !c.parentId);

                if (rootComments.length === 0) {
                  return (
                    <div className="py-10 text-center flex flex-col items-center gap-2">
                      <Smile className="w-8 h-8 text-gray-600 animate-bounce" />
                      <span className="text-xs text-gray-500 font-medium">
                        {connectionsOnly 
                          ? "No comments from direct connections yet." 
                          : "Be the first to share your thoughts!"}
                      </span>
                    </div>
                  );
                }

                return rootComments.map((comm) => {
                  // Find replies for this root comment and sort chronologically (oldest first)
                  const commentReplies = processedComments
                    .filter(c => c.parentId === comm.id)
                    .sort((a, b) => getCommentCreationTime(a) - getCommentCreationTime(b));

                  return (
                    <CommentItem 
                      key={comm.id} 
                      comm={comm} 
                      postId={commentingPost.id}
                      currentUser={currentUser}
                      toggleLikeComment={toggleLikeComment}
                      flagComment={flagComment}
                      triggerHaptic={triggerHaptic}
                      setViewedUserId={setViewedUserId}
                      setCommentingPost={setCommentingPost}
                      addComment={addComment}
                      replies={commentReplies}
                    />
                  );
                });
              })()}
            </div>

            {/* Send Comment Input Bar */}
            <form onSubmit={handlePostCommentSubmit} className="border-t border-white/5 p-4 flex gap-2.5 bg-neutral-900/60 pb-8 rounded-b-none">
              <input
                type="text"
                placeholder="Share your response or thoughts..."
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                className="flex-1 bg-[#101732] border border-white/10 focus:border-cyan-400 outline-none text-xs py-3 px-4 rounded-xl text-white placeholder:text-gray-500"
              />
              <button 
                type="submit"
                className="p-3 bg-gradient-to-r from-blue-500 to-pink-500 rounded-xl text-white font-medium hover:opacity-90 active:scale-95 transition-all text-xs cursor-pointer shadow-lg"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

          </div>
        </div>
      );
    })()}

      {/* OVERLAY MODALS FOR INSIGHTS & PROMOTIONS */}
      <PostInsightsModal
        isOpen={insightsPost !== null}
        onClose={() => setInsightsPost(null)}
        contentItem={insightsPost}
        contentType={insightsType}
      />

      <PostPromotionModal
        isOpen={promotionPost !== null}
        onClose={() => setPromotionPost(null)}
        contentItem={promotionPost}
        contentType={promotionType}
        onBoostComplete={(postId, boostState) => {
          updatePostStats(postId, { boosts: boostState });
        }}
      />

      {/* LIQUID LINK HUB - FLOATING QUICK SHARE CUSTOMIZER */}
      <AnimatePresence>
        {activeSharePost && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-xl z-50 flex items-center justify-center p-4">
            
            {/* Background Dismiss Trigger */}
            <div className="absolute inset-0" onClick={() => { triggerHaptic('light'); setActiveSharePost(null); }} />

            <motion.div
              initial={{ y: 50, scale: 0.95, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 40, scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="w-full max-w-md liquid-glass-card-heavy rounded-[32px] p-6 text-left relative overflow-hidden flex flex-col gap-5 border border-white/20 shadow-[0_25px_60px_rgba(0,0,0,0.85)] z-10"
            >
              
              {/* Glossy top reflections */}
              <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
              
              {/* Core neon colors backing layer for light dispersion */}
              <div className="absolute -top-20 -left-20 w-44 h-44 rounded-full bg-[#2563FF]/20 blur-[60px] pointer-events-none" />
              <div className="absolute -bottom-10 -right-10 w-44 h-44 rounded-full bg-[#FF2E9A]/20 blur-[60px] pointer-events-none" />

              {/* Header */}
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-gradient-to-tr from-[#2563FF]/30 to-[#FF2E9A]/10 border border-white/15 shadow-[0_0_15px_rgba(37,99,255,0.25)]">
                    <Share2 className="w-4 h-4 text-[#2563FF] animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black font-display text-white uppercase tracking-wider">Liquid Link Hub</h3>
                    <p className="text-[10px] font-mono text-gray-400">iPhone 17 Pro Refractive Routing</p>
                  </div>
                </div>
                
                <button
                  onClick={() => { triggerHaptic('light'); setActiveSharePost(null); }}
                  className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors text-gray-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Generated link preview panel */}
              <div className="bg-black/40 rounded-2xl p-4 border border-white/8 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-[#2563FF]/2 via-transparent to-[#FF2E9A]/2 pointer-events-none" />
                
                <div className="flex justify-between items-start gap-3 relative z-10">
                  <div className="flex-1 min-w-0">
                    <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest block mb-1">Generated custom destination:</span>
                    <p className="text-[11px] font-mono font-bold text-gray-200 select-all break-all leading-tight pr-1">
                      {generateDynamicLink(activeSharePost)}
                    </p>
                  </div>

                  {/* QR Scan Mini Visual */}
                  <div className="w-14 h-14 rounded-lg bg-white/[0.03] border border-white/10 p-1 flex items-center justify-center shrink-0">
                    <QrCode className="w-8 h-8 text-[#2563FF] drop-shadow-[0_0_8px_rgba(37,99,255,0.4)]" />
                  </div>
                </div>

                {/* Copied indicator banner */}
                <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[9px] text-[#2563FF] font-black tracking-widest uppercase flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#2563FF] animate-ping" />
                    Auto-synced to clipboard
                  </span>
                  
                  {shareClipboardCopied ? (
                    <span className="text-[10px] text-emerald-400 font-extrabold flex items-center gap-1 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)] bg-emerald-500/10 py-0.5 px-2 rounded-full border border-emerald-500/25 animate-bounce">
                      <Check className="w-3 h-3" /> Copied safely!
                    </span>
                  ) : (
                    <span className="text-[10px] text-gray-400 font-bold">
                      One-tap Active
                    </span>
                  )}
                </div>
              </div>

              {/* Interactive custom modifier checkboxes/sliders */}
              <div className="flex flex-col gap-2.5 relative z-10">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Customize Glass Routing Presets:</span>

                {/* signature toggle */}
                <div 
                  onClick={() => handleToggleOption('includeSignature')}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer select-none transition-all duration-300 ${
                    shareConfig.includeSignature 
                      ? 'bg-gradient-to-r from-[#2563FF]/8 to-transparent border-white/15 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]' 
                      : 'bg-white/[0.02] border-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Fingerprint className={`w-4 h-4 ${shareConfig.includeSignature ? 'text-[#2563FF]' : 'text-gray-500'}`} />
                    <div className="flex flex-col text-left">
                      <span className="text-xs font-bold text-white leading-none">Include Creator Signature</span>
                      <span className="text-[9px] text-gray-400 font-mono">Binds signature of: @{activeSharePost.user.username}</span>
                    </div>
                  </div>
                  <div className={`w-8 h-4 rounded-full p-0.5 transition-colors duration-300 ${shareConfig.includeSignature ? 'bg-[#2563FF]' : 'bg-gray-700'}`}>
                    <div className={`w-3 h-3 rounded-full bg-white shadow transition-transform duration-300 ${shareConfig.includeSignature ? 'translate-x-4' : 'translate-x-0'}`} />
                  </div>
                </div>

                {/* hifi glass refraction layer */}
                <div 
                  onClick={() => handleToggleOption('hifiGlassRefraction')}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer select-none transition-all duration-300 ${
                    shareConfig.hifiGlassRefraction 
                      ? 'bg-gradient-to-r from-[#FF2E9A]/8 to-transparent border-white/15 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]' 
                      : 'bg-white/[0.02] border-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Layers className={`w-4 h-4 ${shareConfig.hifiGlassRefraction ? 'text-[#FF2E9A]' : 'text-gray-500'}`} />
                    <div className="flex flex-col text-left">
                      <span className="text-xs font-bold text-white leading-none">VisionOS High-Index Layer</span>
                      <span className="text-[9px] text-gray-400 font-mono">Forces spatial glass blur viewport</span>
                    </div>
                  </div>
                  <div className={`w-8 h-4 rounded-full p-0.5 transition-colors duration-300 ${shareConfig.hifiGlassRefraction ? 'bg-[#FF2E9A]' : 'bg-gray-700'}`}>
                    <div className={`w-3 h-3 rounded-full bg-white shadow transition-transform duration-300 ${shareConfig.hifiGlassRefraction ? 'translate-x-4' : 'translate-x-0'}`} />
                  </div>
                </div>

                {/* Specular telemetry */}
                <div 
                  onClick={() => handleToggleOption('includeTelemetry')}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer select-none transition-all duration-300 ${
                    shareConfig.includeTelemetry 
                      ? 'bg-gradient-to-r from-[#8B5CF6]/8 to-transparent border-white/15 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]' 
                      : 'bg-white/[0.02] border-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Network className={`w-4 h-4 ${shareConfig.includeTelemetry ? 'text-[#8B5CF6]' : 'text-gray-500'}`} />
                    <div className="flex flex-col text-left">
                      <span className="text-xs font-bold text-white leading-none">iPhone 17 Specular Telemetry</span>
                      <span className="text-[9px] text-gray-400 font-mono">Injects real-time light alignment signals</span>
                    </div>
                  </div>
                  <div className={`w-8 h-4 rounded-full p-0.5 transition-colors duration-300 ${shareConfig.includeTelemetry ? 'bg-[#8B5CF6]' : 'bg-gray-700'}`}>
                    <div className={`w-3 h-3 rounded-full bg-white shadow transition-transform duration-300 ${shareConfig.includeTelemetry ? 'translate-x-4' : 'translate-x-0'}`} />
                  </div>
                </div>

                {/* link shortener */}
                <div 
                  onClick={() => handleToggleOption('shortenLink')}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer select-none transition-all duration-300 ${
                    shareConfig.shortenLink 
                      ? 'bg-gradient-to-r from-emerald-500/8 to-transparent border-white/15 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]' 
                      : 'bg-white/[0.02] border-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Link2 className={`w-4 h-4 ${shareConfig.shortenLink ? 'text-emerald-400' : 'text-gray-500'}`} />
                    <div className="flex flex-col text-left">
                      <span className="text-xs font-bold text-white leading-none">Compact Url Form</span>
                      <span className="text-[9px] text-gray-400 font-mono">Trims auxiliary trailing payload tags</span>
                    </div>
                  </div>
                  <div className={`w-8 h-4 rounded-full p-0.5 transition-colors duration-300 ${shareConfig.shortenLink ? 'bg-emerald-500' : 'bg-gray-700'}`}>
                    <div className={`w-3 h-3 rounded-full bg-white shadow transition-transform duration-300 ${shareConfig.shortenLink ? 'translate-x-4' : 'translate-x-0'}`} />
                  </div>
                </div>
              </div>

              {/* Primary action capsules styling */}
              <div className="flex gap-3 mt-1 relative z-10">
                <button
                  onClick={() => {
                    triggerHaptic('medium');
                    const targetLink = generateDynamicLink(activeSharePost);
                    if (navigator.clipboard) {
                      navigator.clipboard.writeText(targetLink).then(() => {
                        setShareClipboardCopied(true);
                        triggerHaptic('success');
                        updatePostStats(activeSharePost.id, { shares: (activeSharePost.shares || 0) + 1 });
                        setActiveSharePost(prev => prev ? { ...prev, shares: (prev.shares || 0) + 1 } : null);
                        showToast("Custom specular link copied!");
                        setTimeout(() => setShareClipboardCopied(false), 3000);
                      });
                    }
                  }}
                  className="flex-1 py-3 px-4 rounded-xl liquid-glass-capsule-blue text-white font-extrabold text-xs cursor-pointer flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4 animate-spin-slow" />
                  <span>Copy Custom Link</span>
                </button>
                
                <button
                  onClick={() => {
                    triggerHaptic('light');
                    setActiveSharePost(null);
                  }}
                  className="py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-bold text-xs border border-white/10 active:scale-95 transition-all cursor-pointer select-none"
                >
                  Dismiss
                </button>
              </div>

              {/* Ledgers footer */}
              <div className="text-[8px] font-mono text-center text-gray-600 leading-none select-none">
                ConnectX Specular Share Sync • Fully compatible with iOS 17 Pro AirDrop Matrix.
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* QUICK SHARE PREVIEW MODAL */}
      <AnimatePresence>
        {sharePreviewPost && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-2xl z-50 flex items-center justify-center p-4">
            
            {/* Background Dismiss Trigger */}
            <div className="absolute inset-0" onClick={() => { triggerHaptic('light'); setSharePreviewPost(null); }} />

            <motion.div
              initial={{ y: 50, scale: 0.95, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 40, scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="w-full max-w-sm liquid-glass-card-heavy rounded-[32px] p-6 text-left relative overflow-hidden flex flex-col gap-5 border border-white/20 shadow-[0_25px_60px_rgba(0,0,0,0.85)] z-10"
            >
              
              {/* Glossy top reflections */}
              <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />

              {/* Header */}
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-gradient-to-tr from-[#2563FF]/30 to-[#FF2E9A]/10 border border-white/15 shadow-[0_2px_5px_rgba(0,0,0,0.3)]">
                    <Share2 className="w-4 h-4 text-[#FF2E9A] animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black font-display text-white uppercase tracking-wider">Share Preview</h3>
                    <p className="text-[9px] font-mono text-gray-400">Dynamic OpenGraph Specimen</p>
                  </div>
                </div>
                
                <button
                  onClick={() => { triggerHaptic('light'); setSharePreviewPost(null); }}
                  className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors text-gray-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* METADATA RICH LINK PREVIEW CARD MOCKUP */}
              <div className="relative rounded-2xl bg-[#090b16] border border-white/10 overflow-hidden shadow-lg select-none group">
                {/* Thin gloss outline reflect line */}
                <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent z-10" />
                
                {/* Media Image or Dynamic Waveform Branding graphic */}
                {sharePreviewPost.mediaUrls && sharePreviewPost.mediaUrls.length > 0 ? (
                  <div className="w-full h-40 overflow-hidden relative border-b border-white/5 bg-black/60 flex items-center justify-center">
                    <img 
                      src={sharePreviewPost.mediaUrls[0]} 
                      alt="Metadata preview" 
                      className="w-full h-full object-cover blur-[1px] brightness-90 group-hover:blur-0 group-hover:scale-105 transition-all duration-700" 
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#090b16] via-transparent to-transparent opacity-80" />
                  </div>
                ) : (
                  <div className="w-full h-32 relative border-b border-white/5 overflow-hidden flex flex-col justify-between p-4 bg-gradient-to-b from-[#11162d] to-[#090b16]">
                    {/* Animated background lines */}
                    <div className="absolute inset-0 bg-grid-white/[0.02] pointer-events-none" />
                    <div className="absolute -top-12 -left-12 w-28 h-28 rounded-full bg-[#2563FF]/15 blur-2xl" />
                    <div className="absolute -bottom-12 -right-12 w-28 h-28 rounded-full bg-[#FF2E9A]/15 blur-2xl" />
                    
                    <div className="flex items-center gap-1.5 z-10">
                      <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-[#2563FF] to-[#FF2E9A] flex items-center justify-center font-display font-extrabold text-xs text-white">X</div>
                      <span className="text-[8px] font-black tracking-widest text-[#FF2E9A] uppercase font-mono">ConnectX Spatial Net</span>
                    </div>

                    <div className="z-10 bg-white/[0.03] backdrop-blur-md rounded-lg p-2 border border-white/5 flex items-center gap-2">
                       <Fingerprint className="w-4 h-4 text-[#2563FF] animate-pulse" />
                       <span className="text-[9px] font-mono text-gray-400">Cryp-Signed Creator Ledger Card</span>
                    </div>
                  </div>
                )}

                {/* Metadata Details Bottom Drawer Section */}
                <div className="p-4 flex flex-col gap-1.5 bg-[#090b16]/70 backdrop-blur-md relative">
                  <div className="flex items-center gap-1.5 mb-1">
                    <img 
                      src={sharePreviewPost.user.avatarUrl || MOCK_AVATARS[0]} 
                      alt="User mini avatar" 
                      className="w-5 h-5 rounded-full border border-white/10 ring-1 ring-[#2563FF]/20"
                      referrerPolicy="no-referrer"
                    />
                    <span className="text-[10px] font-bold text-gray-300">
                      ConnectX Post • @{sharePreviewPost.user.username}
                    </span>
                  </div>

                  <h4 className="text-xs font-black text-white hover:text-[#2563FF] transition-colors leading-snug tracking-tight truncate-two-lines">
                    ConnectX Post by @{sharePreviewPost.user.username}
                  </h4>

                  <p className="text-[10px] text-gray-400 font-medium leading-relaxed line-clamp-2 h-7 overflow-hidden text-ellipsis mb-1.5">
                    {sharePreviewPost.content ? (sharePreviewPost.content.length > 80 ? `${sharePreviewPost.content.substring(0, 77)}...` : sharePreviewPost.content) : "Interactive digital card share feed item on ConnectX."}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <span className="text-[9px] font-black text-[#2563FF] font-mono tracking-wider uppercase flex items-center gap-1">
                      <Link2 className="w-3 h-3 text-[#2563FF]/80" />
                      connectx.app
                    </span>
                    <span className="text-[8px] font-mono text-gray-400">
                      SECURE HTTPS GATEWAY
                    </span>
                  </div>
                </div>
              </div>

              {/* Explanation note */}
              <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 flex gap-2 w-full">
                <Sparkles className="w-3.5 h-3.5 text-yellow-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-gray-400 font-bold leading-normal">
                  ConnectX generates deep-linked refractive glass schemas. Tap the trigger to activate native platform system-sharing.
                </p>
              </div>

              {/* ACTION BUTTON CHEVRONS */}
              <div className="flex gap-3 relative z-10">
                <button
                  onClick={() => executeSharingDialog(sharePreviewPost)}
                  className="flex-1 py-3 px-4 rounded-xl liquid-glass-capsule-pink text-white font-black text-xs cursor-pointer flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(0,0,0,0.4)] hover:scale-102 active:scale-98 transition-all"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Execute Share Dialog</span>
                </button>
                
                <button
                  onClick={() => {
                    triggerHaptic('light');
                    setSharePreviewPost(null);
                  }}
                  className="py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-bold text-xs border border-white/10 active:scale-95 transition-all cursor-pointer"
                >
                  Cancel
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* LIQUID GLASS TOAST SYSTEM */}
      <AnimatePresence>
        {activeToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 20, stiffness: 350 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] pointer-events-none"
          >
            <div className="liquid-glass-card-heavy px-5 py-3.5 rounded-2xl flex items-center gap-3 max-w-sm relative overflow-hidden">
              {/* Gloss gloss shine */}
              <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />

              <div className="p-1.5 rounded-xl bg-white/5 border border-white/15 shadow-[0_2px_4px_rgba(0,0,0,0.3)] shrink-0 relative z-10">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <span className="text-xs font-black text-gray-100 tracking-wide select-none shrink-0 relative z-10 block pr-2">
                {activeToast.message}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
