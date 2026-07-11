/**
 * Every word on the site lives here — edit this file to change the site.
 * Source: Deepika Agarwal's Master CV (PG358).
 */

export const site = {
  firstName: 'DEEPIKA',
  lastName: 'AGARWAL',
  name: 'Deepika Agarwal',

  /* ── CONTACT — swap these to update the live site ───── */
  email: 'aashu153060@gmail.com',
  linkedin: 'https://www.linkedin.com/', // ← set the real profile URL
  location: 'Gurgaon · Noida · Agra, IN',

  roles: ['Financial Market Analyst', 'PGDM Candidate — MDI Gurgaon', 'Future Fund Manager'],
  metaLine: 'PORTFOLIO — PGDM, MANAGEMENT DEVELOPMENT INSTITUTE GURGAON',
  year: '©2026',
}

export const navLinks = [
  { index: '01', label: 'Profile', href: '#profile' },
  { index: '02', label: 'Experience', href: '#experience' },
  { index: '03', label: 'Education', href: '#education' },
  { index: '04', label: 'Work', href: '#work' },
  { index: '05', label: 'Beyond', href: '#beyond' },
  { index: '06', label: 'Contact', href: '#contact' },
]

/* hero bottom ticker — reads like a market feed */
export const tickerQuotes = [
  { sym: 'CGPA/BBA', val: '9.37', delta: 'RANK 1/315' },
  { sym: 'CAT', val: '96.75', delta: '%ILE' },
  { sym: 'LRDI', val: '99.06', delta: '%ILE' },
  { sym: 'SIF·SUBS', val: '1,000+', delta: '4 MO' },
  { sym: 'FUNDS', val: '17+', delta: 'HOUSES' },
  { sym: 'VIDEOS', val: '60+', delta: 'SCRIPTED' },
  { sym: 'KHO-KHO', val: 'GOLD', delta: 'NATIONALS' },
]

export const highlightsMarquee = [
  'PGDM @ MDI GURGAON',
  'BBA BATCH TOPPER — 9.37 CGPA / 315 STUDENTS',
  'CAT 96.75 PERCENTILE',
  'SIF INSIGHT — 1,000+ SUBSCRIBERS',
  'NATIONAL KHO-KHO GOLD MEDALIST',
  '17+ FUND HOUSES ANALYZED',
  '60+ INVESTMENT VIDEOS',
  'LED TEAMS OF 20+',
]

/* ── 01 · profile ─────────────────────────────────────── */

export const manifesto =
  'Markets move in stories. I learned to read them early — topping a batch of 315, mapping an industry before it had a rulebook, and turning specialized funds into plain language for a thousand investors.'

export const bio = [
  'From Agra to MDI Gurgaon: a growth-obsessed analyst who works best where finance, strategy and leadership overlap. As a Financial Market Analyst I tracked India’s emerging Specialized Investment Funds industry end to end — regulation, launches, strategies, disclosures — and helped build the products and the education layer around it.',
  'Off the terminal: national-level athlete, batch topper, design-team lead. Calm under deadline, curious by default.',
]

export const stats = [
  { value: 9.37, decimals: 2, suffix: '', label: 'BBA CGPA — Rank 1 of 315' },
  { value: 96.75, decimals: 2, suffix: '', label: 'CAT Percentile' },
  { value: 1000, decimals: 0, suffix: '+', label: 'SIF Insight subscribers' },
  { value: 17, decimals: 0, suffix: '+', label: 'Fund houses analyzed' },
  { value: 20, decimals: 0, suffix: '+', label: 'Strategies evaluated' },
  { value: 60, decimals: 0, suffix: '+', label: 'Videos scripted & reviewed' },
]

export const strengths = ['FAST ON UNFAMILIAR GROUND', 'CURIOSITY AS A HABIT', 'CALM UNDER PRESSURE']

export const quickFacts = [
  { label: 'HOMETOWN', value: 'Agra, Uttar Pradesh' },
  { label: 'NOW', value: 'PGDM ’26–28 — MDI Gurgaon' },
  { label: 'FOCUS', value: 'Equity research → Asset management' },
  { label: 'OFF-DESK', value: 'Kho-Kho · Badminton · New cuisines' },
]

/* ── 02 · experience ──────────────────────────────────── */

