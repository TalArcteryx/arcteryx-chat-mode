# Multi-Agent Architecture

## Overview

The chat API has been refactored from a single monolithic handler into a multi-agent architecture. This improves accuracy, maintainability, and scalability.

## Architecture

```
┌─────────────────┐
│  Router Agent   │  ← Classifies intent (product, FAQ, general)
└────────┬────────┘
         │
    ┌────┴────┬──────────┬─────────────┐
    │         │          │             │
┌───▼───┐ ┌──▼───┐ ┌───▼────┐ ┌──────▼────┐
│Product│ │ FAQ  │ │General │ │ Utilities │
│ Agent │ │ Agent│ │ Agent  │ │  (shared) │
└───────┘ └──────┘ └────────┘ └───────────┘
```

## File Structure

```
src/app/api/chat/
├── route.ts                    # Main entry point (router)
├── agents/
│   ├── router.ts              # Intent classification
│   ├── productAgent.ts        # Product recommendations
│   ├── faqAgent.ts           # FAQ handling
│   └── generalAgent.ts       # General conversation
└── utils/
    ├── dataLoader.ts         # Product & FAQ data loading
    ├── productExtractor.ts   # Product extraction logic
    └── genderDetector.ts     # Gender preference detection
```

## Agents

### 1. Router Agent (`agents/router.ts`)
- **Purpose**: Classifies user intent
- **Output**: `'product' | 'faq' | 'general'`
- **Method**: Hybrid (keyword-based + AI classification)
- **Model**: `gpt-4o-mini` (lightweight, fast)

### 2. Product Agent (`agents/productAgent.ts`)
- **Purpose**: Handles product recommendations and browsing
- **Features**:
  - Product catalog management
  - Gender preference handling
  - Product extraction from queries and AI responses
  - Specialized prompts for product recommendations
- **Model**: `gpt-4o-mini`
- **Optimizations**: Direct product extraction when possible (skips AI call)

### 3. FAQ Agent (`agents/faqAgent.ts`)
- **Purpose**: Answers frequently asked questions
- **Features**:
  - Semantic FAQ search
  - FAQ context injection
  - Policy and support questions
- **Model**: `gpt-4o-mini`
- **Optimizations**: Keyword-based FAQ matching before AI call

### 4. General Agent (`agents/generalAgent.ts`)
- **Purpose**: Handles general conversation and brand questions
- **Features**:
  - Brand information
  - General inquiries
  - Conversational responses
- **Model**: `gpt-4o-mini`
- **Temperature**: 0.8 (more conversational)

## Utilities

### `utils/dataLoader.ts`
- Loads product data (men's, women's)
- Loads FAQ data
- Caches data in memory
- Provides helper functions for data access

### `utils/productExtractor.ts`
- Extracts products from user queries
- Extracts products from AI responses
- Handles special queries (best sellers, new arrivals, gift guide, etc.)
- Category-based matching

### `utils/genderDetector.ts`
- Detects gender preference from messages
- Identifies product requests
- Identifies gender-only messages

## Benefits

### 1. **Better Accuracy**
- Each agent has specialized prompts optimized for its task
- Product agent focuses only on product recommendations
- FAQ agent has direct access to FAQ database
- General agent handles non-specific queries

### 2. **Cost Efficiency**
- Router uses lightweight classification (keyword-based first)
- Agents only run when needed
- Direct product extraction skips AI calls when possible

### 3. **Maintainability**
- Clear separation of concerns
- Each agent is ~200-300 lines (vs 1300+ line monolith)
- Easy to modify individual agents without affecting others

### 4. **Scalability**
- Each agent can be optimized independently
- Can use different models for different agents
- Can add new agents without modifying existing ones

### 5. **Performance**
- Direct product extraction (no AI call) for simple queries
- Keyword-based FAQ matching before AI
- Only necessary agents are invoked

## Flow

1. **Request arrives** → `route.ts`
2. **Gender detection** → Detect gender preference from message
3. **Direct extraction** → Try to extract products directly (if product request)
4. **Intent classification** → Router agent classifies intent
5. **Route to agent** → Appropriate agent handles the request
6. **Stream response** → Agent streams response back to client

## Example Flows

### Product Request
```
User: "Show me men's jackets"
→ Gender detected: 'men'
→ Direct extraction: Finds jackets
→ If found: Return products immediately
→ If not: Route to Product Agent
```

### FAQ Request
```
User: "What's your return policy?"
→ Router classifies: 'faq'
→ Route to FAQ Agent
→ FAQ Agent finds relevant FAQs
→ Returns answer with FAQ context
```

### General Request
```
User: "Tell me about Arcteryx"
→ Router classifies: 'general'
→ Route to General Agent
→ Returns brand information
```

## Future Enhancements

1. **Semantic Search**: Use embeddings for better FAQ/product matching
2. **Caching**: Cache common queries/responses
3. **Analytics**: Track which agents are used most
4. **A/B Testing**: Test different prompts/models per agent
5. **Specialized Models**: Use GPT-4o for Product Agent, keep mini for others
6. **Multi-language**: Better language handling per agent

## Migration Notes

- All existing functionality is preserved
- Same API interface (no frontend changes needed)
- Backward compatible
- Performance improvements expected

