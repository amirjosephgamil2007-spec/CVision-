import { CVResult, JobProfile } from '../types';

export async function analyzeCV(file: File, profile: JobProfile): Promise<Partial<CVResult>> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      try {
        const base64Data = reader.result as string;

        const response = await fetch('/api/analyze-cv', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fileName: file.name,
            fileData: base64Data,
            mimeType: file.type || getMimeTypeFromExt(file.name),
            profile,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to analyze CV');
        }

        const data = await response.json();
        
        resolve({
          candidateName: data.candidateName || file.name.split('.')[0],
          score: data.score || 1,
          skillsMatch: data.skillsMatch || 0,
          strengths: data.strengths || [],
          weaknesses: data.weaknesses || [],
          experience: data.experience || 'Not documented',
          summary: data.summary || 'Summary could not be generated.',
          status: 'done'
        });
      } catch (err: any) {
        console.error("Analysis Error:", err);
        
        let errorMessage = err.message || 'There was an error parsing this file.';
        
        resolve({
          candidateName: file.name.split('.')[0],
          score: 1,
          skillsMatch: 0,
          strengths: ['API Error'],
          weaknesses: ['Failed to analyze properly'],
          experience: 'Unknown',
          summary: errorMessage,
          status: 'done'
        });
      }
    };
    reader.onerror = () => {
      resolve({
        candidateName: file.name.split('.')[0],
        score: 1,
        skillsMatch: 0,
        strengths: ['None'],
        weaknesses: ['Failed to read file'],
        experience: 'Unknown',
        summary: 'Failed to read file locally.',
        status: 'done'
      });
    };
  });
}

function getMimeTypeFromExt(name: string) {
  if (name.endsWith('.docx')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  if (name.endsWith('.pdf')) return 'application/pdf';
  if (name.endsWith('.txt')) return 'text/plain';
  return 'application/octet-stream';
}

