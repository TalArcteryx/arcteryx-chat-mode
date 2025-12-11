import { NextRequest, NextResponse } from 'next/server';
import { classifyIntent } from './agents/router';
import { handleProductRequest } from './agents/productAgent';
import { handleFAQRequest } from './agents/faqAgent';
import { handleGeneralRequest } from './agents/generalAgent';
import { detectGenderPreference, isProductRequest, isGenderOnlyMessage, GenderPreference } from './utils/genderDetector';
import { extractProductsFromQuery } from './utils/productExtractor';

export async function POST(request: NextRequest) {
  try {
    const { messages, languageCode = 'en', genderPreference } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // Get the last user message
    const lastUserMessage = messages
      .filter((m: { role: string }) => m.role === 'user')
      .pop();
    const lastUserMessageText = lastUserMessage?.content || '';
    
    // Detect gender preference
    const currentGenderPreference = detectGenderPreference(
      lastUserMessageText,
      genderPreference as GenderPreference
    );

    // Check if there's a product request in conversation history
    const allUserMessages = messages
      .filter((m: { role: string }) => m.role === 'user')
      .map((m: { content: string }) => m.content?.toLowerCase() || '');
    
    const hasProductRequestInHistory = allUserMessages.length > 1 && 
      allUserMessages.slice(0, -1).some(msg => {
        const categoryKeywords = [
          'jacket', 'jackets', 'shell', 'coat', 'pant', 'pants',
          'shoe', 'shoes', 'boot', 'boots', 'footwear', 'clothing',
          'clothes', 'apparel', 'accessories', 'packs', 'backpack'
        ];
        return isProductRequest(msg) || categoryKeywords.some(kw => msg.includes(kw));
      });

    // DISABLED: Direct product extraction to allow enhanced agent context processing
    // The product agent now handles all product extraction with proper context awareness
    console.log(`🚫 Skipping direct extraction in route.ts - letting product agent handle context-aware processing`);

    // Classify intent using router
    const routerResult = await classifyIntent(lastUserMessageText, messages);
    console.log(`🎯 Intent classified: ${routerResult.intent} (confidence: ${routerResult.confidence})`);

    // Route to appropriate agent
    let responseStream: ReadableStream;

    switch (routerResult.intent) {
      case 'product':
        const productResponse = await handleProductRequest({
          messages,
          languageCode,
          genderPreference: genderPreference as GenderPreference,
          currentGenderPreference,
        });
        responseStream = productResponse.stream;
        break;

      case 'faq':
        responseStream = await handleFAQRequest({
          messages,
          languageCode,
        });
        break;

      case 'general':
      default:
        responseStream = await handleGeneralRequest({
          messages,
          languageCode,
        });
        break;
    }

    // Wrap stream to include gender preference update if needed
    const wrappedStream = new ReadableStream({
      async start(controller) {
        // Send gender preference update if changed
        if (currentGenderPreference !== genderPreference) {
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ genderPreference: currentGenderPreference })}\n\n`));
        }

        // Forward the agent's stream
        const reader = responseStream.getReader();

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            // Forward chunks as-is (they're already in SSE format)
            controller.enqueue(value);
          }
        } finally {
          reader.releaseLock();
          controller.close();
        }
      },
    });

    return new Response(wrappedStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    );
  }
}
