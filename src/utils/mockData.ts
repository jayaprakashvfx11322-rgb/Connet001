/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ConnectXUser, FeedPost, Reel, YouTubeVideo, Story, GroupChat, ConnectXNotification, MiniUser, Message, MonetizationReport } from '../types';

// Standard Premium Avatar URLs from Unsplash
export const MOCK_AVATARS = {
  kavin: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&fit=crop',
  priya: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&fit=crop',
  anu: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&fit=crop',
  vicky: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&fit=crop',
  arjun: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&fit=crop'
};

// Premium Stock Images
export const MOCK_IMAGES = {
  mountain: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800',
  neonCyber: 'https://images.unsplash.com/photo-1515621061946-eff1c2a352bd?w=800',
  setup: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800',
  sunsetOcean: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
  festival: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800',
  techGadget: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800'
};

// Loopable HD sample streams for reels & video players
export const MOCK_VIDEOS = {
  neonDance: 'https://assets.mixkit.co/videos/preview/mixkit-woman-dancing-under-neon-lights-40011-large.mp4',
  cityLights: 'https://assets.mixkit.co/videos/preview/mixkit-city-lights-at-night-reflected-in-river-loop-31358-large.mp4',
  djMusic: 'https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-dj-playing-music-at-a-club-mix-42411-large.mp4',
  natureFall: 'https://assets.mixkit.co/videos/preview/mixkit-tree-with-yellow-leaves-on-a-sunny-day-31967-large.mp4',
  typingCoding: 'https://assets.mixkit.co/videos/preview/mixkit-hands-typing-on-a-computer-keyboard-41703-large.mp4'
};

export const INITIAL_MOCK_USERS: ConnectXUser[] = [
  {
    id: 'user_kavin',
    username: 'kavin_23',
    displayName: 'Kavin',
    email: 'kavin@connectx.com',
    bio: 'Explorer | Photographer | Dreamer 📸 chasing light & memories worldwide. Let\'s build the future together!',
    profilePic: MOCK_AVATARS.kavin,
    coverPic: MOCK_IMAGES.neonCyber,
    dob: '2000-07-19',
    location: 'Chennai, India',
    website: 'youtube.com/@kavin',
    interests: ['Photography', 'Travel', 'Technology', 'Art'],
    connects: ['user_priya', 'user_anu', 'user_vicky'],
    sentRequests: [],
    pendingRequests: ['user_arjun'],
    totalViews: 2100000,
    totalReach: 742000,
    totalEarnings: 3125.46,
    accountType: 'google'
  },
  {
    id: 'user_priya',
    username: 'priya_vibe',
    displayName: 'Priya',
    email: 'priya@connectx.com',
    bio: 'Ambient sound producer ✨ Living live, one moment at a time. Gratitude turns what we have into enough.',
    profilePic: MOCK_AVATARS.priya,
    coverPic: MOCK_IMAGES.sunsetOcean,
    dob: '1999-06-15',
    location: 'Mumbai, India',
    website: 'soundvibe.io',
    interests: ['Music', 'Travel', 'Fitness', 'Fashion'],
    connects: ['user_kavin', 'user_anu', 'user_vicky', 'user_arjun'],
    sentRequests: [],
    pendingRequests: [],
    totalViews: 3400000,
    totalReach: 1200000,
    totalEarnings: 4520.12,
    accountType: 'instagram'
  },
  {
    id: 'user_anu',
    username: 'anu_creative',
    displayName: 'Anu',
    email: 'anu@connectx.com',
    bio: 'Creative writer & designer 🎨 Turning ideas into beautiful pixels. Always learning, always building.',
    profilePic: MOCK_AVATARS.anu,
    coverPic: MOCK_IMAGES.setup,
    dob: '2001-11-22',
    location: 'Bangalore, India',
    website: 'anucreative.dev',
    interests: ['Art', 'Design', 'Technology', 'Business'],
    connects: ['user_kavin', 'user_priya', 'user_vicky'],
    sentRequests: [],
    pendingRequests: [],
    totalViews: 980000,
    totalReach: 320000,
    totalEarnings: 984.20,
    accountType: 'facebook'
  },
  {
    id: 'user_vicky',
    username: 'vicky_vlog',
    displayName: 'Vicky',
    email: 'vicky@connectx.com',
    bio: 'Vlogger & Gamer 🎮 Gaming enthusiast. Good vibes only! Stream updates posted daily.',
    profilePic: MOCK_AVATARS.vicky,
    coverPic: MOCK_IMAGES.festival,
    dob: '1998-04-12',
    location: 'Delhi, India',
    website: 'vickyvlogs.tv',
    interests: ['Gaming', 'Film', 'Sports', 'Music'],
    connects: ['user_kavin', 'user_priya', 'user_anu'],
    sentRequests: [],
    pendingRequests: [],
    totalViews: 1540000,
    totalReach: 610000,
    totalEarnings: 1874.50,
    accountType: 'email'
  },
  {
    id: 'user_arjun',
    username: 'arjun_tech',
    displayName: 'Arjun',
    email: 'arjun@connectx.com',
    bio: 'Software engineer & tech reviews. Making complicated tech simple. Coffee consumer ☕',
    profilePic: MOCK_AVATARS.arjun,
    coverPic: MOCK_IMAGES.techGadget,
    dob: '1995-10-30',
    location: 'Hyderabad, India',
    website: 'arjuntech.com',
    interests: ['Technology', 'Business', 'Sports', 'Photography'],
    connects: ['user_priya'],
    sentRequests: ['user_kavin'],
    pendingRequests: [],
    totalViews: 4200000,
    totalReach: 1500000,
    totalEarnings: 5210.80,
    accountType: 'google'
  }
];

