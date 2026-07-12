import { NextResponse } from 'next/server';
import { verifySignature } from '@/lib/instagram';
import { processIncomingMessage } from '@/lib/webhook-utils';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const verifyToken = process.env.WEBHOOK_VERIFY_TOKEN;

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('✅ Webhook verification successful');
    return new NextResponse(challenge, { status: 200 });
  }

  console.warn('❌ Webhook verification failed. Token mismatch.');
  return new NextResponse('Forbidden', { status: 403 });
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-hub-signature-256') || '';

    console.log('📩 Webhook POST received');
    console.log('Signature present:', !!signature);
    console.log('META_APP_SECRET loaded:', !!process.env.META_APP_SECRET);
    console.log('META_APP_SECRET length:', process.env.META_APP_SECRET?.length || 0);
    console.log('Raw body length:', rawBody.length);

    // Verify signature (temporarily bypassed for debugging — TODO: re-enable)
    const signatureValid = verifySignature(rawBody, signature);
    if (!signatureValid) {
      console.warn('⚠️ Signature mismatch — BYPASSED FOR DEBUGGING');
      console.warn('Received signature:', signature.substring(0, 20) + '...');
      // return new NextResponse('Invalid signature', { status: 401 });
    }

    const body = JSON.parse(rawBody);

    // Log the full payload to debug structure
    console.log('📦 Webhook payload:', JSON.stringify(body, null, 2));
    console.log('Object type:', body.object);

    if (body.object === 'instagram') {
      const entries = body.entry || [];
      console.log('Number of entries:', entries.length);

      for (const entry of entries) {
        console.log('Entry ID:', entry.id);
        console.log('Entry keys:', Object.keys(entry).join(', '));
        
        // Combine events from both standard messaging arrays and test changes arrays
        const messagingEvents: any[] = [];
        if (entry.messaging) {
          messagingEvents.push(...entry.messaging);
        }
        if (entry.changes) {
          entry.changes.forEach((change: any) => {
            if (change.field === 'messages' && change.value) {
              messagingEvents.push(change.value);
            }
          });
        }

        console.log('Number of messaging events found:', messagingEvents.length);

        for (const event of messagingEvents) {
          console.log('Processing event:', JSON.stringify(event));
          try {
            await processIncomingMessage(event);
            console.log('✅ Event processed successfully');
          } catch (err) {
            console.error('❌ Error processing event:', err);
          }
        }
      }

      return new NextResponse('EVENT_RECEIVED', { status: 200 });
    }

    console.warn('⚠️ Unknown object type, returning 404:', body.object);
    return new NextResponse('Not Found', { status: 404 });
  } catch (error) {
    console.error('Error in webhook POST handler:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
