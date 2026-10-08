export interface CategoryItem {
  slug: string;
  title: string;
  shortTitle: string;
  description: string;
  icon: string;
  color: string;
  badgeColor: string;
  keywords: string[];
}

export interface CategoryGroup {
  id: string;
  title: string;
  subtitle: string;
  color: string;
  categories: CategoryItem[];
}

export const CATEGORY_GROUPS: CategoryGroup[] = [
  {
    id: 'national-international',
    title: 'National & International Affairs',
    subtitle: 'High-yield current affairs covering governance, bilateral diplomacy, economy, and state affairs.',
    color: 'from-blue-600 to-indigo-700',
    categories: [
      {
        slug: 'national-schemes',
        title: 'National News & Schemes',
        shortTitle: 'National & Schemes',
        description: 'Government policies, legislation, cabinet approvals, and major socio-economic welfare initiatives.',
        icon: 'Landmark',
        color: 'blue',
        badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
        keywords: ['yojana', 'scheme', 'cabinet', 'parliament', 'ministry', 'bill', 'act', 'pm', 'president', 'government', 'welfare', 'portal', 'initiative', 'policy', 'railways', 'infrastructure', 'national'],
      },
      {
        slug: 'international-affairs',
        title: 'International Affairs',
        shortTitle: 'International',
        description: 'Global summits (G20, BRICS, SCO), bilateral treaties, UN declarations, and significant geopolitical events.',
        icon: 'Globe2',
        color: 'indigo',
        badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
        keywords: ['summit', 'bilateral', 'un', 'united nations', 'g20', 'brics', 'treaty', 'mou', 'foreign', 'diplomacy', 'nato', 'asean', 'global', 'ambassador', 'quad', 'imf', 'world bank'],
      },
      {
        slug: 'economy-banking',
        title: 'Economy & Banking',
        shortTitle: 'Economy & Banking',
        description: 'Union budget updates, RBI monetary policies, inflation, GDP projections, and broad financial market trends.',
        icon: 'TrendingUp',
        color: 'emerald',
        badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        keywords: ['rbi', 'repo rate', 'inflation', 'gdp', 'banking', 'sebi', 'budget', 'fiscal', 'economy', 'tax', 'gst', 'forex', 'finance', 'revenue', 'rupee', 'nifty', 'sensex'],
      },
      {
        slug: 'state-news',
        title: 'State News',
        shortTitle: 'State Initiatives',
        description: 'Specific regional initiatives, state government schemes, local cultural festivals, and regional GI tags.',
        icon: 'MapPin',
        color: 'teal',
        badgeColor: 'bg-teal-100 text-teal-800 border-teal-200',
        keywords: ['state', 'chief minister', 'governor', 'maharashtra', 'karnataka', 'tamil nadu', 'uttar pradesh', 'delhi', 'kerala', 'assam', 'bihar', 'gujarat', 'festival', 'regional', 'panchayat'],
      },
    ],
  },
  {
    id: 'people-recognition',
    title: 'People & Recognition',
    subtitle: 'Prominent personalities, national and global honours, appointments, and recent literary works.',
    color: 'from-purple-600 to-pink-700',
    categories: [
      {
        slug: 'awards-honours',
        title: 'Awards & Honours',
        shortTitle: 'Awards & Honours',
        description: 'Prestigious national and international accolades such as Nobel Prizes, Padma Awards, Oscar, and Saraswati Samman.',
        icon: 'Trophy',
        color: 'amber',
        badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
        keywords: ['award', 'honour', 'honor', 'nobel', 'padma', 'bharat ratna', 'oscar', 'grammy', 'booker', 'prize', 'felicitated', 'medal', 'gallantry', 'khel ratna', 'arjuna'],
      },
      {
        slug: 'appointments',
        title: 'Appointments',
        shortTitle: 'Key Appointments',
        description: 'Key leadership changes and designations in constitutional bodies, armed forces, judiciary, and global bodies.',
        icon: 'UserCheck',
        color: 'purple',
        badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
        keywords: ['appointed', 'appointment', 'chief justice', 'chairman', 'director general', 'dg', 'ceo', 'cag', 'attorney general', 'election commissioner', 'governor', 'sworn in', 'takes charge'],
      },
      {
        slug: 'obituaries',
        title: 'Obituaries',
        shortTitle: 'Obituaries',
        description: 'The passing of notable personalities, freedom fighters, leaders, artists, and their fields of contribution.',
        icon: 'UserX',
        color: 'slate',
        badgeColor: 'bg-slate-100 text-slate-800 border-slate-200',
        keywords: ['passed away', 'passes away', 'demise', 'condolences', 'obituary', 'former minister', 'veteran', 'tribute', 'dies at'],
      },
      {
        slug: 'books-authors',
        title: 'Books & Authors',
        shortTitle: 'Books & Authors',
        description: 'Recently published notable literature, autobiographies, historical treatises, and literary award winners.',
        icon: 'BookOpen',
        color: 'rose',
        badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
        keywords: ['book', 'author', 'novel', 'written by', 'penned', 'autobiography', 'memoir', 'release', 'launches book', 'title', 'anthology'],
      },
    ],
  },
  {
    id: 'specific-knowledge',
    title: 'Specific Knowledge Areas',
    subtitle: 'Specialized competitive exam modules covering sports tournaments, defense, global rankings, and observances.',
    color: 'from-cyan-600 to-blue-800',
    categories: [
      {
        slug: 'sports',
        title: 'Sports',
        shortTitle: 'Sports & Games',
        description: 'Major tournament results, Olympics, Asian Games, cricket series, grand slams, and tournament host venues.',
        icon: 'Medal',
        color: 'orange',
        badgeColor: 'bg-orange-100 text-orange-800 border-orange-200',
        keywords: ['cricket', 'football', 'olympics', 'chess', 'grandmaster', 'badminton', 'tennis', 'gold medal', 'champion', 'tournament', 'world cup', 'fifa', 'icc', 'wimbledon', 'trophy'],
      },
      {
        slug: 'science-defense',
        title: 'Science & Defense',
        shortTitle: 'Science & Defense',
        description: 'ISRO space missions, DRDO missile tests, joint military exercises, AI developments, and defense acquisitions.',
        icon: 'ShieldAlert',
        color: 'sky',
        badgeColor: 'bg-sky-100 text-sky-800 border-sky-200',
        keywords: ['isro', 'drdo', 'nasa', 'satellite', 'missile', 'spacecraft', 'exercise', 'navy', 'army', 'air force', 'warship', 'submarine', 'defense', 'defence', 'ai', 'quantum', 'biotech', 'lunar'],
      },
      {
        slug: 'indices-rankings',
        title: 'Indices & Rankings',
        shortTitle: 'Indices & Rankings',
        description: "India's position in global reports, ease of doing business, human development index, and hunger index.",
        icon: 'BarChart3',
        color: 'cyan',
        badgeColor: 'bg-cyan-100 text-cyan-800 border-cyan-200',
        keywords: ['index', 'ranking', 'rank', 'report', 'hdi', 'survey', 'benchmark', 'position', 'scored', 'global index', 'press freedom', 'innovation index', 'cleanliness survey'],
      },
      {
        slug: 'important-days',
        title: 'Important Days & Themes',
        shortTitle: 'Important Days',
        description: 'National and international observance days alongside their officially declared annual themes.',
        icon: 'CalendarDays',
        color: 'violet',
        badgeColor: 'bg-violet-100 text-violet-800 border-violet-200',
        keywords: ['day', 'theme', 'celebrated on', 'observed on', 'anniversary', 'world health day', 'environment day', 'constitution day', 'yoga day', 'women day', 'science day', 'observed annually'],
      },
    ],
  },
];

export const ALL_CATEGORIES: CategoryItem[] = CATEGORY_GROUPS.flatMap(
  (group) => group.categories
);

export const CATEGORY_MAP: Record<string, CategoryItem> = ALL_CATEGORIES.reduce(
  (acc, cat) => {
    acc[cat.slug] = cat;
    return acc;
  },
  {} as Record<string, CategoryItem>
);

export function classifyArticleCategory(title: string, content?: string): string {
  const text = `${title} ${content || ''}`.toLowerCase();

  for (const cat of ALL_CATEGORIES) {
    for (const keyword of cat.keywords) {
      const regex = new RegExp(`\\b${keyword.toLowerCase()}\\b`, 'i');
      if (regex.test(text)) {
        return cat.slug;
      }
    }
  }

  // Fallback default
  return 'national-schemes';
}
