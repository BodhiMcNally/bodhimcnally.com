export type ProfileLink = {
  label: string;
  href: string;
  detail?: string;
  footer?: boolean;
};

export const site = {
  name: 'Bodhi McNally',
  shortName: 'BM',
  canonicalUrl: 'https://bodhimcnally.com',
  defaultTitle: 'Bodhi McNally — Medicine, Research & Teaching',
  defaultDescription:
    'Bodhi McNally is a Doctor of Medicine student at the University of Sydney with a background in data science, healthcare analytics and university teaching.',
  location: 'Sydney, Australia',
  currentRole: 'Doctor of Medicine student',
  institution: 'University of Sydney',
  clinicalSchool: 'Westmead Clinical School',
  descriptor: 'Medicine · Quantitative research · Teaching',
  introduction:
    'I am a Doctor of Medicine student at the University of Sydney, based at Westmead Clinical School, with a background in data science and healthcare analytics. My developing academic interests lie in urology, surgical outcomes and quantitative clinical research.',
  cv: {
    href: null as string | null,
    expectedPath: '/cv/Bodhi_McNally_CV.pdf',
  },
  email: null as string | null,
  profiles: [
    {
      label: 'ORCID',
      href: 'https://orcid.org/0009-0000-4314-8425',
      detail: '0009-0000-4314-8425',
      footer: true,
    },
    {
      label: 'University profile',
      href: 'https://www.maths.usyd.edu.au/ut/people?who=B_McNally&sms=y',
      detail: 'School of Mathematics and Statistics',
      footer: true,
    },
    {
      label: 'LinkedIn',
      href: 'https://www.linkedin.com/in/bodhi-mcnally',
      detail: 'Bodhi McNally',
      footer: true,
    },
  ] satisfies ProfileLink[],
  optionalProfiles: {
    github: null as string | null,
    googleScholar: null as string | null,
  },
} as const;

export const navigation = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about/' },
  { label: 'Research', href: '/research/' },
  { label: 'Teaching', href: '/teaching/' },
  { label: 'Resources', href: '/resources/' },
  { label: 'Leadership & Service', href: '/leadership/' },
  { label: 'Contact', href: '/contact/' },
] as const;
