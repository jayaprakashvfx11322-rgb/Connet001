/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface MiniUser {
  id: string;
  username: string;
  displayName: string;
  profilePic: string;
}

export interface ConnectXUser {
  id: string;
  username: string;
  displayName: string;
  email: string;
  bio: string;
  profilePic: string;
  coverPic: string;
  dob: string;
  location: string;
  website: string;
  interests: string[];
  connects: string[]; // Connected user IDs
  sentRequests: string[]; // Sent connect request user IDs
  pendingRequests: string[]; // Received connect request user IDs
  totalViews: number;
  totalReach: number;
  totalEarnings: number;
  accountType: 'google' | 'facebook' | 'instagram' | 'email';
}

export interface StoryViewer {
  userId: string;
  username: string;
  profilePic: string;
  timestamp: string;
}

export interface Story {
  id: string;
  user: MiniUser;
  mediaType: 'image' | 'video';
  mediaUrl: string;
  viewers: StoryViewer[];
  timestamp: string;
  createdAt?: number;
  caption?: string;
  poll?: {
    question: string;
    options: { text: string; votes: number }[];
  };
  questionPrompt?: string;
  likesCount?: number;
  commentsCount?: number;
  repostsCount?: number;
  sharesCount?: number;
  repliesCount?: number;
  downloadsCount?: number;
  allowDownloads?: boolean;
  boosts?: any;
}

export interface PostComment {
  id: string;
  user: MiniUser;
  text: string;
  timestamp: string;
}

export interface FeedPost {
  id: string;
  user: MiniUser;
  mediaType: 'image' | 'video' | 'text' | 'poll';
  mediaUrls?: string[];
  content: string;
  hashtags: string[];
  poll?: {
    question: string;
    options: { text: string; votes: number }[];
    votedOptionIndex?: number; // index the current user voted on
  };
  reactions: { [userId: string]: 'like' | 'love' | 'laugh' | 'wow' | 'sad' };
  comments: PostComment[];
  shares: number;
  timestamp: string;
  repostsCount?: number;
  repliesCount?: number;
  downloadsCount?: number;
  allowDownloads?: boolean;
  boosts?: any;
}

export interface ReelComment {
  id: string;
  username: string;
  userDisplayName: string;
  profilePic: string;
  text: string;
  timestamp: string;
}

export interface Reel {
  id: string;
  user: MiniUser;
  videoUrl: string;
  aspectRatio: '9:16';
  caption: string;
  hashtags: string[];
  soundTitle: string;
  likes: string[]; // User IDs who liked
  comments: ReelComment[];
  shares: number;
  saves: string[]; // User IDs who saved
  views: number;
  durationSeconds: number;
  repostsCount?: number;
  repliesCount?: number;
  downloadsCount?: number;
  allowDownloads?: boolean;
  boosts?: any;
}

export interface VideoComment {
  id: string;
  user: MiniUser;
  text: string;
  timestamp: string;
}

export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  videoUrl: string; // fallback stock or canvas simulation
  thumbnailUrl: string;
  duration: string; // e.g., "12:35"
  views: number;
  timestamp: string;
  category: 'Tech' | 'Gaming' | 'Vlogs' | 'Music' | 'Comedy' | 'Education';
  likes: string[]; // User IDs who liked
  comments: VideoComment[];
  watchLater: boolean;
  quality: '360p' | '480p' | '720p' | '1080p' | '4K';
  publisher: MiniUser;
  repostsCount?: number;
  sharesCount?: number;
  repliesCount?: number;
  downloadsCount?: number;
  allowDownloads?: boolean;
  boosts?: any;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  text?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'document';
  voiceDuration?: string; // e.g. "0:14"
  timestamp: string;
  isGroup?: boolean;
  groupId?: string;
}

export interface GroupChat {
  id: string;
  name: string;
  description: string;
  avatar: string;
  members: string[]; // User IDs
  type: 'group' | 'community' | 'channel';
  ownerId: string;
  unreadCount?: number;
}

export interface ConnectXNotification {
  id: string;
  type: 'like' | 'comment' | 'share' | 'connect_request' | 'connect_accept' | 'message' | 'mention' | 'earning';
  fromUser?: MiniUser;
  postType?: 'post' | 'reel' | 'video' | 'story';
  targetId?: string; // id of post, reel, video
  text: string;
  amount?: number; // specifically for 'earning' type
  timestamp: string;
  read: boolean;
}

export interface EarningMetric {
  views: number;
  reach: number;
  watchTimeHours: number;
  engagementPercent: number;
  earnings: number;
}

export interface MonetizationReport {
  videos: EarningMetric;
  reels: EarningMetric;
  imagePosts: EarningMetric;
  textPosts: EarningMetric;
  stories: EarningMetric;
}

export interface CreatorWallet {
  id: string; // creator ID
  username: string;
  displayName: string;
  balance: number;
  pendingEarnings: number;
  totalPaid: number;
  adImpressions: number;
}

export interface WithdrawalRequest {
  id: string;
  creatorId: string;
  username: string;
  amount: number;
  method: 'PayPal' | 'UPI' | 'Bank';
  address: string;
  status: 'pending' | 'approved' | 'rejected';
  timestamp: string;
  payoutDetails?: any;
  error?: string;
}

export interface PlatformConfig {
  revenueSharePercent: number;
  platformCpm: number;
  minimumWithdrawalAmount: number;
}

export interface PayoutLog {
  id: string;
  timestamp: string;
  type: 'impression' | 'withdrawal_request' | 'payout_approved' | 'payout_rejected' | 'config_change';
  creatorId?: string;
  amount?: number;
  message: string;
}

