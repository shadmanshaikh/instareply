import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { isAutoReplyOn } = body;

    const conversation = await prisma.conversation.update({
      where: { id },
      data: { isAutoReplyOn },
    });

    return NextResponse.json(conversation);
  } catch (error) {
    console.error('Error toggling conversation status:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
