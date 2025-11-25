import { openaiClient } from './openaiClient';
import type { Message } from './openaiClient';

export async function getAIResponse(prompt: string, userId: string, systemPrompt?: string): Promise<string> {
  try {
    if (!userId) {
      throw new Error('User ID is required. Please log in.');
    }

    const messages: Message[] = [];

    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    } else {
      messages.push({
        role: 'system',
        content: 'You are an intelligent mentor and recruitment assistant.'
      });
    }

    messages.push({ role: 'user', content: prompt });

    const result = await openaiClient.sendMessage(messages, userId);
    return result.reply;
  } catch (error) {
    console.error('AI error:', error);

    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';

    if (errorMessage.includes('OpenAI API key') || errorMessage.includes('AI service is not configured')) {
      throw new Error('The AI service is currently unavailable. Please ensure the OpenAI API key is configured in your Supabase project settings.');
    }

    if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
      throw new Error('Unable to connect to the AI service. Please check your internet connection and try again.');
    }

    throw new Error(errorMessage);
  }
}

export async function analyzeCVForEmirates(cvContent: string, userId: string): Promise<string> {
  const systemPrompt = `You are an experienced Emirates cabin crew recruiter with 10+ years of experience reviewing CVs. You understand what makes a candidate stand out for Emirates cabin crew positions. Provide honest, constructive feedback that helps candidates improve their applications.`;

  const userPrompt = `Please review the following CV for an Emirates cabin crew position and provide detailed feedback in the following format:

**OVERALL SCORE: X/10**

**STRENGTHS:**
- List 3-4 strong points

**AREAS FOR IMPROVEMENT:**
- List 3-4 areas that need work

**EMIRATES-SPECIFIC RECOMMENDATIONS:**
- List 3-4 specific tips for Emirates applications

**KEY ACTION ITEMS:**
- List 2-3 immediate changes to make

CV CONTENT:
${cvContent}`;

  return getAIResponse(userPrompt, userId, systemPrompt);
}

export async function getCabinCrewGuidance(question: string, userId: string): Promise<string> {
  const systemPrompt = `You are a friendly and knowledgeable Emirates cabin crew coach. You help aspiring cabin crew members prepare for their assessment day, interviews, and career. Provide practical, actionable advice with a warm and encouraging tone. Keep responses concise (2-3 paragraphs max) but helpful.`;

  return getAIResponse(question, userId, systemPrompt);
}

export async function optimizeCVForATS(cvContent: string, userId: string): Promise<string> {
  const systemPrompt = `You are an expert CV writer specializing in aviation and cabin crew positions. You create ATS-friendly CVs that pass Applicant Tracking Systems while highlighting aviation industry keywords. You know exactly what Emirates, Qatar Airways, Etihad, and other top airlines look for.`;

  const userPrompt = `Transform the following CV into a fully ATS-optimized, aviation-ready CV for cabin crew positions.

REQUIREMENTS:
1. Use standard ATS-friendly section headers: CONTACT INFORMATION, PROFESSIONAL SUMMARY, KEY SKILLS, WORK EXPERIENCE, EDUCATION, CERTIFICATIONS, LANGUAGES
2. Include aviation and cabin crew keywords: customer service excellence, safety procedures, in-flight service, passenger care, emergency response, multilingual, hospitality, team collaboration, cultural awareness, conflict resolution
3. Use bullet points with action verbs (Delivered, Managed, Coordinated, Maintained, Resolved)
4. Quantify achievements where possible (served 200+ passengers daily, achieved 98% satisfaction rating)
5. Highlight soft skills crucial for cabin crew: communication, adaptability, problem-solving, empathy, professionalism
6. Format cleanly without tables, columns, or graphics (ATS-friendly)
7. Keep it concise (1-2 pages maximum)
8. Make it aviation-industry focused even if current experience isn't in aviation

ORIGINAL CV:
${cvContent}

Please provide the complete, fully optimized CV ready to copy and paste:`;

  return getAIResponse(userPrompt, userId, systemPrompt);
}
