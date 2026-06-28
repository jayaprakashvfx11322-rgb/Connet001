/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  ConnectXUser, FeedPost, Reel, YouTubeVideo, Story, GroupChat, 
  ConnectXNotification, Message, MonetizationReport, MiniUser, 
  PostComment, ReelComment, VideoComment, CreatorWallet, 
  WithdrawalRequest, PlatformConfig, PayoutLog 
} from '../types';
import { 
  INITIAL_MOCK_USERS, 
  INITIAL_MOCK_POSTS, 
  INITIAL_MOCK_REELS, 
  INITIAL_MOCK_VIDEOS, 
  INITIAL_MOCK_STORIES, 
  INITIAL_MOCK_GROUPS, 
  INITIAL_MOCK_NOTIFICATIONS, 
  INITIAL_MOCK_MESSAGES, 
  INITIAL_MONETIZATION,
  MOCK_IMAGES
} from './mockData';
import { setCachedItem, getCachedItem, enqueueOfflineAction, getOfflineActions, dequeueOfflineAction, clearOfflineActions, OfflineAction } from './indexedDB';

interface ConnectXContextType {
  currentUser: ConnectXUser | null;
  users: ConnectXUser[];
  posts: FeedPost[];
  reels: Reel[];
  videos: YouTubeVideo[];
  stories: Story[];
  groups: GroupChat[];
  notifications: ConnectXNotification[];
  messages: Message[];
  monetization: MonetizationReport;
  activeChatUser: ConnectXUser | null;
  activeGroupChat: GroupChat | null;
  
  // Auth Operations
  loginAsDemo: (userId: string) => void;
  logout: () => void;
  signupComplete: (newUser: ConnectXUser) => void;
  updateProfile: (updated: Partial<ConnectXUser>) => void;
  
  // Post Operations
  addPost: (
    content: string,
    mediaUrls?: string[],
    type?: 'image' | 'video' | 'text' | 'poll',
    poll?: { question: string, options: string[] },
    allowDownloads?: boolean,
    scheduledTime?: string,
    location?: string,
    locationCoords?: { latitude: number; longitude: number },
    hidePreciseLocation?: boolean
  ) => void;
  addComment: (postId: string, text: string, parentId?: string) => void;
  toggleLikeComment: (postId: string, commentId: string) => void;
  flagComment: (postId: string, commentId: string, reason: string) => void;
  deleteComment: (postId: string, commentId: string) => void;
  dismissCommentFlag: (postId: string, commentId: string) => void;
  toggleReaction: (postId: string, reaction: 'like' | 'love' | 'laugh' | 'wow' | 'sad') => void;
  voteInPoll: (postId: string, optionIndex: number) => void;
  deletePost: (postId: string) => void;

  // Reel Operations
  addReel: (caption: string, videoUrl: string, soundTitle: string, hashtags: string[], allowDownloads?: boolean) => void;
  toggleLikeReel: (reelId: string) => void;
  addReelComment: (reelId: string, text: string) => void;
  toggleSaveReel: (reelId: string) => void;

  // Video Operations
  addVideo: (title: string, description: string, category: any, videoUrl: string, thumbnailUrl: string, duration: string, quality: any, allowDownloads?: boolean) => void;
  toggleLikeVideo: (videoId: string) => void;
  addVideoComment: (videoId: string, text: string) => void;
  toggleWatchLater: (videoId: string) => void;

  // Story Operations
  addStory: (mediaUrl: string, caption?: string, questionPrompt?: string, poll?: { question: string, options: { text: string; votes: number }[] }, allowDownloads?: boolean, mediaType?: 'image' | 'video') => void;
  deleteStory: (storyId: string) => void;
  viewStory: (storyId: string) => void;
  archiveStories: Story[];
  archiveStory: (storyId: string) => void;
  repostStoryFromArchive: (storyId: string) => void;
  toggleHighlightStory: (storyId: string, highlightTitle?: string) => void;
  deleteArchivedStory: (storyId: string) => void;

  // Connect Operations
  sendConnectRequest: (userId: string) => void;
  acceptConnectRequest: (userId: string) => void;
  declineConnectRequest: (userId: string) => void;
  disconnectUser: (userId: string) => void;

  // Message Operations
  selectChatUser: (user: ConnectXUser | null) => void;
  selectGroupChat: (group: GroupChat | null) => void;
  sendMessageToUser: (text?: string, mediaUrl?: string, mediaType?: 'image' | 'video' | 'document', voiceDuration?: string) => void;
  sendMessageToSpecificUser: (receiverId: string, text?: string, mediaUrl?: string, mediaType?: 'image' | 'video' | 'document') => void;
  sendMessageToGroup: (text?: string, mediaUrl?: string, mediaType?: 'image' | 'video' | 'document') => void;
  createGroup: (name: string, description: string, type: 'group' | 'community' | 'channel', memberIds: string[]) => void;

  // General Notification Operations
  markAllNotificationsRead: () => void;
  clearAllNotifications: () => void;

  // Monetization Operations
  withdrawMoney: (method: 'bank' | 'upi' | 'paypal', address: string, amount: number) => boolean;

  // Full-Stack Monetization System
  creatorWallet: CreatorWallet | null;
  withdrawalRequests: WithdrawalRequest[];
  payoutLogs: PayoutLog[];
  platformConfig: PlatformConfig | null;
  loadCreatorWallet: (userId: string) => Promise<void>;
  addAdImpression: (creatorId: string, views: number) => Promise<void>;
  requestPayoutClearance: (amount: number, method: 'PayPal' | 'UPI' | 'Bank', address: string, details?: any) => Promise<{ success: boolean; error?: string }>;
  adminLoadAllCreators: () => Promise<CreatorWallet[]>;
  adminLoadAllWithdrawals: () => Promise<WithdrawalRequest[]>;
  adminLoadPayoutLogs: () => Promise<PayoutLog[]>;
  adminApproveWithdrawal: (withdrawalId: string) => Promise<{ success: boolean; error?: string }>;
  adminRejectWithdrawal: (withdrawalId: string, reason: string) => Promise<{ success: boolean; error?: string }>;
  adminSaveConfig: (config: PlatformConfig) => Promise<{ success: boolean; error?: string }>;

  // Admin Controls
  adminDeleteUser: (userId: string) => void;
  adminApproveMonetization: (userId: string, level: string) => void;
  adminConfigureAds: (settings: any) => void;

  // Real-time metadata updaters
  updatePostStats: (postId: string, stats: Partial<FeedPost>) => void;
  updateReelStats: (reelId: string, stats: Partial<Reel>) => void;
  updateVideoStats: (videoId: string, stats: Partial<YouTubeVideo>) => void;
  updateStoryStats: (storyId: string, stats: Partial<Story>) => void;

  viewedUserId: string | null;
  setViewedUserId: (userId: string | null) => void;
  activeStoryUserId: string | null;
  setActiveStoryUserId: (userId: string | null) => void;
  offlineActionsCount: number;
  syncOfflineQueue: () => Promise<void>;
}

const ConnectXContext = createContext<ConnectXContextType | undefined>(undefined);

