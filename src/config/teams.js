/**
 * ENIGMA 2026 - EVENT DEPARTMENTS / TEAMS CONFIGURATION
 * 
 * BOILERPLATE INSTRUCTIONS FOR ADDING MORE TEAMS:
 * To add a new team category, simply add a new object to the array below:
 * {
 *   id: 'unique_team_id',
 *   name: 'Team Name',
 *   description: 'Brief role description',
 *   badge: 'Category Tag'
 * }
 */

export const EVENT_TEAMS = [
  {
    id: 'tech_team',
    name: 'Tech Team',
    description: 'Web development, app management, audio-visual technical setups, coding events & live streaming.',
    badge: 'Tech & IT'
  },
  {
    id: 'management_team',
    name: 'Management Team',
    description: 'Event coordination, schedule management, crowd control & overall execution.',
    badge: 'Core Ops'
  },
  {
    id: 'decoration_team',
    name: 'Decoration Team',
    description: 'Stage setup, neon lighting, party theme aesthetics, craft & visual installations.',
    badge: 'Creative Art'
  },
  {
    id: 'media_photography',
    name: 'Media & Photography',
    description: 'Event coverage, video editing, social media management & live press.',
    badge: 'Media'
  },
  {
    id: 'logistics_operations',
    name: 'Logistics & Operations',
    description: 'Resource allocation, equipment movement, venue setup & hospitality.',
    badge: 'Logistics'
  },
  {
    id: 'stage_anchoring',
    name: 'Stage & Anchoring',
    description: 'Host, MC duties, artist management, stage flow & performance announcements.',
    badge: 'Performing'
  },
  {
    id: 'sponsorship_pr',
    name: 'Sponsorship & PR',
    description: 'Sponsor outreach, brand partnerships, PR campaigns & guest relations.',
    badge: 'Finance & PR'
  },
  {
    id: 'security_volunteers',
    name: 'Security & Volunteers',
    description: 'Gate control, pass verification, discipline enforcement & student safety.',
    badge: 'Safety'
  }
  /* BOILERPLATE: Add your extra teams below by copying the format above! */
];

export const ACADEMIC_YEARS = ['2nd Year', '3rd Year', '4th Year'];

export const SECTIONS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

export const STANDARD_LECTURES = [
  { id: 1, label: 'Lecture 1', time: '09:00 AM - 09:50 AM' },
  { id: 2, label: 'Lecture 2', time: '09:50 AM - 10:40 AM' },
  { id: 3, label: 'Lecture 3', time: '10:40 AM - 11:30 PM' },
  { id: 4, label: 'Lecture 4', time: '11:30 PM - 12:20 PM' },
  { id: 5, label: 'Lecture 5', time: '12:20 PM - 01:10 PM' },
  { id: 6, label: 'Lecture 6', time: '01:10 PM - 02:00 PM' },
  { id: 7, label: 'Lecture 7', time: '02:00 PM - 03:40 PM' },
  { id: 8, label: 'Lecture 8', time: '03:40 PM - 04:30 PM' },
];
