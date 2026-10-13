import siteCopy from './site-copy.json';
import cvPages from './cv-pages.json';

export type ProfileLink = {
  label: string;
  href: string;
  detail?: string;
  footer?: boolean;
};

export type EmailLink = {
  label: string;
  address: string;
};

export type Appearance = {
  year: number;
  event: string;
  location: string;
};

export const site = {
  name: siteCopy['profile-name'].markdown,
  shortName: siteCopy['profile-shortName'].markdown,
  canonicalUrl: 'https://bodhimcnally.com',
  defaultTitle: siteCopy['profile-defaultTitle'].markdown,
  defaultDescription:
    siteCopy['profile-defaultDescription'].markdown,
  location: siteCopy['profile-location'].markdown,
  currentRole: siteCopy['profile-currentRole'].markdown,
  institution: siteCopy['profile-institution'].markdown,
  clinicalSchool: siteCopy['profile-clinicalSchool'].markdown,
  introduction:
    siteCopy['profile-introduction'].markdown,
  researchSummary:
    siteCopy['profile-researchSummary'].markdown,
  cv: {
    driveHref: 'https://drive.google.com/file/d/15gHFVTP9Cgdh4T-KLPsUnEmfxF7kbx50/view?usp=drivesdk',
    downloadHref: '/api/cv?download=1',
    previewPages: cvPages.pages,
    previewDimensions: cvPages.dimensions,
    updated: 'September 2026',
  },
  teachingPortfolio: {
    href: '/teaching/Bodhi_McNally_Teaching_Portfolio.pdf',
  },
  emails: [
    {
      label: 'University email',
      address: 'bodhi.mcnally@sydney.edu.au',
    },
    {
      label: 'Personal email',
      address: 'bodhi.mcnally@gmail.com',
    },
  ] satisfies EmailLink[],
  profiles: [
    {
      label: 'LinkedIn',
      href: 'https://www.linkedin.com/in/bodhi-mcnally',
      detail: 'linkedin.com/in/bodhi-mcnally',
      footer: true,
    },
    {
      label: 'University teaching profile',
      href: 'https://www.maths.usyd.edu.au/ut/people?who=B_McNally&sms=y',
      detail: 'School of Mathematics and Statistics',
      footer: true,
    },
    {
      label: 'GitHub',
      href: 'https://github.com/BodhiMcNally',
      detail: 'github.com/BodhiMcNally',
      footer: true,
    },
    {
      label: 'ORCID',
      href: 'https://orcid.org/0009-0000-4314-8425',
      detail: '0009-0000-4314-8425',
      footer: true,
    },
  ] satisfies ProfileLink[],
  optionalProfiles: {
    googleScholar: null as string | null,
  },
  appearances: [
    {
      year: 2026,
      event: 'RACS Annual Research Conference',
      location: 'Macquarie Park, Sydney',
    },
    {
      year: 2027,
      event: 'USANZ 2027',
      location: 'Brisbane',
    },
  ] satisfies Appearance[],
} as const;

export const navigation = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about/' },
  { label: 'Research', href: '/research/' },
  { label: 'Teaching', href: '/teaching/' },
  { label: 'Resources', href: '/resources/' },
  { label: 'Contact', href: '/contact/' },
] as const;
