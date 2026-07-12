import { prisma } from './db';
import { generateAIReply } from './ai';
import { sendInstagramMessage } from './instagram';

interface MessagingEvent {
  sender: { id: string };
  recipient: { id: string };
  timestamp: number;
  message?: {
    mid: string;
    text: string;
  };
}

export async function processIncomingMessage(event: MessagingEvent) {
  // Ignore non-text messages (stickers, images, etc.) for now
  if (!event.message?.text) {
    console.log('Skipping message: No text content.');
    return;
  }

  const senderId = event.sender.id;
  const messageText = event.message.text;
  const messageId = event.message.mid;

  try {
    // 1. Deduplication — check if we've already processed this message
    const existing = await prisma.message.findUnique({
      where: { igMessageId: messageId },
    });
    if (existing) {
      console.log(`Message ${messageId} already processed. Skipping.`);
      return;
    }

    // 2. Find or create conversation
    let conversation = await prisma.conversation.findUnique({
      where: { participantId: senderId },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: { participantId: senderId },
      });
    }

    // 3. Save incoming message
    await prisma.message.create({
      data: {
        igMessageId: messageId,
        conversationId: conversation.id,
        senderId,
        text: messageText,
        isFromBot: false,
        timestamp: (() => {
          if (!event.timestamp) return new Date();
          const ts = typeof event.timestamp === 'string' ? parseInt(event.timestamp, 10) : event.timestamp;
          // If it's a 10-digit Unix timestamp (seconds), multiply by 1000 to get milliseconds
          const timestampMs = ts < 9999999999 ? ts * 1000 : ts;
          const parsedDate = new Date(timestampMs);
          return isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
        })(),
      },
    });

    // 4. Fetch bot settings (create default settings if none exist)
    let settings = await prisma.botSettings.findFirst({
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

    // 5. Check if auto-reply is enabled globally and for this specific conversation
    if (!settings.isGloballyActive) {
      console.log('Auto-reply is globally deactivated. Skipping AI response.');
      return;
    }

    if (!conversation.isAutoReplyOn) {
      console.log(`Auto-reply is paused for conversation ${conversation.id}. Skipping AI response.`);
      return;
    }

    // 6. Generate AI reply using OpenRouter
    console.log(`Generating AI reply for conversation ${conversation.id}...`);
    const aiReply = await generateAIReply({
      conversationId: conversation.id,
      userMessage: messageText,
    });

    console.log(`AI reply generated: "${aiReply.slice(0, 50)}..."`);

    // 7. Send reply via Instagram Graph API
    console.log(`Sending message to Instagram user ${senderId}...`);
    const sent = await sendInstagramMessage(senderId, aiReply);

    // 8. Save bot reply to database if sending succeeded
    if (sent) {
      await prisma.message.create({
        data: {
          igMessageId: `bot_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          conversationId: conversation.id,
          senderId: 'bot',
          text: aiReply,
          isFromBot: true,
          timestamp: new Date(),
        },
      });

      // Update conversation timestamp
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { updatedAt: new Date() },
      });

      console.log('AI reply sent and saved successfully.');
    } else {
      console.error('Failed to send AI response message to Instagram.');
    }
  } catch (error) {
    console.error('Error during webhook event processing pipeline:', error);
  }
}
