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

// Keep these arrays empty until a record is verified and suitable to publish.
// Concrete copy-ready examples are included in README.md.
export const publications: Publication[] = [];
export const presentations: Presentation[] = [];
export const projects: ResearchProject[] = [];
