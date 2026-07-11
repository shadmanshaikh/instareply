import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    let settings = await prisma.botSettings.findUnique({
      where: { id: 'default' },
    });

    if (!settings) {
      settings = await prisma.botSettings.create({
        data: {
          id: 'default',
          systemPrompt: 'You are a helpful assistant responding to Instagram DMs. Be friendly, concise, and helpful.',
          isGloballyActive: true,
          maxHistoryLength: 15,
          model: 'google/gemini-2.0-flash-001',
        },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { systemPrompt, isGloballyActive, maxHistoryLength, model } = body;

    const updatedSettings = await prisma.botSettings.upsert({
      where: { id: 'default' },
      update: {
        systemPrompt,
        isGloballyActive,
        maxHistoryLength: Number(maxHistoryLength),
        model,
      },
      create: {
        id: 'default',
        systemPrompt,
        isGloballyActive,
        maxHistoryLength: Number(maxHistoryLength),
        model,
      },
    });

    return NextResponse.json(updatedSettings);
  } catch (error) {
    console.error('Error updating settings:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
