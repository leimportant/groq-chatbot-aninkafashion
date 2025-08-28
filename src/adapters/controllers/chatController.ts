import { Request, Response } from 'express';
import Groq from 'groq-sdk';
// import env
import dotenv from 'dotenv';
dotenv.config();


const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

export const chat = async (req: Request, res: Response) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const model = process.env.GROQ_MODEL ?? 'llama-3.1-8b-instant';
  const temperature = Number(process.env.GROQ_TEMPERATURE ?? '0.7');
  const max_tokens = Number(process.env.GROQ_MAX_COMPLETION_TOKENS ?? '1024');
  const top_p = Number(process.env.GROQ_TOP_P ?? '1');
  // Force stream to false for simplicity
  const stream = false;

  try {
    const completionOrStream = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content:
          `You are an AI assistant for Aninka Fashion (aninkafashion.com).
          You help customers with:
          - Finding clothing and accessories
          - Answering questions about sizes and materials
          - Providing fashion advice
          - Handling order inquiries
          - Processing returns and exchanges
          - Order Status
          - Tracking Orders
          - Payment Methods
          - Shipping Information
          Please be polite and professional. Use Bahasa Indonesia as primary language.
          If you don\'t know the answer, just say "I don\'t know".`,
        },
        { role: 'user', content: message },
      ],
      model,
      temperature,
      max_completion_tokens: max_tokens,
      top_p,
      stream,
    });

    // Set stream to false for simplicity
    const normalResponse = completionOrStream as Groq.Chat.ChatCompletion;
    const responseText = normalResponse.choices[0]?.message?.content ?? '';
    res.send(responseText);
  } catch (error) {
    console.error('Groq API error:', error);
    res.status(500).json({
      error: 'An error occurred while processing your request.',
      details: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};