export const INITIAL_MOCK_POSTS: FeedPost[] = [
  {
    id: 'post_tokyo_cyberpunk',
    user: {
      id: 'user_priya',
      username: 'priya_vibe',
      displayName: 'Priya',
      profilePic: MOCK_AVATARS.priya
    },
    mediaType: 'image',
    mediaUrls: [MOCK_IMAGES.sunsetOcean],
    content: 'Unbelievable night in Neo-Shibuya! The neon rain-slicked towers look exactly like an anime scene. Tokyo is pure future-noir magic tonight. 🏙️🌧️💜 #TokyoCyberpunk #LiquidGlass #NeoTokyo',
    hashtags: ['TokyoCyberpunk', 'LiquidGlass', 'NeoTokyo', 'photography'],
    reactions: {
      'user_kavin': 'love',
      'user_anu': 'wow'
    },
    comments: [
      {
        id: 'c_tc1',
        user: {
          id: 'user_kavin',
          username: 'kavin_23',
          displayName: 'Kavin',
          profilePic: MOCK_AVATARS.kavin
        },
        text: 'This is cinematic perfection! Love the atmospheric lighting.',
        timestamp: '1h ago'
      }
    ],
    shares: 112,
    timestamp: '1h ago'
  },
  {
    id: 'post_ctxo',
    user: {
      id: 'user_arjun',
      username: 'arjun_tech',
      displayName: 'Arjun',
      profilePic: MOCK_AVATARS.arjun
    },
    mediaType: 'poll',
    content: 'Insane momentum for $CTXO Token today! Pacing new transaction volume ceilings with +24.8% gains in 24 hours. The web3 local economy node has never felt this secure. 📈💎 #ConnectX #CTXO #Web3Atmosphere',
    hashtags: ['CTXO', 'ConnectX', 'Web3Atmosphere'],
    poll: {
      question: 'Where do you see $CTXO heading next?',
      options: [
        { text: 'Sustained Bullish Breakout', votes: 850 },
        { text: 'Stable Consolidation Here', votes: 340 },
        { text: 'Ready for Next-Gen Vlogs integration', votes: 610 }
      ]
    },
    reactions: {
      'user_vicky': 'like',
      'user_anu': 'wow'
    },
    comments: [],
    shares: 89,
    timestamp: '4h ago'
  },
  {
    id: 'post_nodes',
    user: {
      id: 'user_anu',
      username: 'anu_creative',
      displayName: 'Anu',
      profilePic: MOCK_AVATARS.anu
    },
    mediaType: 'image',
    mediaUrls: [MOCK_IMAGES.setup],
    content: 'Just deployed 3 fresh virtual validation slots to our mesh network. ConnectX Active Nodes count has officially climbed to 12,482! Incredible security index achieved. 🛡️💻 #ConnectX #Nodes #ActiveNodes #Secured',
    hashtags: ['ConnectX', 'Nodes', 'ActiveNodes', 'Secured'],
    reactions: {
      'user_kavin': 'like',
      'user_priya': 'wow'
    },
    comments: [],
    shares: 24,
    timestamp: '6h ago'
  },
  {
    id: 'post_vibe',
    user: {
      id: 'user_priya',
      username: 'priya_vibe',
      displayName: 'Priya',
      profilePic: MOCK_AVATARS.priya
    },
    mediaType: 'image',
    mediaUrls: [MOCK_IMAGES.sunsetOcean],
    content: 'Sending good vibes to all creators across the network today! Let us keep collaborating and raising our creative bars. Remember, consistency is the key! ✨🌊 #ConnectXVibe #HappyCreator #VibeMatch',
    hashtags: ['ConnectXVibe', 'HappyCreator', 'VibeMatch'],
    reactions: {
      'user_anu': 'love',
      'user_vicky': 'like'
    },
    comments: [],
    shares: 76,
    timestamp: '8h ago'
  },
  {
    id: 'post_priya_loops',
    user: {
      id: 'user_kavin',
      username: 'kavin_23',
      displayName: 'Kavin',
      profilePic: MOCK_AVATARS.kavin
    },
    mediaType: 'image',
    mediaUrls: [MOCK_IMAGES.mountain],
    content: 'Huge shoutout to @Priya_Loops for crossing the 10M views milestone! Epic sound design and visual consistency. Priya has truly mastered the loops game! 🎉🙌 #ConnectXVibe #PriyaLoops #CreatorMilestone',
    hashtags: ['ConnectXVibe', 'PriyaLoops', 'CreatorMilestone'],
    reactions: {
      'user_priya': 'love',
      'user_anu': 'like'
    },
    comments: [],
    shares: 54,
    timestamp: '10h ago'
  },
  {
    id: 'post_behance',
    user: {
      id: 'user_anu',
      username: 'anu_creative',
      displayName: 'Anu',
      profilePic: MOCK_AVATARS.anu
    },
    mediaType: 'image',
    mediaUrls: [MOCK_IMAGES.setup],
    content: 'Excited to release my new #BehanceExclusive portfolio mockup! Gas is sitting at an optimal 11 Gwei, perfect timing to mint or verify content nodes. Check the link in my studio bio! 🎨🚀 #Behance #DesignSetup #GasFee',
    hashtags: ['BehanceExclusive', 'DesignSetup', 'GasFee'],
    reactions: {
      'user_arjun': 'like',
      'user_vicky': 'wow'
    },
    comments: [],
    shares: 38,
    timestamp: '12h ago'
  },
  {
    id: 'post_1',
    user: {
      id: 'user_kavin',
      username: 'kavin_23',
      displayName: 'Kavin',
      profilePic: MOCK_AVATARS.kavin
    },
    mediaType: 'image',
    mediaUrls: [MOCK_IMAGES.mountain],
    content: 'Life is really simple, but we insist on making it complicated. Focus on what matters and let go of what doesn\'t. Spent my morning reflecting beside this high glacier valley. Nature has a beautiful way of centering the busy mind. 🏔️🍂',
    hashtags: ['mindfulness', 'nature', 'landscape', 'photography'],
    reactions: {
      'user_priya': 'like',
      'user_anu': 'love',
      'user_vicky': 'wow',
      'user_arjun': 'like'
    },
    comments: [
      {
        id: 'c_1',
        user: {
          id: 'user_priya',
          username: 'priya_vibe',
          displayName: 'Priya',
          profilePic: MOCK_AVATARS.priya
        },
        text: 'This is absolutely breathtaking, Kavin! Reminds me of our trek last season.',
        timestamp: '2h ago'
      },
      {
        id: 'c_2',
        user: {
          id: 'user_anu',
          username: 'anu_creative',
          displayName: 'Anu',
          profilePic: MOCK_AVATARS.anu
        },
        text: 'The color grading is exquisite here! Did you shoot this in RAW?',
        timestamp: '1h ago'
      }
    ],
    shares: 45,
    timestamp: '2h ago'
  },
  {
    id: 'post_2',
    user: {
      id: 'user_anu',
      username: 'anu_creative',
      displayName: 'Anu',
      profilePic: MOCK_AVATARS.anu
    },
    mediaType: 'poll',
    content: 'Success is not final, failure is not fatal: it is the courage to continue that counts. Which mindset blocks have you encountered most on your startup or design journey so far? Share details below!',
    hashtags: ['motivation', 'startup', 'lifelessons'],
    poll: {
      question: 'Which mindset is most crucial for scaling high?',
      options: [
        { text: 'Growth Mindset & Iteration', votes: 1420 },
        { text: 'Laser Focus & Stubbornness', votes: 412 },
        { text: 'Consistent Daily Routines', votes: 890 }
      ]
    },
    reactions: {
      'user_kavin': 'like',
      'user_vicky': 'laugh',
      'user_priya': 'love'
    },
    comments: [
      {
        id: 'c_3',
        user: {
          id: 'user_kavin',
          username: 'kavin_23',
          displayName: 'Kavin',
          profilePic: MOCK_AVATARS.kavin
        },
        text: 'Voted dynamic iteration. If you don\'t pivot based on feedback, focus will commit you to a dead end.',
        timestamp: '3h ago'
      }
    ],
    shares: 58,
    timestamp: '3h ago'
  },
  {
    id: 'post_3',
    user: {
      id: 'user_vicky',
      username: 'vicky_vlog',
      displayName: 'Vicky',
      profilePic: MOCK_AVATARS.vicky
    },
    mediaType: 'image',
    mediaUrls: [MOCK_IMAGES.setup],
    content: 'My workspace setup is complete! Custom frosted-glass shelving, neon liquid tubes, sound dampening panels on deck. Time to record the next tech review. 🎙️🚀 Rate it 1-10.',
    hashtags: ['desktopsource', 'gamingsetup', 'minimalist'],
    reactions: {
      'user_priya': 'like',
      'user_arjun': 'wow'
    },
    comments: [
      {
        id: 'c_4',
        user: {
          id: 'user_arjun',
          username: 'arjun_tech',
          displayName: 'Arjun',
          profilePic: MOCK_AVATARS.arjun
        },
        text: 'Solid 11/10 setup. Love the clean lighting. Specs of that mic?',
        timestamp: '5h ago'
      }
    ],
    shares: 12,
    timestamp: '5h ago'
  }
];

