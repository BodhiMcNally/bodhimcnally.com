export type Publication = {
  id: string;
  title: string;
  authors: string[];
  journal: string;
  year: number;
  doi?: string;
  pubmedUrl?: string;
  citation: string;
  publicationType:
    | 'Journal article'
    | 'Review article'
    | 'Conference abstract'
    | 'Other';
  selected?: boolean;
};

export type Presentation = {
  id: string;
  title: string;
  conference: string;
  location?: string;
  date: string;
  presentationType:
    | 'Oral presentation'
    | 'Poster presentation'
    | 'Conference abstract'
    | 'Invited talk';
  citation?: string;
  link?: string;
  selected?: boolean;
};

export type ResearchProject = {
  id: string;
  title: string;
  institution?: string;
  collaborators?: string[];
  role?: string;
  researchArea: string;
  status: 'Active' | 'Completed' | 'Planned' | 'Paused';
  shortDescription: string;
  outputs?: string[];
  startYear?: number;
  endYear?: number;
  selected?: boolean;
};

export const publications: Publication[] = [];
export const presentations: Presentation[] = [];
export const projects: ResearchProject[] = [
  {
    id: 'radiation-cystitis-rada16',
    title: 'Radiation cystitis outcomes and the RADA16 protocol',
    institution: 'Nepean Urology Research Group (NURG)',
    collaborators: ['Dr Jonathan Kam'],
    role: 'Surgical Research Scholar with RISE',
    researchArea: 'Radiation cystitis and surgical outcomes',
    status: 'Active',
    shortDescription:
      'Working with Dr Jonathan Kam and NURG through RISE, I am helping to develop a retrospective study of hospital presentations and admissions for haematuria or clot retention related to radiation cystitis. The study will characterise the burden of care under conventional management and compare it with the newer RADA16 (PuraStat) protocol, focusing on length of stay, blood transfusion, operating-theatre use and re-presentation. Data access, ethics and governance are being established; no results are yet available.',
    startYear: 2026,
    selected: true,
  },
];