export const experience = [
  {
    index: '02.1',
    company: 'Platizio Services LLP',
    role: 'Financial Market Analyst',
    period: 'AUG 2025 — JUN 2026',
    place: 'Noida',
    tag: 'FULL-TIME',
    summary:
      'Research seat on India’s newest investment category — Specialized Investment Funds — from regulation to retail education.',
    points: [
      'Tracked the SIF industry end to end: regulatory developments, fund launches, market trends',
      'Analyzed 17+ fund house launches and 20+ strategies with portfolio disclosures',
      'Designed the investor accreditation process flow; presented to 4+ stakeholders',
      'Created and reviewed content for 60+ videos on markets and investment products',
      'Built e-learning on AIFs & Equity Derivatives; mentored 2 interns to ship theirs',
    ],
    achievements: [
      'Grew SIF Insight to 1,000+ subscribers within 4 months of launch',
      'Developed working expertise across the evolving SIF ecosystem — 17+ launches, 20+ strategies',
      'Scripted and reviewed 60+ educational videos, sharpening financial communication',
      'Presented the accreditation flow to 4+ stakeholders, gaining regulatory exposure',
      'Independently learned instructional design and 3+ e-learning authoring tools',
      'Mentored 2 interns through complete AIF and Equity Derivatives courses',
    ],
    metrics: ['17+ FUND HOUSES', '20+ STRATEGIES', '60+ VIDEOS', '1,000+ SUBS'],
  },
  {
    index: '02.2',
    company: 'Platizio Services LLP',
    role: 'Financial Market Intern — Research',
    period: 'FEB 2025 — AUG 2025',
    place: 'Noida',
    tag: '24 WEEKS',
    summary: 'Sector deep-dive into the NBFC universe — the shadow engine of Indian credit.',
    points: [
      'Researched 8+ NBFC segments: microfinance, MSME, housing finance, gold loans',
      'Mapped business models, customer segments, revenue drivers and ecosystems',
      'Evaluated leading NBFCs on AUM, growth potential, positioning and shareholding',
    ],
    achievements: [
      'Built a working map of 8+ NBFC categories and their role in India’s credit ecosystem',
      'Assessed leading NBFCs on AUM, customer reach, growth prospects and ownership',
      'Strengthened comparative research through side-by-side business model analysis',
      'Learned how regulation and lending focus shape NBFC performance',
    ],
    metrics: ['8+ NBFC SEGMENTS', 'AUM · GROWTH · OWNERSHIP'],
  },
  {
    index: '02.3',
    company: 'Platizio Services LLP',
    role: 'Research Intern — Commodities',
    period: 'JUL 2024 — AUG 2024',
    place: 'Noida',
    tag: '6 WEEKS',
    summary: 'Crude oil & natural gas versus the Indian stock market — who moves whom.',
    points: [
      'Studied the energy commodity ecosystem: drivers, pricing, geopolitics',
      'Analyzed MCX volumes, contract structures and trading mechanisms',
      'Traced price impact across 6+ listed companies with TradingView',
    ],
    achievements: [
      'Linked crude oil and natural gas price moves to stocks of 6+ listed companies',
      'Developed commodity market analysis, volatility assessment and sectoral research skills',
      'Gained practical understanding of price discovery and derivatives trading on MCX',
    ],
    metrics: ['6+ LISTED COS', 'MCX DERIVATIVES'],
  },
]

/* ── 03 · education ───────────────────────────────────── */

export const education = [
  {
    school: 'Management Development Institute, Gurgaon',
    degree: 'PGDM — Post Graduate Diploma in Management',
    period: '2026 — 2028',
    score: 'NOW',
    note: 'Intended specializations: Finance & Strategy',
    current: true,
  },
  {
    school: 'Symbiosis Centre for Management Studies, Noida',
    degree: 'BBA — Symbiosis International University',
    period: '2022 — 2025',
    score: '9.37',
    note: 'Batch Topper — Certificate of Merit, Rank 1 of 315',
    current: false,
  },
  {
    school: "St Conrad's Inter College, Agra",
    degree: 'Class XII — ISC',
    period: '2022',
    score: '94.5%',
    note: '',
    current: false,
  },
  {
    school: "St Conrad's Inter College, Agra",
    degree: 'Class X — ICSE',
    period: '2020',
    score: '94.2%',
    note: '',
    current: false,
  },
]

export const catReceipt = {
  title: 'COMMON ADMISSION TEST — SCORECARD',
  rows: [
    { label: 'VARC', pct: 81.36 },
    { label: 'LRDI', pct: 99.06 },
    { label: 'QA', pct: 95.04 },
  ],
  overall: 96.75,
  footer: 'REG 25185039 · ADMITTED — MDI GURGAON',
}

/* ── 04 · work / projects ─────────────────────────────── */