export const INITIAL_MOCK_REELS: Reel[] = [
  {
    id: 'reel_1',
    user: {
      id: 'user_priya',
      username: 'priya_vibe',
      displayName: 'Priya',
      profilePic: MOCK_AVATARS.priya
    },
    videoUrl: MOCK_VIDEOS.neonDance,
    aspectRatio: '9:16',
    caption: 'Good vibes only ✨ Testing the new RGB neon controller in the sound booth! Loving this glow.',
    hashtags: ['Happy', 'Vibes', 'Glow', 'SoundDesign'],
    soundTitle: 'Priya - Original Audio (Vibe Beats)',
    likes: ['user_kavin', 'user_anu', 'user_vicky'],
    comments: [
      {
        id: 'rc_1',
        username: 'kavin_23',
        userDisplayName: 'Kavin',
        profilePic: MOCK_AVATARS.kavin,
        text: 'The reflection on the glass wall looks amazing! Absolute mood.',
        timestamp: '1h ago'
      },
      {
        id: 'rc_2',
        username: 'vicky_vlog',
        userDisplayName: 'Vicky',
        profilePic: MOCK_AVATARS.vicky,
        text: 'Need that neon panel! Where did you cop it?',
        timestamp: '45m ago'
      }
    ],
    shares: 256,
    saves: ['user_kavin'],
    views: 12400,
    durationSeconds: 15
  },
  {
    id: 'reel_2',
    user: {
      id: 'user_kavin',
      username: 'kavin_23',
      displayName: 'Kavin',
      profilePic: MOCK_AVATARS.kavin
    },
    videoUrl: MOCK_VIDEOS.cityLights,
    aspectRatio: '9:16',
    caption: 'Midnight Reflections. Floating through the liquid streets under rain-slicked skies. 🏙️🌧️',
    hashtags: ['cinematic', 'tokyo', 'cyberpunk', 'cityscape'],
    soundTitle: 'Lofi Chill - Raindrops in Tokyo',
    likes: ['user_priya', 'user_anu'],
    comments: [],
    shares: 142,
    saves: ['user_priya'],
    views: 8900,
    durationSeconds: 22
  },
  {
    id: 'reel_3',
    user: {
      id: 'user_vicky',
      username: 'vicky_vlog',
      displayName: 'Vicky',
      profilePic: MOCK_AVATARS.vicky
    },
    videoUrl: MOCK_VIDEOS.djMusic,
    aspectRatio: '9:16',
    caption: 'Tuning the frequencies live for my weekend set! Get ready to dance. 🎧🎸',
    hashtags: ['live', 'edm', 'synthwave', 'djlife'],
    soundTitle: 'Vicky Live - Hyper Synth Electro Mix',
    likes: ['user_priya', 'user_kavin', 'user_arjun'],
    comments: [],
    shares: 89,
    saves: [],
    views: 6200,
    durationSeconds: 30
  }
];

