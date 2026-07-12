import crypto from 'crypto';

const GRAPH_API_VERSION = 'v25.0';
const GRAPH_API_BASE = `https://graph.instagram.com/${GRAPH_API_VERSION}`;

export function verifySignature(rawBody: string, signature: string): boolean {
  if (!signature) return false;

  const appSecret = process.env.META_APP_SECRET;
  if (!appSecret) {
    console.error('Missing META_APP_SECRET in environment variables');
    return false;
  }

  const expectedSignature =
    'sha256=' +
    crypto.createHmac('sha256', appSecret).update(rawBody).digest('hex');

  const expected = Buffer.from(expectedSignature, 'utf8');
  const received = Buffer.from(signature, 'utf8');

  if (expected.length !== received.length) return false;
  return crypto.timingSafeEqual(expected, received);
}

export async function sendInstagramMessage(
  recipientId: string,
  messageText: string
): Promise<boolean> {
  const accessToken = process.env.INSTAGRAM_PAGE_ACCESS_TOKEN;
  if (!accessToken) {
    console.error('Missing INSTAGRAM_PAGE_ACCESS_TOKEN in environment variables');
    return false;
  }

  // Instagram has a ~1000 char limit per message. Split long messages into chunks.
  const chunks = splitMessage(messageText, 950);

  for (let i = 0; i < chunks.length; i++) {
    try {
      const response = await fetch(`${GRAPH_API_BASE}/me/messages?access_token=${accessToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: { id: recipientId },
          message: { text: chunks[i] },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Failed to send Instagram message:', error);
        return false;
      }
    } catch (err) {
      console.error('Error in sendInstagramMessage fetch:', err);
      return false;
    }

    // Add delay between chunks to simulate typing
    if (i < chunks.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return true;
}

function splitMessage(text: string, maxLength: number): string[] {
  if (text.length <= maxLength) return [text];

  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= maxLength) {
      chunks.push(remaining);
      break;
    }

    // Try to split at a sentence or word boundary
    let splitIndex = remaining.lastIndexOf('. ', maxLength);
    if (splitIndex === -1 || splitIndex < maxLength * 0.5) {
      splitIndex = remaining.lastIndexOf(' ', maxLength);
    }
    if (splitIndex === -1) {
      splitIndex = maxLength;
    }

    chunks.push(remaining.substring(0, splitIndex + 1).trim());
    remaining = remaining.substring(splitIndex + 1).trim();
  }

  return chunks;
}
