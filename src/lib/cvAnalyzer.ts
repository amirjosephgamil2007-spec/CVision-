import { GoogleGenAI } from "@google/genai";
import { CVResult, JobProfile } from '../types';

export async function analyzeCV(file: File, profile: JobProfile): Promise<Partial<CVResult>> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      try {
        const base64Data = reader.result as string;

        const extractRes = await fetch('/api/extract-text', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fileName: file.name,
            fileData: base64Data,
            mimeType: file.type || getMimeTypeFromExt(file.name),
          }),
        });

        if (!extractRes.ok) {
          const errorData = await extractRes.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to extract text from CV');
        }

        const { base64Data: finalData, mimeType: finalMimeType } = await extractRes.json();

        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        
        const prompt = `You are an expert technical recruiter and HR specialist.
Please analyze the provided resume against the following job profile requirements:

Job Title: ${profile.title}
Experience Required: ${profile.experienceLevel || "Not specified"}
Certifications Required: ${profile.certifications || "Not specified"}

Job Description:
${profile.description}

Key Responsibilities/Tasks:
${profile.tasks}

Analyze the candidate's resume carefully. Give a totally objective assessment.
Return ONLY a valid JSON object matching the following structure exactly (without formatting markdown like \`\`\`json):

{
  "candidateName": "string (Extract their actual name from the CV text. If not found, use a best guess or 'Unknown')",
  "score": number (1 to 10 integer. Be very strict. 10 is a perfect match, 5 is average, 1 is terrible),
  "skillsMatch": number (percentage 0 to 100),
  "strengths": ["string", "string"], (at least 2 to 4 very specific strengths related to the requirements)
  "weaknesses": ["string", "string"], (at least 2 to 4 very specific shortcomings, missing certs, or lacks of experience based on requirements)
  "experience": "string", (short summary of their years of experience explicitly found, e.g. '5 years relevant experience')
  "summary": "string" (a detailed 3-4 sentence paragraph summarizing the match, clearly referencing their specific strengths, weaknesses, and qualifications. Mention if they have the required certifications.)
}

If the file seems unreadable or devoid of resume content, set score to 1 and note that in the summary.`;

        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: [
            prompt,
            {
              inlineData: {
                data: finalData,
                mimeType: finalMimeType
              }
            }
          ],
          config: {
            responseMimeType: "application/json"
          }
        });

        const responseText = response.text || "{}";
        const jsonOutput = responseText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        const data = JSON.parse(jsonOutput);
        
        // Return the required fields parsed from the API response
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
        
        // Improve error message if it's related to API keys
        if (errorMessage.includes('API key not valid') || errorMessage.includes('API_KEY_INVALID')) {
           errorMessage = "Invalid Gemini API Key. Please click the gear icon in the top right, go to 'Secrets', and provide a valid GEMINI_API_KEY.";
        }
        
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