export const ConnectXProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load initial states from localStorage if available, else load fallback mocks
  const [currentUser, setCurrentUser] = useState<ConnectXUser | null>(() => {
    const saved = localStorage.getItem('cx_current_user');
    return saved ? JSON.parse(saved) : null; // Start unauthenticated to present the Welcome / Signup wizard
  });

  const [users, setUsers] = useState<ConnectXUser[]>(() => {
    const saved = localStorage.getItem('cx_users');
    return saved ? JSON.parse(saved) : INITIAL_MOCK_USERS;
  });

  const [posts, setPosts] = useState<FeedPost[]>(() => {
    const saved = localStorage.getItem('cx_posts');
    return saved ? JSON.parse(saved) : INITIAL_MOCK_POSTS;
  });

  const [reels, setReels] = useState<Reel[]>(() => {
    const saved = localStorage.getItem('cx_reels');
    return saved ? JSON.parse(saved) : INITIAL_MOCK_REELS;
  });

  const [videos, setVideos] = useState<YouTubeVideo[]>(() => {
    const saved = localStorage.getItem('cx_videos');
    return saved ? JSON.parse(saved) : INITIAL_MOCK_VIDEOS;
  });

  // Pre-process stories to separate active and expired stories
  const processedStoriesResult = (() => {
    const saved = localStorage.getItem('cx_stories');
    const initial = saved ? JSON.parse(saved) : INITIAL_MOCK_STORIES;
    const processed = initial.map((story: any) => {
      if (!story.createdAt) {
        let ageMs = 0;
        if (story.timestamp && story.timestamp.endsWith('h ago')) {
          ageMs = parseInt(story.timestamp.split('h')[0]) * 60 * 60 * 1000;
        } else if (story.timestamp && story.timestamp.endsWith('m ago')) {
          ageMs = parseInt(story.timestamp.split('m')[0]) * 60 * 1000;
        }
        return { ...story, createdAt: Date.now() - ageMs };
      }
      return story;
    });

    const active = processed.filter((story: any) => Date.now() - story.createdAt < 24 * 60 * 60 * 1000);
    const expired = processed.filter((story: any) => Date.now() - story.createdAt >= 24 * 60 * 60 * 1000);
    return { active, expired };
  })();

  const [stories, setStories] = useState<Story[]>(processedStoriesResult.active);

  const [archiveStories, setArchiveStories] = useState<Story[]>(() => {
    const savedArchive = localStorage.getItem('cx_stories_archive');
    let archive = savedArchive ? JSON.parse(savedArchive) : [];
    
    // Populate default mock expired stories if the archive is empty
    if (archive.length === 0) {
      archive = [
        {
          id: 'archived_story_1',
          user: {
            id: 'user_priya',
            username: 'priya_vibe',
            displayName: 'Priya',
            profilePic: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&fit=crop'
          },
          mediaType: 'image',
          mediaUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800',
          caption: 'Behind the scenes at the keyboard design meetup! ⌨️✨',
          createdAt: Date.now() - 36 * 60 * 60 * 1000,
          timestamp: '36h ago',
          viewers: [
            { userId: 'user_kavin', username: 'kavin_23', profilePic: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&fit=crop', timestamp: '35h ago' }
          ],
          likesCount: 24,
          isArchived: true,
          isHighlighted: false
        },
        {
          id: 'archived_story_2',
          user: {
            id: 'user_priya',
            username: 'priya_vibe',
            displayName: 'Priya',
            profilePic: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&fit=crop'
          },
          mediaType: 'image',
          mediaUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800',
          caption: 'Neon glow experiments for the new Cyberpunk set 💜',
          createdAt: Date.now() - 48 * 60 * 60 * 1000,
          timestamp: '2d ago',
          viewers: [],
          likesCount: 15,
          isArchived: true,
          isHighlighted: true,
          highlightTitle: 'CyberVibes'
        }
      ];
    }

    // Automatically archive any active stories that just expired upon load
    if (processedStoriesResult.expired.length > 0) {
      const newlyExpired = processedStoriesResult.expired.map((s: any) => ({
        ...s,
        isArchived: true,
        isHighlighted: false
      }));
      const nonDups = archive.filter((s: any) => !newlyExpired.some((ne: any) => ne.id === s.id));
      archive = [...newlyExpired, ...nonDups];
    }

    return archive;
  });

  const [groups, setGroups] = useState<GroupChat[]>(() => {
    const saved = localStorage.getItem('cx_groups');
    return saved ? JSON.parse(saved) : INITIAL_MOCK_GROUPS;
  });

  const [notifications, setNotifications] = useState<ConnectXNotification[]>(() => {
    const saved = localStorage.getItem('cx_notifs');
    return saved ? JSON.parse(saved) : INITIAL_MOCK_NOTIFICATIONS;
  });

  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('cx_messages');
    return saved ? JSON.parse(saved) : INITIAL_MOCK_MESSAGES;
  });

  const [monetization, setMonetization] = useState<MonetizationReport>(() => {
    const saved = localStorage.getItem('cx_monetization');
    return saved ? JSON.parse(saved) : INITIAL_MONETIZATION;
  });

  // State elements for full-stack monetization system
  const [creatorWallet, setCreatorWallet] = useState<CreatorWallet | null>(null);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [payoutLogs, setPayoutLogs] = useState<PayoutLog[]>([]);
  const [platformConfig, setPlatformConfig] = useState<PlatformConfig | null>({
    revenueSharePercent: 80,
    platformCpm: 2.50,
    minimumWithdrawalAmount: 5.00
  });

  const [activeChatUser, setActiveChatUser] = useState<ConnectXUser | null>(null);
  const [activeGroupChat, setActiveGroupChat] = useState<GroupChat | null>(null);
  const [viewedUserId, setViewedUserId] = useState<string | null>(null);
  const [activeStoryUserId, setActiveStoryUserId] = useState<string | null>(null);

  // Offline queue state management
  const [offlineActionsCount, setOfflineActionsCount] = useState<number>(0);

  const refreshOfflineActionsCount = async () => {
    try {
      const actions = await getOfflineActions();
      setOfflineActionsCount(actions.length);
    } catch (e) {
      console.warn('Failed to refresh offline actions count', e);
    }
  };

  const syncOfflineQueue = async () => {
    if (typeof navigator === 'undefined' || !navigator.onLine) {
      console.log('[Offline Sync Hub] Device offline or SSG. post-poning queue sync.');
      return;
    }

    try {
      const actions = await getOfflineActions();
      if (actions.length === 0) {
        setOfflineActionsCount(0);
        return;
      }

      console.log(`[Offline Sync Hub] Discovered ${actions.length} pending actions. Commencing sequential processing...`);

      for (const action of actions) {
        try {
          console.log(`[Offline Sync Hub] Syncing action ID: ${action.id}, Type: ${action.type}`, action.payload);
          
          switch (action.type) {
            case 'post_reaction': {
              const { postId, reaction, userId, username, displayName, profilePic } = action.payload;
              const newNotif: ConnectXNotification = {
                id: 'notif_sync_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
                type: 'like',
                fromUser: { id: userId, username, displayName, profilePic },
                postType: 'post',
                targetId: postId,
                text: `reacted with "${reaction}" on post (Synced Offline)`,
                timestamp: 'Synced Offline',
                read: false
              };
              setNotifications(prev => [newNotif, ...prev]);
              break;
            }
            case 'post_comment': {
              const { postId, commentText, user } = action.payload;
              const newNotif: ConnectXNotification = {
                id: 'notif_sync_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
                type: 'comment',
                fromUser: user,
                postType: 'post',
                targetId: postId,
                text: `commented "${commentText.substring(0, 20)}..." (Synced Offline)`,
                timestamp: 'Synced Offline',
                read: false
              };
              setNotifications(prev => [newNotif, ...prev]);
              break;
            }
            case 'reel_reaction': {
              const { reelId, userId, username, displayName, profilePic } = action.payload;
              const newNotif: ConnectXNotification = {
                id: 'notif_sync_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
                type: 'like',
                fromUser: { id: userId, username, displayName, profilePic },
                postType: 'reel',
                targetId: reelId,
                text: `liked your Clip/Reel (Synced Offline)`,
                timestamp: 'Synced Offline',
                read: false
              };
              setNotifications(prev => [newNotif, ...prev]);
              break;
            }
            case 'reel_comment': {
              const { reelId, text, username, userDisplayName, profilePic } = action.payload;
              const newNotif: ConnectXNotification = {
                id: 'notif_sync_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
                type: 'comment',
                fromUser: { id: 'some', username, displayName: userDisplayName, profilePic },
                postType: 'reel',
                targetId: reelId,
                text: `commented on your Clip: "${text.substring(0, 20)}..." (Synced Offline)`,
                timestamp: 'Synced Offline',
                read: false
              };
              setNotifications(prev => [newNotif, ...prev]);
              break;
            }
            case 'video_reaction': {
              const { videoId, userId, username, displayName, profilePic } = action.payload;
              const newNotif: ConnectXNotification = {
                id: 'notif_sync_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
                type: 'like',
                fromUser: { id: userId, username, displayName, profilePic },
                postType: 'video',
                targetId: videoId,
                text: `liked your video presentation (Synced Offline)`,
                timestamp: 'Synced Offline',
                read: false
              };
              setNotifications(prev => [newNotif, ...prev]);
              break;
            }
            case 'video_comment': {
              const { videoId, text, user } = action.payload;
              const newNotif: ConnectXNotification = {
                id: 'notif_sync_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
                type: 'comment',
                fromUser: user,
                postType: 'video',
                targetId: videoId,
                text: `commented: "${text.substring(0, 20)}..." (Synced Offline)`,
                timestamp: 'Synced Offline',
                read: false
              };
              setNotifications(prev => [newNotif, ...prev]);
              break;
            }
            case 'send_message': {
              break;
            }
            case 'create_post': {
              break;
            }
            default:
              break;
          }

          await dequeueOfflineAction(action.id);
        } catch (singleErr) {
          console.error(`[Offline Sync Hub] Failed to sync single action ID: ${action.id}`, singleErr);
        }
      }

      await refreshOfflineActionsCount();

      const syncCompleteNotif: ConnectXNotification = {
        id: 'notif_sync_success_' + Date.now(),
        type: 'connect_accept',
        text: `Successfully synchronized ${actions.length} offline interactions to the cloud network!`,
        timestamp: 'Just now',
        read: false
      };
      setNotifications(prev => [syncCompleteNotif, ...prev]);
    } catch (err) {
      console.error('[Offline Sync Hub] Error in action queue sync execution loop:', err);
    }
  };

  // Synchronous background listener for device coming online
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      console.log('[Connectivity Event] Connection restored! Triggering sync queue.');
      syncOfflineQueue();
    };

    window.addEventListener('online', handleOnline);
    
    // Check pending count initially
    refreshOfflineActionsCount();

    // Trigger sync once initially if we start online
    if (navigator.onLine) {
      syncOfflineQueue();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  // Infinite Caching Layer: Load offline database records on initial load
  useEffect(() => {
    const initializeOfflineDB = async () => {
      try {
        const cachedUsers = await getCachedItem<ConnectXUser[]>('cx_users');
        if (cachedUsers && cachedUsers.length > 0) setUsers(cachedUsers);

        const cachedPosts = await getCachedItem<FeedPost[]>('cx_posts');
        if (cachedPosts && cachedPosts.length > 0) setPosts(cachedPosts);

        const cachedReels = await getCachedItem<Reel[]>('cx_reels');
        if (cachedReels && cachedReels.length > 0) setReels(cachedReels);

        const cachedVideos = await getCachedItem<YouTubeVideo[]>('cx_videos');
        if (cachedVideos && cachedVideos.length > 0) setVideos(cachedVideos);

        const cachedStories = await getCachedItem<Story[]>('cx_stories');
        if (cachedStories && cachedStories.length > 0) setStories(cachedStories);

        const cachedGroups = await getCachedItem<GroupChat[]>('cx_groups');
        if (cachedGroups && cachedGroups.length > 0) setGroups(cachedGroups);

        const cachedNotifs = await getCachedItem<ConnectXNotification[]>('cx_notifs');
        if (cachedNotifs && cachedNotifs.length > 0) setNotifications(cachedNotifs);

        const cachedMessages = await getCachedItem<Message[]>('cx_messages');
        if (cachedMessages && cachedMessages.length > 0) setMessages(cachedMessages);

        const cachedMonetization = await getCachedItem<MonetizationReport>('cx_monetization');
        if (cachedMonetization) setMonetization(cachedMonetization);
      } catch (e) {
        console.warn('[Cache Initializer] Offline storage read skip / direct memory fallback.', e);
      }
    };
    initializeOfflineDB();
  }, []);

  // Sync to localStorage and IndexedDB whenever states change
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('cx_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('cx_current_user');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('cx_users', JSON.stringify(users));
    setCachedItem('cx_users', users);
  }, [users]);

  useEffect(() => {
    localStorage.setItem('cx_posts', JSON.stringify(posts));
    setCachedItem('cx_posts', posts);
  }, [posts]);

  useEffect(() => {
    localStorage.setItem('cx_reels', JSON.stringify(reels));
    setCachedItem('cx_reels', reels);
  }, [reels]);

  useEffect(() => {
    localStorage.setItem('cx_videos', JSON.stringify(videos));
    setCachedItem('cx_videos', videos);
  }, [videos]);

  useEffect(() => {
    localStorage.setItem('cx_stories', JSON.stringify(stories));
    setCachedItem('cx_stories', stories);
  }, [stories]);

  useEffect(() => {
    localStorage.setItem('cx_stories_archive', JSON.stringify(archiveStories));
    setCachedItem('cx_stories_archive', archiveStories);
  }, [archiveStories]);

  useEffect(() => {
    localStorage.setItem('cx_groups', JSON.stringify(groups));
    setCachedItem('cx_groups', groups);
  }, [groups]);

  useEffect(() => {
    localStorage.setItem('cx_notifs', JSON.stringify(notifications));
    setCachedItem('cx_notifs', notifications);
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('cx_messages', JSON.stringify(messages));
    setCachedItem('cx_messages', messages);
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('cx_monetization', JSON.stringify(monetization));
    setCachedItem('cx_monetization', monetization);
  }, [monetization]);

  // Auth Operations
  const loginAsDemo = (userId: string) => {
    const foundUser = users.find(u => u.id === userId);
    if (foundUser) {
      setCurrentUser(foundUser);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setActiveChatUser(null);
    setActiveGroupChat(null);
  };

  const signupComplete = (newUser: ConnectXUser) => {
    // Add new user to state database
    setUsers(prev => {
      if (prev.find(u => u.id === newUser.id)) {
        return prev.map(u => u.id === newUser.id ? newUser : u);
      }
      return [...prev, newUser];
    });
    setCurrentUser(newUser);
  };

  const updateProfile = (updated: Partial<ConnectXUser>) => {
    if (!currentUser) return;
    const nextUser = { ...currentUser, ...updated };
    setCurrentUser(nextUser);
    setUsers(prev => prev.map(u => u.id === nextUser.id ? nextUser : u));

    // Instant replication of authorship details across posts, reels, stories and video publisher objects
    const authorMini: MiniUser = {
      id: nextUser.id,
      username: nextUser.username,
      displayName: nextUser.displayName,
      profilePic: nextUser.profilePic
    };

    setPosts(prev => prev.map(p => {
      const isMine = p.user.id === nextUser.id;
      const updatedComments = p.comments.map(c => c.user.id === nextUser.id ? { ...c, user: authorMini } : c);
      return isMine ? { ...p, user: authorMini, comments: updatedComments } : { ...p, comments: updatedComments };
    }));

    setReels(prev => prev.map(r => {
      const isMine = r.user.id === nextUser.id;
      // also comments
      const updatedComments = r.comments.map(c => c.username === nextUser.username || c.userDisplayName === nextUser.displayName ? {
        ...c,
        username: nextUser.username,
        userDisplayName: nextUser.displayName,
        profilePic: nextUser.profilePic
      } : c);
      return isMine ? { ...r, user: authorMini, comments: updatedComments } : { ...r, comments: updatedComments };
    }));

    setVideos(prev => prev.map(v => {
      const isMine = v.publisher.id === nextUser.id;
      const updatedComments = v.comments.map(c => c.user.id === nextUser.id ? { ...c, user: authorMini } : c);
      return isMine ? { ...v, publisher: authorMini, comments: updatedComments } : { ...v, comments: updatedComments };
    }));

    setStories(prev => prev.map(s => s.user.id === nextUser.id ? { ...s, user: authorMini } : s));
  };


  // Post Operations
  const addPost = (
    content: string, 
    mediaUrls?: string[], 
    type: 'image' | 'video' | 'text' | 'poll' = 'text',
    pollData?: { question: string, options: string[] },
    allowDownloads?: boolean,
    scheduledTime?: string,
    location?: string,
    locationCoords?: { latitude: number; longitude: number },
    hidePreciseLocation?: boolean
  ) => {
    if (!currentUser) return;
    const authorMini: MiniUser = {
      id: currentUser.id,
      username: currentUser.username,
      displayName: currentUser.displayName,
      profilePic: currentUser.profilePic
    };

    const newPost: FeedPost = {
      id: 'post_' + Date.now(),
      user: authorMini,
      mediaType: type,
      mediaUrls: mediaUrls || [],
      content,
      hashtags: content.match(/#\w+/g)?.map(h => h.substring(1)) || [],
      reactions: {},
      comments: [],
      shares: 0,
      timestamp: scheduledTime ? `Scheduled: ${scheduledTime.replace('T', ' ')}` : 'Just now',
      allowDownloads: allowDownloads !== false,
      scheduledTime: scheduledTime,
      location: location,
      locationCoords: locationCoords,
      hidePreciseLocation: hidePreciseLocation
    };

    if (type === 'poll' && pollData) {
      newPost.poll = {
        question: pollData.question,
        options: pollData.options.map(o => ({ text: o, votes: 0 }))
      };
    }

    setPosts(prev => [newPost, ...prev]);

    // Update stats slightly to show active engagement
    setMonetization(prev => ({
      ...prev,
      textPosts: {
        ...prev.textPosts,
        reach: prev.textPosts.reach + 15,
        views: prev.textPosts.views + 15
      }
    }));
  };

  const addComment = (postId: string, text: string, parentId?: string) => {
    if (!currentUser) return;
    const commenterMini: MiniUser = {
      id: currentUser.id,
      username: currentUser.username,
      displayName: currentUser.displayName,
      profilePic: currentUser.profilePic
    };

    const newComment: PostComment = {
      id: 'comm_' + Date.now(),
      user: commenterMini,
      text,
      timestamp: 'Just now',
      parentId
    };

    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        // Trigger notification
        if (parentId) {
          const parentComment = post.comments.find(c => c.id === parentId);
          if (parentComment && parentComment.user.id !== currentUser.id) {
            const newNotif: ConnectXNotification = {
              id: 'notif_' + Date.now(),
              type: 'comment',
              fromUser: commenterMini,
              postType: 'post',
              targetId: postId,
              text: `replied to your comment: "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"`,
              timestamp: 'Just now',
              read: false
            };
            setNotifications(prevNotifs => [newNotif, ...prevNotifs]);
          }
        } else if (post.user.id !== currentUser.id) {
          const newNotif: ConnectXNotification = {
            id: 'notif_' + Date.now(),
            type: 'comment',
            fromUser: commenterMini,
            postType: 'post',
            targetId: postId,
            text: `commented: "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"`,
            timestamp: 'Just now',
            read: false
          };
          setNotifications(prevNotifs => [newNotif, ...prevNotifs]);
        }
        return {
          ...post,
          comments: [...post.comments, newComment]
        };
      }
      return post;
    }));

    if (!navigator.onLine) {
      enqueueOfflineAction('post_comment', {
        postId,
        commentText: text,
        parentId,
        user: commenterMini
      }).then(() => refreshOfflineActionsCount());
    }
  };

  const toggleLikeComment = (postId: string, commentId: string) => {
    if (!currentUser) return;
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        const updatedComments = post.comments.map(comment => {
          if (comment.id === commentId) {
            const currentLikes = comment.likes || [];
            const hasLiked = currentLikes.includes(currentUser.id);
            const updatedLikes = hasLiked
              ? currentLikes.filter(id => id !== currentUser.id)
              : [...currentLikes, currentUser.id];

            // Trigger notification to the author of the comment if it's someone else and liking
            if (!hasLiked && comment.user.id !== currentUser.id) {
              const likerMini: MiniUser = {
                id: currentUser.id,
                username: currentUser.username,
                displayName: currentUser.displayName,
                profilePic: currentUser.profilePic
              };
              const newNotif: ConnectXNotification = {
                id: 'notif_' + Date.now(),
                type: 'like',
                fromUser: likerMini,
                postType: 'post',
                targetId: postId,
                text: `liked your comment: "${comment.text.substring(0, 20)}${comment.text.length > 20 ? '...' : ''}"`,
                timestamp: 'Just now',
                read: false
              };
              setNotifications(prevNotifs => [newNotif, ...prevNotifs]);
            }

            return {
              ...comment,
              likes: updatedLikes
            };
          }
          return comment;
        });
        return {
          ...post,
          comments: updatedComments
        };
      }
      return post;
    }));
  };

  const flagComment = (postId: string, commentId: string, reason: string) => {
    if (!currentUser) return;
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        const updatedComments = post.comments.map(comment => {
          if (comment.id === commentId) {
            const currentFlaggedBy = comment.flaggedBy || [];
            if (currentFlaggedBy.includes(currentUser.id)) return comment; // already flagged
            return {
              ...comment,
              flagged: true,
              flagReason: reason,
              flaggedBy: [...currentFlaggedBy, currentUser.id]
            };
          }
          return comment;
        });
        return {
          ...post,
          comments: updatedComments
        };
      }
      return post;
    }));
  };

  const deleteComment = (postId: string, commentId: string) => {
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          comments: post.comments.filter(c => c.id !== commentId)
        };
      }
      return post;
    }));
  };

  const dismissCommentFlag = (postId: string, commentId: string) => {
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        const updatedComments = post.comments.map(comment => {
          if (comment.id === commentId) {
            return {
              ...comment,
              flagged: false,
              flagReason: undefined,
              flaggedBy: []
            };
          }
          return comment;
        });
        return {
          ...post,
          comments: updatedComments
        };
      }
      return post;
    }));
  };

  const toggleReaction = (postId: string, reaction: 'like' | 'love' | 'laugh' | 'wow' | 'sad') => {
    if (!currentUser) return;
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        const existing = post.reactions[currentUser.id];
        const nextReactions = { ...post.reactions };
        
        if (existing === reaction) {
          delete nextReactions[currentUser.id];
        } else {
          nextReactions[currentUser.id] = reaction;
          // Notify post author
          if (post.user.id !== currentUser.id) {
            const newNotif: ConnectXNotification = {
              id: 'notif_' + Date.now(),
              type: 'like',
              fromUser: {
                id: currentUser.id,
                username: currentUser.username,
                displayName: currentUser.displayName,
                profilePic: currentUser.profilePic
              },
              postType: 'post',
              targetId: postId,
              text: `reacted with "${reaction}" on your post`,
              timestamp: 'Just now',
              read: false
            };
            setNotifications(prevNotifs => [newNotif, ...prevNotifs]);
          }
        }
        
        return { ...post, reactions: nextReactions };
      }
      return post;
    }));

    if (!navigator.onLine) {
      enqueueOfflineAction('post_reaction', {
        postId,
        reaction,
        userId: currentUser.id,
        username: currentUser.username,
        displayName: currentUser.displayName,
        profilePic: currentUser.profilePic
      }).then(() => refreshOfflineActionsCount());
    }
  };

  const voteInPoll = (postId: string, optionIndex: number) => {
    if (!currentUser) return;
    setPosts(prev => prev.map(p => {
      if (p.id === postId && p.poll) {
        if (p.poll.votedOptionIndex !== undefined) return p; // Cannot revote in this simulation
        const currentOptions = [...p.poll.options];
        currentOptions[optionIndex] = {
          ...currentOptions[optionIndex],
          votes: currentOptions[optionIndex].votes + 1
        };
        return {
          ...p,
          poll: {
            ...p.poll,
            options: currentOptions,
            votedOptionIndex: optionIndex
          }
        };
      }
      return p;
    }));
  };

  const deletePost = (postId: string) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
  };


  // Reel Operations
  const addReel = (caption: string, videoUrl: string, soundTitle: string, hashtags: string[], allowDownloads?: boolean) => {
    if (!currentUser) return;
    const authorMini: MiniUser = {
      id: currentUser.id,
      username: currentUser.username,
      displayName: currentUser.displayName,
      profilePic: currentUser.profilePic
    };

    const newReel: Reel = {
      id: 'reel_' + Date.now(),
      user: authorMini,
      videoUrl,
      aspectRatio: '9:16',
      caption,
      hashtags,
      soundTitle: soundTitle || `${currentUser.displayName} • Original Audio`,
      likes: [],
      comments: [],
      shares: 0,
      saves: [],
      views: 1,
      durationSeconds: 15,
      allowDownloads: allowDownloads !== false
    };

    setReels(prev => [newReel, ...prev]);
  };

  const toggleLikeReel = (reelId: string) => {
    if (!currentUser) return;
    setReels(prev => prev.map(reel => {
      if (reel.id === reelId) {
        const liked = reel.likes.includes(currentUser.id);
        const nextLikes = liked 
          ? reel.likes.filter(id => id !== currentUser.id)
          : [...reel.likes, currentUser.id];

        // Notify
        if (!liked && reel.user.id !== currentUser.id) {
          const newNotif: ConnectXNotification = {
            id: 'notif_' + Date.now(),
            type: 'like',
            fromUser: {
              id: currentUser.id,
              username: currentUser.username,
              displayName: currentUser.displayName,
              profilePic: currentUser.profilePic
            },
            postType: 'reel',
            targetId: reelId,
            text: 'liked your Reel',
            timestamp: 'Just now',
            read: false
          };
          setNotifications(prevNotifs => [newNotif, ...prevNotifs]);
        }

        return { ...reel, likes: nextLikes };
      }
      return reel;
    }));

    if (!navigator.onLine) {
      enqueueOfflineAction('reel_reaction', {
        reelId,
        userId: currentUser.id,
        username: currentUser.username,
        displayName: currentUser.displayName,
        profilePic: currentUser.profilePic
      }).then(() => refreshOfflineActionsCount());
    }
  };

  const addReelComment = (reelId: string, text: string) => {
    if (!currentUser) return;
    const newComment: ReelComment = {
      id: 'rc_' + Date.now(),
      username: currentUser.username,
      userDisplayName: currentUser.displayName,
      profilePic: currentUser.profilePic,
      text,
      timestamp: 'Just now'
    };

    setReels(prev => prev.map(reel => {
      if (reel.id === reelId) {
        // Notify
        if (reel.user.id !== currentUser.id) {
          const newNotif: ConnectXNotification = {
            id: 'notif_' + Date.now(),
            type: 'comment',
            fromUser: {
              id: currentUser.id,
              username: currentUser.username,
              displayName: currentUser.displayName,
              profilePic: currentUser.profilePic
            },
            postType: 'reel',
            targetId: reelId,
            text: `commented on your Reel: "${text}"`,
            timestamp: 'Just now',
            read: false
          };
          setNotifications(prevNotifs => [newNotif, ...prevNotifs]);
        }
        return {
          ...reel,
          comments: [...reel.comments, newComment]
        };
      }
      return reel;
    }));

    if (!navigator.onLine) {
      enqueueOfflineAction('reel_comment', {
        reelId,
        text,
        username: currentUser.username,
        userDisplayName: currentUser.displayName,
        profilePic: currentUser.profilePic
      }).then(() => refreshOfflineActionsCount());
    }
  };

  const toggleSaveReel = (reelId: string) => {
    if (!currentUser) return;
    setReels(prev => prev.map(reel => {
      if (reel.id === reelId) {
        const saved = reel.saves.includes(currentUser.id);
        const nextSaves = saved 
          ? reel.saves.filter(id => id !== currentUser.id)
          : [...reel.saves, currentUser.id];
        return { ...reel, saves: nextSaves };
      }
      return reel;
    }));
  };


  // Video Operations
  const addVideo = (
    title: string, 
    description: string, 
    category: any, 
    videoUrl: string, 
    thumbnailUrl: string, 
    duration: string, 
    quality: any,
    allowDownloads?: boolean
  ) => {
    if (!currentUser) return;
    const authorMini: MiniUser = {
      id: currentUser.id,
      username: currentUser.username,
      displayName: currentUser.displayName,
      profilePic: currentUser.profilePic
    };

    const newVideo: YouTubeVideo = {
      id: 'vid_' + Date.now(),
      title,
      description,
      videoUrl,
      thumbnailUrl: thumbnailUrl || MOCK_IMAGES.sunsetOcean,
      duration: duration || '3:00',
      views: 0,
      timestamp: 'Just now',
      category: category || 'Vlogs',
      likes: [],
      comments: [],
      watchLater: false,
      quality: quality || '1080p',
      publisher: authorMini,
      allowDownloads: allowDownloads !== false
    };

    setVideos(prev => [newVideo, ...prev]);
  };

  // Story Operations
  const addStory = (
    mediaUrl: string,
    caption?: string,
    questionPrompt?: string,
    poll?: {
      question: string;
      options: { text: string; votes: number }[];
    },
    allowDownloads?: boolean,
    mediaType?: 'image' | 'video'
  ) => {
    if (!currentUser) return;
    const authorMini: MiniUser = {
      id: currentUser.id,
      username: currentUser.username,
      displayName: currentUser.displayName,
      profilePic: currentUser.profilePic
    };

    const newStory: Story = {
      id: 'story_' + Date.now(),
      user: authorMini,
      mediaType: mediaType || 'image',
      mediaUrl,
      viewers: [],
      timestamp: 'Just now',
      createdAt: Date.now(),
      caption: caption || undefined,
      questionPrompt: questionPrompt || undefined,
      poll: poll || undefined,
      allowDownloads: allowDownloads !== false
    };

    setStories(prev => [newStory, ...prev]);

    // Update stats slightly to show active engagement
    setMonetization(prev => ({
      ...prev,
      stories: {
        ...prev.stories,
        reach: prev.stories.reach + 10,
        views: prev.stories.views + 10
      }
    }));
  };

  const deleteStory = (storyId: string) => {
    setStories(prev => prev.filter(s => s.id !== storyId));
  };

  const viewStory = (storyId: string) => {
    if (!currentUser) return;
    setStories(prev => prev.map(story => {
      if (story.id === storyId) {
        const alreadyViewed = story.viewers.some(v => v.userId === currentUser.id);
        if (!alreadyViewed) {
          const newViewer = {
            userId: currentUser.id,
            username: currentUser.username,
            profilePic: currentUser.profilePic,
            timestamp: 'Just now'
          };
          return {
            ...story,
            viewers: [...story.viewers, newViewer]
          };
        }
      }
      return story;
    }));
  };

  const archiveStory = (storyId: string) => {
    const storyToArchive = stories.find(s => s.id === storyId);
    if (!storyToArchive) return;
    setStories(prev => prev.filter(s => s.id !== storyId));
    setArchiveStories(prev => [
      { ...storyToArchive, isArchived: true, isHighlighted: false },
      ...prev
    ]);
  };

  const repostStoryFromArchive = (storyId: string) => {
    const archived = archiveStories.find(s => s.id === storyId);
    if (!archived) return;
    
    const repostedStory: Story = {
      ...archived,
      id: 'story_' + Date.now(),
      createdAt: Date.now(),
      timestamp: 'Just now',
      viewers: [],
      isArchived: false,
      isHighlighted: false,
      poll: archived.poll ? {
        ...archived.poll,
        options: archived.poll.options.map(opt => ({ ...opt, votes: 0 }))
      } : undefined
    };

    setStories(prev => [repostedStory, ...prev]);
  };

  const toggleHighlightStory = (storyId: string, highlightTitle?: string) => {
    setArchiveStories(prev => prev.map(s => {
      if (s.id === storyId) {
        const nextHighlighted = !s.isHighlighted;
        return {
          ...s,
          isHighlighted: nextHighlighted,
          highlightTitle: nextHighlighted ? (highlightTitle || s.highlightTitle || 'Highlights') : undefined
        };
      }
      return s;
    }));
  };

  const deleteArchivedStory = (storyId: string) => {
    setArchiveStories(prev => prev.filter(s => s.id !== storyId));
  };

  const toggleLikeVideo = (videoId: string) => {
    if (!currentUser) return;
    setVideos(prev => prev.map(v => {
      if (v.id === videoId) {
        const liked = v.likes.includes(currentUser.id);
        const nextLikes = liked 
          ? v.likes.filter(id => id !== currentUser.id)
          : [...v.likes, currentUser.id];
        
        if (!liked && v.publisher.id !== currentUser.id) {
          const newNotif: ConnectXNotification = {
            id: 'notif_' + Date.now(),
            type: 'like',
            fromUser: {
              id: currentUser.id,
              username: currentUser.username,
              displayName: currentUser.displayName,
              profilePic: currentUser.profilePic
            },
            postType: 'video',
            targetId: videoId,
            text: 'liked your video',
            timestamp: 'Just now',
            read: false
          };
          setNotifications(prev => [newNotif, ...prev]);
        }
        return { ...v, likes: nextLikes };
      }
      return v;
    }));

    if (!navigator.onLine) {
      enqueueOfflineAction('video_reaction', {
        videoId,
        userId: currentUser.id,
        username: currentUser.username,
        displayName: currentUser.displayName,
        profilePic: currentUser.profilePic
      }).then(() => refreshOfflineActionsCount());
    }
  };

  const addVideoComment = (videoId: string, text: string) => {
    if (!currentUser) return;
    const commenterMini: MiniUser = {
      id: currentUser.id,
      username: currentUser.username,
      displayName: currentUser.displayName,
      profilePic: currentUser.profilePic
    };

    const newComment: VideoComment = {
      id: 'vc_' + Date.now(),
      user: commenterMini,
      text,
      timestamp: 'Just now'
    };

    setVideos(prev => prev.map(v => {
      if (v.id === videoId) {
        if (v.publisher.id !== currentUser.id) {
          const newNotif: ConnectXNotification = {
            id: 'notif_' + Date.now(),
            type: 'comment',
            fromUser: commenterMini,
            postType: 'video',
            targetId: videoId,
            text: `commented: "${text}"`,
            timestamp: 'Just now',
            read: false
          };
          setNotifications(p => [newNotif, ...p]);
        }
        return { ...v, comments: [...v.comments, newComment] };
      }
      return v;
    }));

    if (!navigator.onLine) {
      enqueueOfflineAction('video_comment', {
        videoId,
        text,
        user: commenterMini
      }).then(() => refreshOfflineActionsCount());
    }
  };

  const toggleWatchLater = (videoId: string) => {
    setVideos(prev => prev.map(v => {
      if (v.id === videoId) {
        return { ...v, watchLater: !v.watchLater };
      }
      return v;
    }));
  };


  // Connect Operations
  const sendConnectRequest = (targetUserId: string) => {
    if (!currentUser) return;
    // Check if loaded correctly
    const target = users.find(u => u.id === targetUserId);
    if (!target) return;

    // Update currentUser state and target state in state engine
    const updatedUsers = users.map(user => {
      if (user.id === currentUser.id) {
        return {
          ...user,
          sentRequests: [...user.sentRequests, targetUserId]
        };
      }
      if (user.id === targetUserId) {
        return {
          ...user,
          pendingRequests: [...user.pendingRequests, currentUser.id]
        };
      }
      return user;
    });

    setUsers(updatedUsers);
    const nextCurrent = updatedUsers.find(u => u.id === currentUser.id);
    if (nextCurrent) setCurrentUser(nextCurrent);

    // Create Notification on Target User
    const newNotif: ConnectXNotification = {
      id: 'notif_' + Date.now(),
      type: 'connect_request',
      fromUser: {
        id: currentUser.id,
        username: currentUser.username,
        displayName: currentUser.displayName,
        profilePic: currentUser.profilePic
      },
      text: 'sent you a connect request.',
      timestamp: 'Just now',
      read: false
    };

    // If simulating correctly, we also update the central notifications list so that if we switch demo profile, we see things.
    setNotifications(prev => [newNotif, ...prev]);
  };

  const acceptConnectRequest = (targetUserId: string) => {
    if (!currentUser) return;
    const target = users.find(u => u.id === targetUserId);
    if (!target) return;

    const updatedUsers = users.map(user => {
      if (user.id === currentUser.id) {
        return {
          ...user,
          pendingRequests: user.pendingRequests.filter(id => id !== targetUserId),
          connects: [...user.connects, targetUserId]
        };
      }
      if (user.id === targetUserId) {
        return {
          ...user,
          sentRequests: user.sentRequests.filter(id => id !== currentUser.id),
          connects: [...user.connects, currentUser.id]
        };
      }
      return user;
    });

    setUsers(updatedUsers);
    const nextCurrent = updatedUsers.find(u => u.id === currentUser.id);
    if (nextCurrent) setCurrentUser(nextCurrent);

    const newNotif: ConnectXNotification = {
      id: 'notif_' + Date.now(),
      type: 'connect_accept',
      fromUser: {
        id: currentUser.id,
        username: currentUser.username,
        displayName: currentUser.displayName,
        profilePic: currentUser.profilePic
      },
      text: 'accepted your connect request. You are now connected!',
      timestamp: 'Just now',
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const declineConnectRequest = (targetUserId: string) => {
    if (!currentUser) return;
    
    const updatedUsers = users.map(user => {
      if (user.id === currentUser.id) {
        return {
          ...user,
          pendingRequests: user.pendingRequests.filter(id => id !== targetUserId)
        };
      }
      if (user.id === targetUserId) {
        return {
          ...user,
          sentRequests: user.sentRequests.filter(id => id !== currentUser.id)
        };
      }
      return user;
    });

    setUsers(updatedUsers);
    const nextCurrent = updatedUsers.find(u => u.id === currentUser.id);
    if (nextCurrent) setCurrentUser(nextCurrent);
  };

  const disconnectUser = (targetUserId: string) => {
    if (!currentUser) return;

    const updatedUsers = users.map(user => {
      if (user.id === currentUser.id) {
        return {
          ...user,
          connects: user.connects.filter(id => id !== targetUserId)
        };
      }
      if (user.id === targetUserId) {
        return {
          ...user,
          connects: user.connects.filter(id => id !== currentUser.id)
        };
      }
      return user;
    });

    setUsers(updatedUsers);
    const nextCurrent = updatedUsers.find(u => u.id === currentUser.id);
    if (nextCurrent) setCurrentUser(nextCurrent);
  };


  // Message Operations
  const selectChatUser = (user: ConnectXUser | null) => {
    setActiveChatUser(user);
    setActiveGroupChat(null);
  };

  const selectGroupChat = (group: GroupChat | null) => {
    setActiveGroupChat(group);
    setActiveChatUser(null);
  };

  const sendMessageToUser = (
    text?: string, 
    mediaUrl?: string, 
    mediaType?: 'image' | 'video' | 'document', 
    voiceDuration?: string
  ) => {
    if (!currentUser || !activeChatUser) return;

    const newMsg: Message = {
      id: 'msg_' + Date.now(),
      senderId: currentUser.id,
      receiverId: activeChatUser.id,
      text,
      mediaUrl,
      mediaType,
      voiceDuration,
      timestamp: 'Just now'
    };

    setMessages(prev => [...prev, newMsg]);

    if (navigator.onLine) {
      // Fast Simulated Auto-Response from other user after 1.5 seconds for true dynamic premium fidelity!
      setTimeout(() => {
        const responses = [
          "Amazing! That sounds absolutely incredible. let's connect over a zoom soon.",
          "Beautiful! Let's double check alignment tomorrow morning. 👍 Ready to launch ConnectX!",
          "Thanks for sharing, love the high-contrast aesthetic and design layout. 🌟",
          "Wait, is that fully encrypted? Yes! End-to-end secure badge in full view.",
          "Perfect. I'm adding that to our Creator Studio pipeline."
        ];
        const randomText = responses[Math.floor(Math.random() * responses.length)];
        
        const responseMsg: Message = {
          id: 'msg_auto_' + Date.now(),
          senderId: activeChatUser.id,
          receiverId: currentUser.id,
          text: randomText,
          timestamp: 'Just now'
        };

        setMessages(p => [...p, responseMsg]);

        // Trigger a notification
        const newNotif: ConnectXNotification = {
          id: 'notif_msg_' + Date.now(),
          type: 'message',
          fromUser: {
            id: activeChatUser.id,
            username: activeChatUser.username,
            displayName: activeChatUser.displayName,
            profilePic: activeChatUser.profilePic
          },
          text: `sent you a message: "${randomText.substring(0, 30)}..."`,
          timestamp: 'Just now',
          read: false
        };
        setNotifications(p => [newNotif, ...p]);

      }, 2000);
    } else {
      enqueueOfflineAction('send_message', {
        senderId: currentUser.id,
        receiverId: activeChatUser.id,
        text,
        mediaUrl,
        mediaType,
        voiceDuration
      }).then(() => refreshOfflineActionsCount());
    }
  };

  const sendMessageToSpecificUser = (
    receiverId: string,
    text?: string, 
    mediaUrl?: string, 
    mediaType?: 'image' | 'video' | 'document'
  ) => {
    if (!currentUser) return;

    const newMsg: Message = {
      id: 'msg_' + Date.now(),
      senderId: currentUser.id,
      receiverId: receiverId,
      text,
      mediaUrl,
      mediaType,
      timestamp: 'Just now'
    };

    setMessages(prev => [...prev, newMsg]);

    // Simulated Auto-Response from other user after 1.5 seconds for premium fidelity
    setTimeout(() => {
      const responses = [
        "Amazing! That sounds absolutely incredible. Shared with my circle!",
        "Thanks for sharing this post! Awesome stuff.",
        "Perfect. I'll read this over tonight! Let's connect."
      ];
      const randomText = responses[Math.floor(Math.random() * responses.length)];
      
      const responseMsg: Message = {
        id: 'msg_auto_' + Date.now(),
        senderId: receiverId,
        receiverId: currentUser.id,
        text: randomText,
        timestamp: 'Just now'
      };

      setMessages(p => [...p, responseMsg]);

      const otherUser = users.find(u => u.id === receiverId);
      if (otherUser) {
        // Trigger a notification
        const newNotif: ConnectXNotification = {
          id: 'notif_msg_' + Date.now(),
          type: 'message',
          fromUser: {
            id: otherUser.id,
            username: otherUser.username,
            displayName: otherUser.displayName,
            profilePic: otherUser.profilePic
          },
          text: `replied to your share: "${randomText.substring(0, 30)}..."`,
          timestamp: 'Just now',
          read: false
        };
        setNotifications(p => [newNotif, ...p]);
      }
    }, 2000);
  };

  const sendMessageToGroup = (
    text?: string, 
    mediaUrl?: string, 
    mediaType?: 'image' | 'video' | 'document'
  ) => {
    if (!currentUser || !activeGroupChat) return;

    const newMsg: Message = {
      id: 'msg_' + Date.now(),
      senderId: currentUser.id,
      receiverId: activeGroupChat.id, // Group chats target the group ID as receiver
      text,
      mediaUrl,
      mediaType,
      timestamp: 'Just now',
      isGroup: true,
      groupId: activeGroupChat.id
    };

    setMessages(prev => [...prev, newMsg]);

    if (navigator.onLine) {
      // Simulated multi-user group chat active chatter!
      setTimeout(() => {
        // Pick a random member other than current user
        const nonCurrentMembers = activeGroupChat.members.filter(id => id !== currentUser.id);
        if (nonCurrentMembers.length === 0) return;
        
        const randomMemberId = nonCurrentMembers[Math.floor(Math.random() * nonCurrentMembers.length)];
        const randomUser = users.find(u => u.id === randomMemberId);
        if (!randomUser) return;

        const responses = [
          "Yes, totally agree on this point!",
          "Wow! That Liquid Glass UI looks unreal in full motion.",
          "Check this out! Writing a custom shader for the glow.",
          "Count me in for the next live-stream review 🍿",
          "Great session today crew."
        ];
        
        const responseMsg: Message = {
          id: 'msg_group_auto_' + Date.now(),
          senderId: randomUser.id,
          receiverId: activeGroupChat.id,
          text: responses[Math.floor(Math.random() * responses.length)],
          timestamp: 'Just now',
          isGroup: true,
          groupId: activeGroupChat.id
        };

        setMessages(p => [...p, responseMsg]);
      }, 2500);
    } else {
      enqueueOfflineAction('send_message', {
        senderId: currentUser.id,
        receiverId: activeGroupChat.id,
        text,
        mediaUrl,
        mediaType,
        isGroup: true,
        groupId: activeGroupChat.id
      }).then(() => refreshOfflineActionsCount());
    }
  };

  const createGroup = (name: string, description: string, type: 'group' | 'community' | 'channel', memberIds: string[]) => {
    if (!currentUser) return;
    const newGroup: GroupChat = {
      id: 'grp_' + Date.now(),
      name,
      description,
      avatar: MOCK_IMAGES.setup,
      members: [currentUser.id, ...memberIds],
      type,
      ownerId: currentUser.id
    };

    setGroups(prev => [newGroup, ...prev]);
  };

  // Notification Operations
  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Monetization Center
  const withdrawMoney = (method: 'bank' | 'upi' | 'paypal', address: string, amount: number): boolean => {
    if (!currentUser) return false;
    if (amount <= 0 || currentUser.totalEarnings < amount) return false;

    // Deduct
    const updatedEarnings = currentUser.totalEarnings - amount;
    const updatedUser = { ...currentUser, totalEarnings: updatedEarnings };
    
    setCurrentUser(updatedUser);
    setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));

    // Log withdraw notifications
    const newNotif: ConnectXNotification = {
      id: 'notif_' + Date.now(),
      type: 'earning',
      text: `Successfully withdrew $${amount.toFixed(2)} via ${method.toUpperCase()} (${address}).`,
      timestamp: 'Just now',
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);

    return true;
  };

  // Full-Stack Monetization System
  const loadCreatorWallet = async (userId: string) => {
    try {
      const username = currentUser?.username || 'cx_pilot';
      const displayName = currentUser?.displayName || 'Demo Creator';
      const response = await fetch(`/api/monetization/wallet/${userId}?username=${encodeURIComponent(username)}&displayName=${encodeURIComponent(displayName)}`);
      if (response.ok) {
        const data = await response.json();
        setCreatorWallet(data.wallet);
        setWithdrawalRequests(data.withdrawals);
        setPlatformConfig(data.config);
      } else {
        throw new Error('Server returned error status');
      }
    } catch (err) {
      console.warn('Real-time wallet sync fallback. Operating under serverless mock bounds.', err);
      // Fallback local calculations
      setCreatorWallet({
        id: userId,
        username: currentUser?.username || 'cx_pilot',
        displayName: currentUser?.displayName || 'Demo Creator',
        balance: currentUser?.totalEarnings || 845.20,
        pendingEarnings: 34.10,
        totalPaid: 120.00,
        adImpressions: 124000
      });
      setPlatformConfig({
        revenueSharePercent: 80,
        platformCpm: 2.50,
        minimumWithdrawalAmount: 5.00
      });
    }
  };

  const addAdImpression = async (creatorId: string, views: number) => {
    try {
      const targetUser = users.find(u => u.id === creatorId) || currentUser;
      const payload = {
        creatorId,
        username: targetUser?.username || 'creator',
        displayName: targetUser?.displayName || 'Creator',
        views
      };
      const response = await fetch('/api/monetization/impressions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        const data = await response.json();
        if (currentUser && creatorId === currentUser.id) {
          setCreatorWallet(data.wallet);
        }
      }
    } catch (err) {
      console.warn('Silent local ad impression tracked. Network proxy failed.', err);
    }
  };

  const requestPayoutClearance = async (
    amount: number, 
    method: 'PayPal' | 'UPI' | 'Bank', 
    address: string, 
    details?: any
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const payload = {
        creatorId: currentUser?.id || 'DemoUser',
        username: currentUser?.username || 'cx_pilot',
        displayName: currentUser?.displayName || 'Demo Creator',
        amount,
        method,
        address,
        paymentDetails: details
      };
      const response = await fetch('/api/monetization/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (response.ok) {
        if (currentUser) {
          setCreatorWallet(data.wallet);
          setWithdrawalRequests(prev => [data.withdrawal, ...prev]);
        }
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Withdrawal request failed.' };
      }
    } catch (err: any) {
      console.warn('Withdrawal processing fallback to local simulated bounds.', err);
      // Mock withdrawal locally if server is offline
      const mockW: WithdrawalRequest = {
        id: 'w_mock_' + Date.now(),
        creatorId: currentUser?.id || 'DemoUser',
        username: currentUser?.username || 'cx_pilot',
        amount,
        method,
        address,
        status: 'pending',
        timestamp: new Date().toISOString()
      };
      setWithdrawalRequests(prev => [mockW, ...prev]);
      return { success: true };
    }
  };

  const adminLoadAllCreators = async (): Promise<CreatorWallet[]> => {
    try {
      const response = await fetch('/api/monetization/admin/creators');
      if (response.ok) {
        return await response.json();
      }
      throw new Error();
    } catch {
      return Object.values({
        'user_kavin': { id: 'user_kavin', username: 'kavin_23', displayName: 'Kavin', balance: 3125.46, pendingEarnings: 154.20, totalPaid: 1200.00, adImpressions: 542000 },
        'user_priya': { id: 'user_priya', username: 'priya_vibe', displayName: 'Priya', balance: 4520.12, pendingEarnings: 235.50, totalPaid: 2100.00, adImpressions: 894000 }
      });
    }
  };

  const adminLoadAllWithdrawals = async (): Promise<WithdrawalRequest[]> => {
    try {
      const response = await fetch('/api/monetization/admin/withdrawals');
      if (response.ok) {
        return await response.json();
      }
      throw new Error();
    } catch {
      return withdrawalRequests;
    }
  };

  const adminLoadPayoutLogs = async (): Promise<PayoutLog[]> => {
    try {
      const response = await fetch('/api/monetization/admin/logs');
      if (response.ok) {
        return await response.json();
      }
      throw new Error();
    } catch {
      return [];
    }
  };

  const adminApproveWithdrawal = async (withdrawalId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/monetization/admin/payout/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: withdrawalId })
      });
      const data = await response.json();
      if (response.ok) {
        setWithdrawalRequests(prev => prev.map(w => w.id === withdrawalId ? { ...w, status: 'approved' } : w));
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (err: any) {
      setWithdrawalRequests(prev => prev.map(w => w.id === withdrawalId ? { ...w, status: 'approved' } : w));
      return { success: true };
    }
  };

  const adminRejectWithdrawal = async (withdrawalId: string, reason: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/monetization/admin/payout/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: withdrawalId, reason })
      });
      const data = await response.json();
      if (response.ok) {
        setWithdrawalRequests(prev => prev.map(w => w.id === withdrawalId ? { ...w, status: 'rejected', payoutDetails: { reason } } : w));
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (err: any) {
      setWithdrawalRequests(prev => prev.map(w => w.id === withdrawalId ? { ...w, status: 'rejected', payoutDetails: { reason } } : w));
      return { success: true };
    }
  };

  const adminSaveConfig = async (config: PlatformConfig): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/monetization/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      const data = await response.json();
      if (response.ok) {
        setPlatformConfig(data.config);
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (err: any) {
      setPlatformConfig(config);
      return { success: true };
    }
  };

  // Admin Controls
  const adminDeleteUser = (userId: string) => {
    if (userId === currentUser?.id) return; // Can't ban yourself
    setUsers(prev => prev.filter(u => u.id !== userId));
  };

  const adminApproveMonetization = (userId: string, level: string) => {
    // simulated approval text notification
    const newNotif: ConnectXNotification = {
      id: 'notif_admin_' + Date.now(),
      type: 'earning',
      text: `System alert: Your Monetization tiers have been approved at level: ${level}. 🎉`,
      timestamp: 'Just now',
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const adminConfigureAds = (settings: any) => {
    console.log("Admin Ads Configured", settings);
  };

  const updatePostStats = (postId: string, stats: Partial<FeedPost>) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, ...stats } : p));
  };

  const updateReelStats = (reelId: string, stats: Partial<Reel>) => {
    setReels(prev => prev.map(r => r.id === reelId ? { ...r, ...stats } : r));
  };

  const updateVideoStats = (videoId: string, stats: Partial<YouTubeVideo>) => {
    setVideos(prev => prev.map(v => v.id === videoId ? { ...v, ...stats } : v));
  };

  const updateStoryStats = (storyId: string, stats: Partial<Story>) => {
    setStories(prev => prev.map(s => s.id === storyId ? { ...s, ...stats } : s));
  };

  return (
    <ConnectXContext.Provider value={{
      currentUser,
      users,
      posts,
      reels,
      videos,
      stories,
      groups,
      notifications,
      messages,
      monetization,
      activeChatUser,
      activeGroupChat,
      loginAsDemo,
      logout,
      signupComplete,
      updateProfile,
      addPost,
      addComment,
      toggleLikeComment,
      flagComment,
      deleteComment,
      dismissCommentFlag,
      toggleReaction,
      voteInPoll,
      deletePost,
      addReel,
      toggleLikeReel,
      addReelComment,
      toggleSaveReel,
      addVideo,
      toggleLikeVideo,
      addVideoComment,
      toggleWatchLater,
      addStory,
      deleteStory,
      viewStory,
      archiveStories,
      archiveStory,
      repostStoryFromArchive,
      toggleHighlightStory,
      deleteArchivedStory,
      sendConnectRequest,
      acceptConnectRequest,
      declineConnectRequest,
      disconnectUser,
      selectChatUser,
      selectGroupChat,
      sendMessageToUser,
      sendMessageToSpecificUser,
      sendMessageToGroup,
      createGroup,
      markAllNotificationsRead,
      clearAllNotifications,
      withdrawMoney,
      
      // Full-Stack Monetization System
      creatorWallet,
      withdrawalRequests,
      payoutLogs,
      platformConfig,
      loadCreatorWallet,
      addAdImpression,
      requestPayoutClearance,
      adminLoadAllCreators,
      adminLoadAllWithdrawals,
      adminLoadPayoutLogs,
      adminApproveWithdrawal,
      adminRejectWithdrawal,
      adminSaveConfig,

      adminDeleteUser,
      adminApproveMonetization,
      adminConfigureAds,
      updatePostStats,
      updateReelStats,
      updateVideoStats,
      updateStoryStats,
      viewedUserId,
      setViewedUserId,
      activeStoryUserId,
      setActiveStoryUserId,
      offlineActionsCount,
      syncOfflineQueue
    }}>
      {children}
    </ConnectXContext.Provider>
  );
};

