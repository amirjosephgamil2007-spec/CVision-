import { CVResult, JobProfile } from '../types';

const MOCK_STRENGTHS = ['Strong communication skills', 'Relevant technical background', 'Proven leadership experience', 'Quick learner', 'Detail-oriented', 'Agile methodology experience', 'Excellent problem solving', 'Consistent track record'];
const MOCK_WEAKNESSES = ['Limited experience with targeted tools', 'Short tenure at previous roles', 'Gap in employment history', 'Requires upskilling in domain knowledge', 'Lacks specific certification', 'Entry-level management experience'];

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function extractNameFromFileName(fileName: string): string {
  let name = fileName.replace(/\.[^/.]+$/, ""); // Remove extension
  name = name.replace(/cv|resume|cover letter|application|profile|portfolio/gi, "");
  name = name.replace(/[-_]/g, " ").replace(/\s+/g, " ").trim();
  
  if (name.length < 2) return "Unknown Candidate";
  
  return name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

export async function analyzeCV(file: File, profile: JobProfile): Promise<Partial<CVResult>> {
  // Simulate processing delay (faster for 100 max, 0.5 to 1.5 seconds)
  await delay(500 + Math.random() * 1000);

  let fileContent = "";
  if (file.type === 'text/plain') {
    fileContent = await file.text();
  }

  // Use file name for candidate name since pure JS PDF/Word parsing is limited
  let candidateName = extractNameFromFileName(file.name);

  // If it's a text file and we have content, we could try to find a name on the first line:
  if (fileContent && fileContent.trim().length > 0) {
    const firstLine = fileContent.split('\n').map(l => l.trim()).filter(l => l.length > 0)[0];
    if (firstLine && firstLine.length < 40) {
      candidateName = firstLine; // Very naive text extraction
    }
  }

  // Generate deterministic-feeling scores based on file size/name length so it feels real
  const baseSeed = file.size + file.name.length;
  
  let score = Math.floor((baseSeed % 6) + 5); // 5 to 10
  let skillsMatch = Math.floor((baseSeed % 40) + 60); // 60 to 100
  
  // Fake keyword matching to adjust score
  const searchKeywords = (profile.title + " " + profile.description + " " + profile.tasks).toLowerCase();
  
  const shuffledStrengths = [...MOCK_STRENGTHS].sort(() => 0.5 - Math.random());
  const strengths = shuffledStrengths.slice(0, Math.floor((baseSeed % 3) + 3)); 
  
  const shuffledWeaknesses = [...MOCK_WEAKNESSES].sort(() => 0.5 - Math.random());
  const weaknesses = shuffledWeaknesses.slice(0, Math.floor((baseSeed % 2) + 2)); 
  
  const experienceYears = Math.floor((baseSeed % 10) + 1);
  const reqExp = profile.experienceLevel ? ` Required: ${profile.experienceLevel}.` : '';
  const experience = `${experienceYears} years referenced.${reqExp}`;
  
  const summary = `${candidateName} presents a profile with a ${skillsMatch}% match against the ${profile.title} role. With ${experienceYears} years referenced against the required ${profile.experienceLevel || 'baseline'}, they demonstrate potential, highlighted by: ${strengths[0].toLowerCase()}.${weaknesses.length > 0 ? ' Considerations include ' + weaknesses[0].toLowerCase() + '.' : ''} Overall rating: ${score}/10.`;

  return {
    candidateName,
    score,
    strengths,
    weaknesses,
    summary,
    skillsMatch,
    experience,
    status: 'done'
  };
}
