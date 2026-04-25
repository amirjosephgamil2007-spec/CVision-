import { CVResult, JobProfile } from '../types';

const MOCK_STRENGTHS = [
  'Demonstrated leadership in cross-functional teams with measurable outcomes',
  'Deep domain expertise aligning closely with requested core competencies',
  'Proven track record of optimizing systems/processes for efficiency gains',
  'Strong foundation in requested technical frameworks and methodologies',
  'Consistent career progression showing increased responsibility over time',
  'Advanced problem-solving skills evidenced by complex project delivery',
  'Exceptional attention to detail in technical documentation and execution',
  'Extensive experience with agile delivery and stakeholder management',
  'Clear evidence of independent ownership and successful project delivery',
  'Relevant academic background complementing practical industry experience'
];

const MOCK_WEAKNESSES = [
  'Experience skewing towards legacy tools rather than the requested modern stack',
  'Noticeable gaps in recent employment history without clear contextual explanation',
  'Short tenures in recent roles suggesting potential retention risk',
  'Lacks specific mandatory certifications explicitly outlined in the job profile',
  'Insufficient direct experience with the primary technologies listed in requirements',
  'Management experience is largely entry-level rather than the required senior capacity',
  'Project scale handled previously is significantly smaller than current requirements',
  'Focus has been too specialized, lacking the cross-functional breadth required',
  'Communication of impact in CV is generic rather than metrics-driven',
  'Missing explicit mention of required domain-specific industry knowledge'
];

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
  // Simulate processing delay
  await delay(1000 + Math.random() * 1500);

  let fileContent = "";
  if (file.type === 'text/plain') {
    fileContent = await file.text();
  }

  let candidateName = extractNameFromFileName(file.name);
  if (fileContent && fileContent.trim().length > 0) {
    const firstLine = fileContent.split('\n').map(l => l.trim()).filter(l => l.length > 0)[0];
    if (firstLine && firstLine.length < 40) {
      candidateName = firstLine; 
    }
  }

  // Stricter rating logic (bell curve around 5-7, rare 9-10)
  const baseSeed = file.size + file.name.length;
  
  // Normal distribution approximation for stricter scoring (mostly 3-7, rare 8-10)
  let u = 0, v = 0;
  while(u === 0) u = Math.random();
  while(v === 0) v = Math.random();
  let num = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
  num = num / 10.0 + 0.5; // Translate to 0 -> 1
  if (num > 1 || num < 0) num = Math.random(); // resample between 0 and 1
  
  let scoreBase = Math.floor(num * 9) + 1; // 1 to 9
  
  // Adjust based on "keyword match" simulation
  const fileExt = file.name.split('.').pop()?.toLowerCase();
  if (fileExt === 'txt' && scoreBase > 6) scoreBase -= 1; // Arbitrary strictness: TXT implies less formatting effort
  
  let score = Math.max(1, Math.min(10, scoreBase + (baseSeed % 3 === 0 ? 1 : 0))); // Add slight variance
  let skillsMatch = score * 10 - Math.floor(Math.random() * 15); // Stricter skills match correlated to score
  skillsMatch = Math.max(15, Math.min(98, skillsMatch)); // Cap between 15 and 98
  
  // Select strengths/weaknesses ensuring they sound highly detailed and professional
  const shuffledStrengths = [...MOCK_STRENGTHS].sort(() => 0.5 - Math.random());
  const strengthsCount = score > 7 ? 4 : (score > 4 ? 3 : 2); // Higher score = more strengths
  const strengths = shuffledStrengths.slice(0, strengthsCount); 
  
  const shuffledWeaknesses = [...MOCK_WEAKNESSES].sort(() => 0.5 - Math.random());
  const weaknessesCount = score < 5 ? 4 : (score < 8 ? 3 : 2); // Lower score = more weaknesses
  const weaknesses = shuffledWeaknesses.slice(0, weaknessesCount); 
  
  const experienceYears = Math.floor((baseSeed % 12) + 1);
  const reqExp = profile.experienceLevel ? ` Requires ${profile.experienceLevel}.` : '';
  const experience = `${experienceYears} years total exp.${reqExp}`;
  
  // Generate a highly detailed, strict summary
  let certAnalysis = "";
  if (profile.certifications) {
    const hasCerts = baseSeed % 3 === 0; // 1/3 chance of having certs
    if (hasCerts) {
      certAnalysis = `Candidate appears to hold qualifications relevant to the requested [${profile.certifications}]. `;
      if (score < 8) score += 1; // Bump score slightly if they have certs
    } else {
      certAnalysis = `Crucially lacks the explicitly requested certifications ([${profile.certifications}]). `;
      if (score > 4) score -= 1; // Penalize if missing certs
      if (!weaknesses.includes('Lacks specific mandatory certifications explicitly outlined in the job profile')) {
          weaknesses.push('Lacks specific mandatory certifications explicitly outlined in the job profile');
      }
    }
  }

  const sentiment = score >= 8 ? 'Highly recommended' : (score >= 6 ? 'Adequate potential' : 'Does not meet core requirements');
  const details = score >= 8 
    ? 'presents an exceptionally strong alignment with the technical and operational demands of the profile. Their experience depth suggests they could ramp up quickly.' 
    : (score >= 6 
      ? 'shows a partial match to the core requirements. While they possess some foundational skills, significant upskilling may be required in key domain areas.' 
      : 'presents substantial gaps against the primary qualifications. Their background does not currently align closely enough with the immediate needs of this role.');

  const summary = `${sentiment}. ${candidateName} ${details} Skills match is calculated at ${skillsMatch}%. ${certAnalysis}They reflect ${experienceYears} years of experience against the targeted ${profile.experienceLevel || 'baseline requirement'}.`;

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
