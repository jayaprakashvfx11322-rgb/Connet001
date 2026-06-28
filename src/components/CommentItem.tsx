/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'motion/react';
import { PostComment, ConnectXUser } from '../types';
import { StoryAvatar } from './StoryAvatar';
import { 
  Heart, MessageCircle, Flag, AlertTriangle, ShieldAlert, X, Check
} from 'lucide-react';

const APP_START_TIME = Date.now();

export const getCommentCreationTime = (comm: PostComment): number => {
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

export const getRelativeTimeString = (creationTime: number, now: number): string => {
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

export interface CommentItemProps {
  comm: PostComment;
  postId: string;
  currentUser: ConnectXUser | null;
  toggleLikeComment: (postId: string, commentId: string) => void;
  flagComment: (postId: string, commentId: string, reason: string) => void;
  triggerHaptic: (type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection') => void;
  setViewedUserId: (id: string | null) => void;
  setCommentingPost?: (post: any | null) => void;
  addComment: (postId: string, text: string, parentId?: string) => void;
  replies?: PostComment[];
  isReply?: boolean;
}

export const CommentItem: React.FC<CommentItemProps> = ({
  comm,
  postId,
  currentUser,
  toggleLikeComment,
  flagComment,
  triggerHaptic,
  setViewedUserId,
  setCommentingPost,
  addComment,
  replies = [],
  isReply = false
}) => {
  const likesList = comm.likes || [];
  const isLiked = currentUser ? likesList.includes(currentUser.id) : false;
  const likesCount = likesList.length;

  const [optimisticLiked, setOptimisticLiked] = useState(isLiked);
  const [optimisticCount, setOptimisticCount] = useState(likesCount);
  const [isAnimating, setIsAnimating] = useState(false);

  const [showReportMenu, setShowReportMenu] = useState(false);
  const [customReason, setCustomReason] = useState('');
  const [isReported, setIsReported] = useState(comm.flaggedBy?.includes(currentUser?.id || '') || false);

  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState('');

  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const creationTime = useMemo(() => getCommentCreationTime(comm), [comm]);
  const relativeTime = getRelativeTimeString(creationTime, now);

  useEffect(() => {
    setOptimisticLiked(isLiked);
    setOptimisticCount(likesCount);
  }, [isLiked, likesCount]);

  useEffect(() => {
    setIsReported(comm.flaggedBy?.includes(currentUser?.id || '') || false);
  }, [comm.flaggedBy, currentUser?.id]);

  const handleLike = () => {
    if (!currentUser) return;
    
    const newLiked = !optimisticLiked;
    setOptimisticLiked(newLiked);
    setOptimisticCount(prev => newLiked ? prev + 1 : Math.max(0, prev - 1));
    
    if (newLiked) {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 800);
    }
    
    triggerHaptic(newLiked ? 'medium' : 'light');
    toggleLikeComment(postId, comm.id);
  };

  const handleReportToggle = () => {
    if (!currentUser) return;
    if (isReported) {
      triggerHaptic('warning');
      alert("You have already reported this comment. Thank you for keeping the platform safe.");
      return;
    }
    triggerHaptic('selection');
    setShowReportMenu(!showReportMenu);
  };

  const submitReport = (reasonStr: string) => {
    if (!currentUser) return;
    flagComment(postId, comm.id, reasonStr);
    setIsReported(true);
    setShowReportMenu(false);
    setCustomReason('');
    triggerHaptic('success');
  };

  return (
    <div className="flex flex-col w-full">
      {/* Main Comment Row */}
      <div className="flex gap-3 text-left items-start relative group animate-in fade-in duration-300 w-full">
        <StoryAvatar 
          userId={comm.user.id} 
          size={isReply ? "xs" : "sm"} 
          onClickOverride={() => { 
            setViewedUserId(comm.user.id); 
            if (setCommentingPost) {
              setCommentingPost(null); 
            }
          }} 
        />
        <div className="flex-grow bg-white/5 border border-white/5 py-2 px-3 rounded-2xl relative min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <span 
                onClick={() => { 
                  setViewedUserId(comm.user.id); 
                  if (setCommentingPost) {
                    setCommentingPost(null); 
                  }
                }}
                className="text-3xs font-bold text-white leading-none cursor-pointer hover:text-yellow-400 transition-colors"
              >
                {comm.user.displayName}
              </span>
              {comm.flagged && (
                <span className="flex items-center" title={`Moderator Warning: Flagged for ${comm.flagReason || 'offensive content'}`}>
                  <AlertTriangle className="w-3 h-3 text-amber-500 animate-pulse shrink-0" />
                </span>
              )}
            </div>
            <span className="text-5xs font-mono text-gray-500" title={`Added: ${comm.timestamp}`}>
              {relativeTime}
            </span>
          </div>
          
          {optimisticCount > 0 && (
            <div 
              id={`comment-like-badge-${comm.id}`} 
              className="mb-1.5 flex items-center gap-1 bg-pink-500/10 border border-pink-500/20 px-2 py-0.5 rounded-full text-[8.5px] font-mono text-pink-400 select-none w-fit animate-in zoom-in-95 duration-200"
            >
              <Heart className={`w-2.5 h-2.5 ${optimisticLiked ? 'fill-pink-500 text-pink-500' : 'text-pink-400'} shrink-0`} />
              <span className="font-bold">{optimisticCount} {optimisticCount === 1 ? 'like' : 'likes'}</span>
            </div>
          )}

          <p className="text-3xs text-gray-300 leading-normal pr-8">{comm.text}</p>
          
          {comm.flagged && (
            <div className="mt-1.5 flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded text-[8px] font-mono text-amber-400 select-none w-fit">
              <ShieldAlert className="w-2.5 h-2.5 text-amber-400 shrink-0" />
              <span>Moderator Flag: {comm.flagReason || 'Offensive content'}</span>
            </div>
          )}

          {showReportMenu && (
            <div className="mt-2 p-2 bg-neutral-900/95 border border-white/10 rounded-xl flex flex-col gap-1.5 animate-in slide-in-from-top-2 duration-200">
              <span className="text-[9px] font-bold text-gray-200">Report Comment:</span>
              <div className="flex flex-wrap gap-1">
                {['Spam', 'Harassment', 'Hate Speech', 'Inappropriate'].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => submitReport(r)}
                    className="px-2 py-0.5 bg-white/5 hover:bg-cyan-500/20 hover:text-cyan-300 border border-white/5 rounded text-[8px] font-medium text-gray-300 cursor-pointer transition-colors"
                  >
                    {r}
                  </button>
                ))}
              </div>
              <div className="flex gap-1 items-center mt-0.5">
                <input
                  type="text"
                  placeholder="Other reason..."
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-0.5 text-[8px] text-white placeholder-gray-500 outline-none focus:border-cyan-400"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (customReason.trim()) {
                      submitReport(customReason.trim());
                    }
                  }}
                  className="px-2 py-0.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded text-[8px] font-bold cursor-pointer transition-colors"
                >
                  Send
                </button>
                <button
                  type="button"
                  onClick={() => setShowReportMenu(false)}
                  className="px-2 py-0.5 bg-white/5 hover:bg-white/10 text-gray-400 rounded text-[8px] font-bold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col items-center justify-start gap-1 self-start shrink-0 min-w-8 pt-1">
          {/* Like Button */}
          <div className="flex flex-col items-center">
            <button
              type="button"
              onClick={handleLike}
              className="relative p-1.5 rounded-full hover:bg-white/5 transition-all focus:outline-none"
              title={optimisticLiked ? "Unlike comment" : "Like comment"}
            >
              {isAnimating && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0.8, scale: 0.4, y: 0, x: 0 }}
                      animate={{ 
                        opacity: 0, 
                        scale: [0.4, 1.2, 0.6], 
                        y: -25 - Math.random() * 15, 
                        x: (i - 1) * 12 + (Math.random() - 0.5) * 8 
                      }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      className="absolute"
                    >
                      <Heart className="w-4 h-4 fill-pink-500 text-pink-500" />
                    </motion.div>
                  ))}
                </div>
              )}

              <motion.div
                animate={isAnimating ? {
                  scale: [1, 1.5, 0.8, 1.2, 1],
                  rotate: [0, 15, -15, 0]
                } : { scale: 1 }}
                transition={{ duration: 0.4 }}
              >
                <Heart 
                  className={`w-3.5 h-3.5 transition-colors ${
                    optimisticLiked 
                      ? 'fill-pink-500 text-pink-500' 
                      : 'text-gray-400 group-hover:text-gray-300'
                  }`} 
                />
              </motion.div>
            </button>
            {optimisticCount > 0 && (
              <span className="text-[8px] font-mono font-bold text-gray-400 -mt-1 select-none">
                {optimisticCount}
              </span>
            )}
          </div>

          {/* Report Button */}
          {currentUser && (
            <button
              type="button"
              onClick={handleReportToggle}
              className="p-1.5 rounded-full hover:bg-white/5 transition-all focus:outline-none group/flag"
              title={isReported ? "You reported this comment" : "Report offensive content"}
            >
              <Flag 
                className={`w-3.5 h-3.5 transition-colors ${
                  isReported 
                    ? 'fill-red-500 text-red-500' 
                    : 'text-gray-500 group-hover/flag:text-red-400'
                }`} 
              />
            </button>
          )}
        </div>
      </div>

      {/* Reply Action Button */}
      {!isReply && currentUser && (
        <div className="flex items-center gap-4 mt-1 ml-10">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('selection');
              setShowReplyInput(!showReplyInput);
            }}
            className="text-[9px] font-bold text-gray-400 hover:text-cyan-400 cursor-pointer flex items-center gap-1 transition-colors"
          >
            <MessageCircle className="w-3 h-3" />
            <span>Reply</span>
          </button>
        </div>
      )}

      {/* Inline Reply Input Field */}
      {showReplyInput && !isReply && (
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            if (!replyText.trim()) return;
            triggerHaptic('success');
            addComment(postId, replyText.trim(), comm.id);
            setReplyText('');
            setShowReplyInput(false);
          }}
          className="mt-2 ml-10 mr-4 flex gap-2 items-center bg-black/20 p-2 rounded-xl border border-white/5 animate-in slide-in-from-top-1 duration-200"
        >
          {currentUser && (
            <img 
              src={currentUser.profilePic} 
              className="w-5 h-5 rounded-full object-cover border border-white/10 shrink-0" 
              alt="Me" 
            />
          )}
          <input 
            type="text"
            placeholder={`Reply to ${comm.user.displayName}...`}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            className="flex-grow bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 text-[9px] text-white placeholder-gray-500 outline-none focus:border-cyan-400 animate-none"
            autoFocus
          />
          <button 
            type="submit"
            disabled={!replyText.trim()}
            className="px-2.5 py-1 bg-gradient-to-r from-blue-500 to-pink-500 text-white rounded-lg text-[8.5px] font-bold disabled:opacity-50 active:scale-95 transition-all cursor-pointer"
          >
            Reply
          </button>
          <button 
            type="button"
            onClick={() => {
              setShowReplyInput(false);
              setReplyText('');
            }}
            className="px-2 py-1 bg-white/5 hover:bg-white/10 text-gray-400 rounded-lg text-[9px] font-bold cursor-pointer transition-colors shrink-0"
          >
            Cancel
          </button>
        </form>
      )}

      {/* Nested Replies */}
      {!isReply && replies.length > 0 && (
        <div className="mt-3 pl-8 sm:pl-10 flex flex-col gap-3 relative">
          {/* Vertical Thread Connector Line */}
          <div className="absolute left-[14px] top-[-10px] bottom-6 w-px bg-white/10 pointer-events-none" />
          
          {replies.map((reply) => (
            <div key={reply.id} className="flex flex-col relative w-full">
              {/* Curve connect path */}
              <div className="absolute -left-[18px] top-[14px] w-4.5 h-3 border-l border-b border-white/10 rounded-bl-md pointer-events-none" />
              
              <CommentItem
                comm={reply}
                postId={postId}
                currentUser={currentUser}
                toggleLikeComment={toggleLikeComment}
                flagComment={flagComment}
                triggerHaptic={triggerHaptic}
                setViewedUserId={setViewedUserId}
                setCommentingPost={setCommentingPost}
                addComment={addComment}
                isReply={true}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
