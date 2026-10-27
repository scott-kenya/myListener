// Initial Dataset for Real Estate & BNB WhatsApp Listener (Nyali & Bamburi Focus)

export const INITIAL_GROUPS = [
  {
    id: 'grp-1',
    name: 'Nyali & Bamburi Real Estate Deals',
    platform: 'WhatsApp',
    membersCount: 840,
    syncStatus: 'ACTIVE',
    dailyVolume: 320,
    sensitivity: 'HIGH',
    avatarBg: 'from-emerald-500 to-teal-700',
    description: 'Property rentals, apartments, and houses for rent in Nyali, Bamburi, and Mombasa North Coast.',
    connectedAt: '2026-08-01',
    unreadAlerts: 3
  },
  {
    id: 'grp-2',
    name: 'Mombasa BNB & Vacation Stays',
    platform: 'WhatsApp',
    membersCount: 1120,
    syncStatus: 'ACTIVE',
    dailyVolume: 510,
    sensitivity: 'CRITICAL',
    avatarBg: 'from-blue-500 to-indigo-700',
    description: 'Short stays, Airbnbs, studio apartments, and urgent guest inquiries in Nyali & Bamburi.',
    connectedAt: '2026-08-03',
    unreadAlerts: 4
  },
  {
    id: 'grp-3',
    name: 'Coast Property Agents & Hosts',
    platform: 'WhatsApp',
    membersCount: 650,
    syncStatus: 'ACTIVE',
    dailyVolume: 240,
    sensitivity: 'MEDIUM',
    avatarBg: 'from-amber-500 to-orange-700',
    description: 'Broker network, house listings, direct host availability, and client requests.',
    connectedAt: '2026-08-05',
    unreadAlerts: 1
  }
];

export const INITIAL_RULES = [
  {
    id: 'rule-101',
    name: 'Airbnb & BNB Inquiries (Nyali & Bamburi)',
    keywords: [
      'airbnb in nyali',
      'airbnb nyali',
      'bnb in nyali',
      'bnb nyali',
      'airbnb in bamburi',
      'airbnb bamburi',
      'bnb in bamburi',
      'bnb bamburi',
      'urgently looking for bnb in nyali',
      'urgently looking for bnb in bamburi',
      'short stay in nyali',
      'short stay in bamburi',
      'natafuta airbnb nyali',
      'natafuta airbnb bamburi',
      'kuna airbnb nyali',
      'kuna airbnb bamburi',
      'nani ako na airbnb nyali',
      'nani ako na airbnb bamburi'
    ],
    matchType: 'ANY_KEYWORD',
    priority: 'CRITICAL',
    enabled: true,
    targetGroups: ['ALL'],
    excludedWords: [],
    triggerCount: 42,
    createdAt: '2026-08-10',
    description: 'Active inquiries for Airbnb, BnB, or short-stay accommodations in Nyali or Bamburi.'
  },
  {
    id: 'rule-102',
    name: 'Furnished & House Rentals (Nyali & Bamburi)',
    keywords: [
      'looking for house in nyali',
      'looking for house in bamburi',
      'house in nyali',
      'house in bamburi',
      'furnished apartment in nyali',
      'furnished apartment in bamburi',
      '1 bedroom in nyali',
      '1 bedroom in bamburi',
      '2 bedroom in nyali',
      '2 bedroom in bamburi',
      'studio in nyali',
      'studio in bamburi',
      'natafuta nyumba nyali',
      'natafuta nyumba bamburi',
      'apartment in nyali',
      'apartment in bamburi'
    ],
    matchType: 'ANY_KEYWORD',
    priority: 'HIGH',
    enabled: true,
    targetGroups: ['ALL'],
    excludedWords: [],
    triggerCount: 38,
    createdAt: '2026-08-10',
    description: 'Client requests for furnished apartments, studios, houses, and bedroom rentals in Nyali & Bamburi.'
  },
  {
    id: 'rule-103',
    name: 'Immediate Availability & Urgent Check-in',
    keywords: [
      'who is available now in nyali',
      'who is available now in bamburi',
      'who is available now bamburi',
      'available now nyali',
      'available now bamburi',
      'host in nyali',
      'host in bamburi',
      'checking in today nyali',
      'checking in today bamburi',
      'urgent bnb nyali',
      'urgent bnb bamburi',
      'anyone with airbnb in nyali',
      'anyone with airbnb in bamburi'
    ],
    matchType: 'ANY_KEYWORD',
    priority: 'CRITICAL',
    enabled: true,
    targetGroups: ['ALL'],
    excludedWords: [],
    triggerCount: 25,
    createdAt: '2026-08-10',
    description: 'Instant host requests, immediate check-ins, and urgent availability queries.'
  }
];

export const INITIAL_ALERTS = [
  {
    id: 'alt-201',
    groupName: 'Mombasa BNB & Vacation Stays',
    author: 'Daniel Mwangi',
    authorPhone: '+254 712 345678',
    timestamp: '2 mins ago',
    rawTime: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    text: 'Hi members, I am urgently looking for bnb in nyali for 3 nights starting today. 2 bedroom preferred!',
    matchedKeywords: ['urgently looking for bnb in nyali', 'bnb in nyali'],
    ruleName: 'Urgent BNB Search (Nyali & Bamburi)',
    priority: 'CRITICAL',
    sentiment: 'URGENT',
    status: 'UNREAD',
    flagged: true
  },
  {
    id: 'alt-202',
    groupName: 'Nyali & Bamburi Real Estate Deals',
    author: 'Amina Hassan',
    authorPhone: '+254 722 987654',
    timestamp: '15 mins ago',
    rawTime: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    text: 'Hello team, looking for house in bamburi 3 bedroom standalone with own compound. Budget 45k per month.',
    matchedKeywords: ['looking for house in bamburi', 'house in bamburi'],
    ruleName: 'House Rental Search (Nyali & Bamburi)',
    priority: 'HIGH',
    sentiment: 'URGENT',
    status: 'UNREAD',
    flagged: false
  },
  {
    id: 'alt-203',
    groupName: 'Mombasa BNB & Vacation Stays',
    author: 'Captain Omar',
    authorPhone: '+254 733 112233',
    timestamp: '40 mins ago',
    rawTime: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
    text: 'Quick request: who is available now in nyali? Need a 1 bedroom BNB for immediate check-in.',
    matchedKeywords: ['who is available now in nyali'],
    ruleName: 'Immediate Availability Inquiries',
    priority: 'HIGH',
    sentiment: 'URGENT',
    status: 'UNREAD',
    flagged: false
  }
];

export const INITIAL_INTEGRATIONS = {
  slack: {
    enabled: true,
    webhookUrl: 'https://hooks.slack.com/services/T00/B00/XXXXXX',
    channel: '#property-leads-nyali',
    notifyOn: ['CRITICAL', 'HIGH']
  },
  telegram: {
    enabled: true,
    botToken: '8981263518:AAGMitWrxAOrGXKBlk0Wni1nLZZgTkvqe9c',
    chatId: '8984858765',
    notifyOn: ['CRITICAL', 'HIGH', 'MEDIUM']
  },
  email: {
    enabled: false,
    recipients: 'leads@propertykenya.com',
    digestMode: 'INSTANT'
  },
  twilioSms: {
    enabled: false,
    phoneNumber: '+254700000000',
    notifyOn: ['CRITICAL']
  },
  customWebhook: {
    enabled: true,
    endpointUrl: 'https://api.mycompany.com/v1/property-leads/webhook',
    secretKey: 'whsec_nyali_bamburi',
    notifyOn: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']
  }
};