export const projects = [
  {
    title: 'SIF Insight',
    meta: 'FINANCIAL EDUCATION · YOUTUBE',
    desc: '1,000+ subscribers in 4 months — India’s newest fund category, explained for real investors.',
    band: ['SIF INSIGHT', '1,000+ SUBSCRIBERS', '4 MONTHS', 'INVESTOR EDUCATION'],
  },
  {
    title: 'Investor Accreditation Flow',
    meta: 'PROCESS DESIGN · REGULATORY',
    desc: 'End-to-end onboarding and eligibility framework, pitched to 4+ stakeholders.',
    band: ['ACCREDITED INVESTORS', 'PROCESS → PRODUCT', '4+ STAKEHOLDERS'],
  },
  {
    title: 'International Investing MVP',
    meta: 'PRODUCT STRATEGY',
    desc: 'Argued the white-label-first launch — speed to market now, SDK platform later.',
    band: ['GLOBAL INVESTING', 'WHITE-LABEL FIRST', 'MVP STRATEGY'],
  },
  {
    title: 'AIF & Derivatives E-Learning',
    meta: 'INSTRUCTIONAL DESIGN',
    desc: 'Rebuilt a rejected course into shipped modules on Articulate 360; mentored 2 interns.',
    band: ['ARTICULATE 360', 'AIF · EQUITY DERIVATIVES', '2 INTERNS MENTORED'],
  },
  {
    title: 'DeFi × Public Finance',
    meta: 'ACADEMIC RESEARCH',
    desc: 'Mixed-methods study of decentralized finance and India’s public finance sector.',
    band: ['DEFI', 'RBI SANDBOX MODELS', '86.7% DEMAND KYC/AML'],
  },
  {
    title: 'Celebrity vs Influencer',
    meta: 'CONSUMER RESEARCH',
    desc: 'Endorsement effectiveness on brand image — 73.3% found influencers more impactful.',
    band: ['BRAND IMAGE', '30+ RESPONDENTS', '73.3% INFLUENCERS'],
  },
]

/* ── 05 · beyond / leadership ─────────────────────────── */

export const leadership = [
  {
    org: 'BIZCON — Business Fest',
    role: 'Video Editing Vertical Incharge',
    story: 'Led 20+ editors. When the opening film was rejected hours before showtime, re-cut and delivered it before the curtain.',
    metric: '20+ TEAM',
    year: '2024',
  },
  {
    org: 'Sports Council, SCMS Noida',
    role: 'Council Member',
    story: 'Ran campus sports operations with a 40+ member team.',
    metric: '40+ TEAM',
    year: '2023—24',
  },
  {
    org: 'Sports Fest & Clubs',
    role: 'Graphics Head',
    story: 'Led 6 designers shipping digital media for the sports fest and college clubs.',
    metric: '6 DESIGNERS',
    year: '2025',
  },
  {
    org: 'Girl Up Meera — NGO',
    role: 'Graphics Head',
    story: 'Led a 5-member team creating campaign media for the NGO’s drives.',
    metric: 'SOCIAL',
    year: '2024—25',
  },
]

export const medals = [
  { metal: 'GOLD', event: 'Kho-Kho — CISCE Nationals', year: '2019' },
  { metal: 'SILVER', event: 'Athletics — CISCE States', year: '2018' },
  { metal: 'GOLD ×2', event: 'Badminton — Symperia', year: '2025' },
]

export const alsoFluent = [
  'GRAPHIC DESIGN',
  'VIDEO EDITING',
  'CONTENT CREATION',
  'EVENT OPERATIONS',
  'EQUITY RESEARCH',
  'INSTRUCTIONAL DESIGN',
]

/* ── 06 · vision ──────────────────────────────────────── */

export const vision = {
  kicker: 'THE TRAJECTORY',
  title: 'Compounding, since 2020.',
  /* plotted on the chart, left to right */
  milestones: [
    { label: 'ICSE — 94.2%', year: '2020' },
    { label: 'ISC — 94.5%', year: '2022' },
    { label: 'BBA 9.37 — RANK 1/315', year: '2025' },
    { label: 'CAT 96.75 %ILE', year: '2025' },
    { label: 'PGDM — MDI GURGAON', year: '2026–28' },
    { label: 'FUND MANAGER', year: 'THE GOAL' },
  ],
}

export const footer = {
  cta: "LET'S TALK",
  note: 'Open to conversations on markets, research seats and summer internships.',
  colophon: 'Designed & built as a single-page experience — GSAP · React · WebGL',
}