export const INITIAL_MOCK_VIDEOS: YouTubeVideo[] = [
  {
    id: 'vid_1',
    title: 'Exploring the Most Beautiful Places on Earth - 4K Cinematic',
    description: 'Join me as I travel to five of the most visually stunning, remote places left on Earth. From Alpine high glacials to neon-drizzled shorelines, we will experience high contrast views and pristine natural acoustic loops. Shot entirely on cinema grade gear in 4K resolution.\n\nSubscribe for more weekly visual journeys!',
    videoUrl: MOCK_VIDEOS.natureFall,
    thumbnailUrl: MOCK_IMAGES.mountain,
    duration: '25:41',
    views: 1200000,
    timestamp: '2 days ago',
    category: 'Vlogs',
    likes: ['user_priya', 'user_anu', 'user_arjun'],
    watchLater: false,
    quality: '4K',
    publisher: {
      id: 'user_kavin',
      username: 'kavin_23',
      displayName: 'Kavin',
      profilePic: MOCK_AVATARS.kavin
    },
    comments: [
      {
        id: 'vc_1',
        user: {
          id: 'user_priya',
          username: 'priya_vibe',
          displayName: 'Priya',
          profilePic: MOCK_AVATARS.priya
        },
        text: 'The 4K stream is astonishingly fluid. Reminds me how beautiful our world is.',
        timestamp: '1 day ago'
      },
      {
        id: 'vc_2',
        user: {
          id: 'user_arjun',
          username: 'arjun_tech',
          displayName: 'Arjun',
          profilePic: MOCK_AVATARS.arjun
        },
        text: 'Stunning cinematography, Kavin! The transitions are buttery smooth.',
        timestamp: '12h ago'
      }
    ]
  },
  {
    id: 'vid_2',
    title: 'Top 10 Productivity Tips to Change Your Life & System Settings',
    description: 'Stuck in a creative rut or having trouble optimizing your flow? In this long-form lecture, we dissect 10 actionable behavioral and environment setups that will reclaim your energy, sharpen focus, and skyrocket consistency in your programming/design endeavors.\n\nTimecodes:\n0:00 Intro\n2:30 Micro Habits\n5:15 Environment Design\n11:00 Data Flow Optimization',
    videoUrl: MOCK_VIDEOS.typingCoding,
    thumbnailUrl: MOCK_IMAGES.techGadget,
    duration: '18:24',
    views: 520000,
    timestamp: '5 days ago',
    category: 'Education',
    likes: ['user_kavin', 'user_priya'],
    watchLater: false,
    quality: '1080p',
    publisher: {
      id: 'user_arjun',
      username: 'arjun_tech',
      displayName: 'Arjun',
      profilePic: MOCK_AVATARS.arjun
    },
    comments: []
  },
  {
    id: 'vid_3',
    title: 'Life Lessons Learned After 30: Journey, Failures & New Horizons',
    description: 'A deeply personal vlog discussing my main professional, personal, and mindset lessons after traversing my twenties. We reflect on letting go, finding peace in solitude, and why building offline resilience matters in a hyper-connected virtual space.',
    videoUrl: MOCK_VIDEOS.cityLights,
    thumbnailUrl: MOCK_IMAGES.sunsetOcean,
    duration: '12:08',
    views: 386000,
    timestamp: '1 week ago',
    category: 'Vlogs',
    likes: ['user_kavin', 'user_anu'],
    watchLater: false,
    quality: '1080p',
    publisher: {
      id: 'user_priya',
      username: 'priya_vibe',
      displayName: 'Priya',
      profilePic: MOCK_AVATARS.priya
    },
    comments: []
  }
];

