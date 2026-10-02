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
    id: 'decor',
    name: 'Decor',
    description: 'Stage setup, venue aesthetics, craft installations, theme visuals and creative background ambiance.',
    badge: 'Decoration'
  },
  {
    id: 'technical',
    name: 'Technical',
    description: 'Web development, portal management, sound engineering, AV equipment, live systems and technical ops.',
    badge: 'Tech & IT'
  },
  {
    id: 'design',
    name: 'Design',
    description: 'Graphic design, banners, social media assets, brochures, badges and visual branding materials.',
    badge: 'Design'
  },
  {
    id: 'media',
    name: 'Media',
    description: 'Event photo coverage, videography, highlights reels editing, press releases and digital publication.',
    badge: 'Media'
  },
  {
    id: 'activity',
    name: 'Activity & Desk Duty',
    description: 'On-ground activity coordination, student engagements, game stalls, event logistics and crowd interaction.',
    badge: 'Activities'
  },
  {
    id: 'flashmob',
    name: 'Flashmob',
    description: 'Choreography, performance rehearsals, publicity dance routines and promotional activation.',
    badge: 'Performance'
  },
  {
    id: 'promotion',
    name: 'Promotion',
    description: 'Campus outreach, publicity drives, PR campaigns, student networking and event awareness.',
    badge: 'Promotion'
  },
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
