import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { prisma } from './db';

// Configure OpenRouter as an OpenAI-compatible provider
const openrouter = createOpenAI({
  apiKey: process.env.OPENROUTER_API_KEY || 'dummy-key',
  baseURL: 'https://openrouter.ai/api/v1',
  headers: {
    'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    'X-Title': 'Instagram AI Agent',
  },
});

interface GenerateReplyOptions {
  conversationId: string;
  userMessage: string;
}

export async function generateAIReply({ conversationId, userMessage }: GenerateReplyOptions): Promise<string> {
  // 1. Fetch bot settings
  const settings = await prisma.botSettings.findFirst({
    where: { id: 'default' },
  });

  const systemPrompt = settings?.systemPrompt || 'You are a helpful assistant responding to Instagram DMs. Be friendly, concise, and helpful.';
  const maxHistory = settings?.maxHistoryLength || 15;
  const modelId = settings?.model || 'google/gemini-2.0-flash-001';

  // 2. Fetch conversation history for context
  const history = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { timestamp: 'desc' },
    take: maxHistory,
  });

  // Reverse to chronological order
  const messages = history.reverse().map((msg) => ({
    role: msg.isFromBot ? ('assistant' as const) : ('user' as const),
    content: msg.text,
  }));

  // Add the new user message
  messages.push({ role: 'user', content: userMessage });

  // 3. Generate reply via OpenRouter
  try {
    const result = await generateText({
      model: openrouter(modelId),
      system: systemPrompt,
      messages,
    });

    return result.text;
  } catch (error) {
    console.error('Error calling OpenRouter API:', error);
    throw error;
  }
}
