export interface JobProfile {
  id: string;
  title: string;
  description: string;
  tasks: string;
  experienceLevel?: string;
  certifications?: string;
}

export interface CVResult {
  id: string;
  file: File;
  fileName: string;
  candidateName: string;
  score: number;
  strengths: string[];
  weaknesses: string[];
  summary: string;
  skillsMatch: number;
  experience: string;
  status: 'analyzing' | 'done' | 'error';
  errorMessage?: string;
}