export const INITIAL_MOCK_STORIES: Story[] = [
  {
    id: 'story_1',
    user: {
      id: 'user_priya',
      username: 'priya_vibe',
      displayName: 'Priya',
      profilePic: MOCK_AVATARS.priya
    },
    mediaType: 'image',
    mediaUrl: MOCK_IMAGES.sunsetOcean,
    caption: 'Chasing the amber glow 🌅 What is your evening soundtrack?',
    questionPrompt: 'Drop your song recommendation! 👇',
    viewers: [
      { userId: 'user_kavin', username: 'kavin_23', profilePic: MOCK_AVATARS.kavin, timestamp: '1h ago' },
      { userId: 'user_anu', username: 'anu_creative', profilePic: MOCK_AVATARS.anu, timestamp: '30m ago' }
    ],
    timestamp: '5h ago'
  },
  {
    id: 'story_2',
    user: {
      id: 'user_kavin',
      username: 'kavin_23',
      displayName: 'Kavin',
      profilePic: MOCK_AVATARS.kavin
    },
    mediaType: 'image',
    mediaUrl: MOCK_IMAGES.neonCyber,
    caption: 'Midnight neon vibes! Grinding on a secret project 💻',
    poll: {
      question: 'Will we launch this week?',
      options: [
        { text: 'Yes, full send!', votes: 120 },
        { text: 'Nearly ready, wait', votes: 45 }
      ]
    },
    viewers: [
      { userId: 'user_priya', username: 'priya_vibe', profilePic: MOCK_AVATARS.priya, timestamp: '2h ago' }
    ],
    timestamp: '8h ago'
  }
];