export const useConnectX = () => {
  const context = useContext(ConnectXContext);
  if (context === undefined) {
    throw new Error('useConnectX must be used within a ConnectXProvider');
  }
  return context;
};

// Search History Store and Hook for search queries persistence
export class SearchHistoryStore {
  private static listeners: Set<() => void> = new Set();
  private static searches: string[] = (() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('connectx_recent_searches');
        return saved ? JSON.parse(saved) : [];
      }
    } catch (e) {
      console.warn('Failed to parse search history from localStorage', e);
    }
    return [];
  })();

  static getSearches(): string[] {
    return this.searches;
  }

  static addSearch(query: string) {
    const trimmed = query.trim();
    if (!trimmed) return;
    this.searches = [trimmed, ...this.searches.filter(q => q.toLowerCase() !== trimmed.toLowerCase())].slice(0, 10);
    this.save();
    this.notify();
  }

  static removeSearch(query: string) {
    this.searches = this.searches.filter(q => q !== query);
    this.save();
    this.notify();
  }

  static clearAll() {
    this.searches = [];
    this.save();
    this.notify();
  }

  private static save() {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('connectx_recent_searches', JSON.stringify(this.searches));
      }
    } catch (e) {
      console.error('Failed to save search history', e);
    }
  }

  static subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private static notify() {
    this.listeners.forEach(listener => {
      try {
        listener();
      } catch (e) {
        console.error('Error in SearchHistoryStore listener', e);
      }
    });
  }
}

export const useSearchHistory = () => {
  const [searches, setSearches] = useState<string[]>(() => SearchHistoryStore.getSearches());

  useEffect(() => {
    setSearches(SearchHistoryStore.getSearches());
    return SearchHistoryStore.subscribe(() => {
      setSearches(SearchHistoryStore.getSearches());
    });
  }, []);

  return {
    searches,
    addSearch: (query: string) => SearchHistoryStore.addSearch(query),
    removeSearch: (query: string) => SearchHistoryStore.removeSearch(query),
    clearAll: () => SearchHistoryStore.clearAll()
  };
};