export const INITIAL_MOCK_GROUPS: GroupChat[] = [
  {
    id: 'grp_global',
    name: 'ConnectX World',
    description: 'The global lounge for ConnectX innovators, creators, and developers.',
    avatar: MOCK_IMAGES.neonCyber,
    members: ['user_kavin', 'user_priya', 'user_anu', 'user_vicky', 'user_arjun'],
    type: 'community',
    ownerId: 'user_kavin'
  },
  {
    id: 'grp_creators',
    name: 'Liquid Motion Creators',
    description: 'High stakes visual designers discussing apple liquid glass, neon animations, and UI/UX shaders.',
    avatar: MOCK_IMAGES.sunsetOcean,
    members: ['user_kavin', 'user_priya', 'user_anu'],
    type: 'group',
    ownerId: 'user_anu'
  }
];

export const INITIAL_MOCK_NOTIFICATIONS: ConnectXNotification[] = [
  {
    id: 'notif_1',
    type: 'like',
    fromUser: {
      id: 'user_priya',
      username: 'priya_vibe',
      displayName: 'Priya',
      profilePic: MOCK_AVATARS.priya
    },
    postType: 'post',
    targetId: 'post_1',
    text: 'liked your post "Life is really simple..."',
    timestamp: '2m ago',
    read: false
  },
  {
    id: 'notif_2',
    type: 'comment',
    fromUser: {
      id: 'user_kavin',
      username: 'kavin_23',
      displayName: 'Kavin',
      profilePic: MOCK_AVATARS.kavin
    },
    postType: 'post',
    targetId: 'post_2',
    text: 'commented on your post: "Voted dynamic iteration..."',
    timestamp: '10m ago',
    read: false
  },
  {
    id: 'notif_3',
    type: 'connect_request',
    fromUser: {
      id: 'user_arjun',
      username: 'arjun_tech',
      displayName: 'Arjun',
      profilePic: MOCK_AVATARS.arjun
    },
    text: 'sent you a connect request.',
    timestamp: '30m ago',
    read: false
  },
  {
    id: 'notif_4',
    type: 'earning',
    text: 'Your video "Exploring the Most Beautiful Places..." reached 10K views, and earned you $12.45!',
    amount: 12.45,
    timestamp: '1h ago',
    read: true
  }
];

export const INITIAL_MOCK_MESSAGES: Message[] = [
  {
    id: 'msg_1',
    senderId: 'user_priya',
    receiverId: 'user_kavin',
    text: 'Hey Kavin! Loved that outdoor photo you posted earlier.',
    timestamp: '06-07 18:30'
  },
  {
    id: 'msg_2',
    senderId: 'user_kavin',
    receiverId: 'user_priya',
    text: 'Thanks Priya! The fog had just cleared. It was magical.',
    timestamp: '06-07 18:32'
  },
  {
    id: 'msg_3',
    senderId: 'user_priya',
    receiverId: 'user_kavin',
    text: 'Are you available to join the live stream session of EDM vibes tomorrow?',
    timestamp: '06-07 18:35'
  }
];

export const INITIAL_MONETIZATION: MonetizationReport = {
  videos: { views: 1200000, reach: 742000, watchTimeHours: 18400, engagementPercent: 12.5, earnings: 1234.56 },
  reels: { views: 32000, reach: 24500, watchTimeHours: 350, engagementPercent: 18.2, earnings: 678.90 },
  imagePosts: { views: 420000, reach: 180000, watchTimeHours: 0, engagementPercent: 8.4, earnings: 345.20 },
  textPosts: { views: 110000, reach: 68000, watchTimeHours: 0, engagementPercent: 4.8, earnings: 123.50 },
  stories: { views: 18200, reach: 12500, watchTimeHours: 0, engagementPercent: 22.1, earnings: 289.40 }
};
