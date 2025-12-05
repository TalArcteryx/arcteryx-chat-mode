# Arc'teryx AI Chat Assistant

A sophisticated AI-powered e-commerce chat assistant for Arc'teryx built with Next.js, React, and OpenAI. Features a multi-agent architecture that intelligently routes user queries to specialized agents for optimal accuracy and performance.

## 🎯 Project Overview

This is an intelligent shopping assistant that helps customers discover Arc'teryx products through natural conversation. The system uses a multi-agent architecture where specialized AI agents handle different types of queries (product recommendations, FAQs, general conversation) for improved accuracy and efficiency.

## ✨ Key Features

### 🛍️ **Intelligent Product Discovery**
- Natural language product search and recommendations
- Gender-aware product filtering (men's, women's, or both)
- Product carousels with images, prices, ratings, and details
- Category-based browsing (jackets, pants, footwear, accessories, etc.)
- Best sellers, new arrivals, and gift guide support
- "Complete Your Look" product suggestions

### 💬 **Multi-Agent Architecture**
- **Router Agent**: Intelligently classifies user intent
- **Product Agent**: Specialized in product recommendations
- **FAQ Agent**: Handles policy, shipping, and support questions
- **General Agent**: Manages brand conversations and general inquiries

### 🌍 **Internationalization**
- Multi-language support (English, French, Spanish, German, Italian, Japanese, Chinese, Korean)
- Country-specific settings
- Localized product information

### 🛒 **Shopping Features**
- Shopping cart functionality
- Product modal with detailed information
- Product comparison capabilities
- Direct links to Arc'teryx product pages

### 📱 **Modern UI/UX**
- Responsive design
- Real-time streaming responses
- Dark/light theme support
- Smooth animations and transitions
- Accessible components

## 🏗️ Multi-Agent Architecture

### Why Multi-Agent?

Instead of using a single AI model to handle all queries, we've split the system into specialized agents. This approach provides:

- **Better Accuracy**: Each agent has optimized prompts for its specific domain
- **Cost Efficiency**: Use cheaper models where appropriate, skip AI calls when possible
- **Maintainability**: Smaller, focused files (200-300 lines vs 1300+ line monolith)
- **Performance**: Direct product extraction for simple queries, faster responses
- **Scalability**: Each agent can be optimized independently

### Architecture Flow

```
┌─────────────────────────────────────────────────────────┐
│                    User Query                           │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │   Gender Detection     │
         │   (from message)       │
         └───────────┬────────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │  Direct Product        │
         │  Extraction?          │
         │  (skip AI if found)    │
         └───────────┬────────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │   Router Agent         │
         │   (Intent Classifier)  │
         └───────────┬────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
        ▼            ▼            ▼
  ┌─────────┐ ┌─────────┐ ┌──────────┐
  │ Product │ │   FAQ   │ │ General  │
  │  Agent  │ │  Agent  │ │  Agent   │
  └─────────┘ └─────────┘ └──────────┘
        │            │            │
        └────────────┼────────────┘
                     │
                     ▼
              Response Stream
```

### Agent Details

#### 1. **Router Agent** (`agents/router.ts`)
- **Purpose**: Classifies user intent into `product`, `faq`, or `general`
- **Method**: Hybrid approach (keyword-based first, then AI classification)
- **Model**: `gpt-4o-mini` (lightweight, fast)
- **Optimization**: Uses keyword matching for common patterns before calling AI

#### 2. **Product Agent** (`agents/productAgent.ts`)
- **Purpose**: Handles all product-related queries
- **Features**:
  - Product catalog management
  - Gender preference handling
  - Product extraction from queries and AI responses
  - Specialized prompts for product recommendations
- **Model**: `gpt-4o-mini`
- **Optimizations**:
  - Direct product extraction for simple queries (skips AI call)
  - Real-time product detection during streaming
  - Category-based matching

#### 3. **FAQ Agent** (`agents/faqAgent.ts`)
- **Purpose**: Answers frequently asked questions
- **Features**:
  - Semantic FAQ search
  - FAQ context injection into prompts
  - Policy and support question handling
- **Model**: `gpt-4o-mini`
- **Optimizations**: Keyword-based FAQ matching before AI call

#### 4. **General Agent** (`agents/generalAgent.ts`)
- **Purpose**: Handles general conversation and brand questions
- **Features**:
  - Brand information
  - General inquiries
  - Conversational responses
- **Model**: `gpt-4o-mini`
- **Temperature**: 0.8 (more conversational)

### Shared Utilities

#### `utils/dataLoader.ts`
- Loads and caches product data (men's, women's)
- Loads FAQ data
- Provides helper functions for data access

#### `utils/productExtractor.ts`
- Extracts products from user queries
- Extracts products from AI responses
- Handles special queries (best sellers, new arrivals, gift guide, top 10, etc.)
- Category-based matching

#### `utils/genderDetector.ts`
- Detects gender preference from messages
- Identifies product requests
- Identifies gender-only messages

## 📁 Project Structure

```
arcteryx-chat/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── chat/
│   │   │       ├── route.ts              # Main API endpoint
│   │   │       ├── agents/                # AI Agents
│   │   │       │   ├── router.ts         # Intent classifier
│   │   │       │   ├── productAgent.ts   # Product recommendations
│   │   │       │   ├── faqAgent.ts       # FAQ handler
│   │   │       │   └── generalAgent.ts   # General conversation
│   │   │       └── utils/                # Shared utilities
│   │   │           ├── dataLoader.ts     # Data loading & caching
│   │   │           ├── productExtractor.ts  # Product extraction
│   │   │           └── genderDetector.ts # Gender detection
│   │   ├── page.tsx                      # Home page
│   │   └── [other pages]                 # Account, settings, etc.
│   ├── components/
│   │   ├── Chat.tsx                      # Main chat component
│   │   ├── ProductCarousel.tsx          # Product display
│   │   ├── CartSidebar.tsx              # Shopping cart
│   │   └── [other components]
│   ├── contexts/
│   │   ├── CartContext.tsx              # Cart state management
│   │   └── LanguageContext.tsx          # Language/country state
│   ├── data/
│   │   ├── mens-products.json           # Men's product catalog
│   │   ├── womens-products.json         # Women's product catalog
│   │   └── faq.json                     # FAQ database
│   ├── lib/
│   │   ├── translations.ts              # Translation utilities
│   │   └── countryFlags.ts             # Country flag utilities
│   └── types/                           # TypeScript type definitions
├── public/                              # Static assets
├── MULTI_AGENT_ARCHITECTURE.md          # Detailed architecture docs
└── README.md                            # This file
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd arcteryx-chat
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file:
   ```env
   OPENAI_KEY=your_openai_api_key_here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Building for Production

```bash
npm run build
npm start
```

## 🔄 How It Works

### Request Flow

1. **User sends a message** → Frontend sends to `/api/chat`
2. **Gender detection** → System detects gender preference from message
3. **Direct extraction** → For product queries, tries to extract products directly
4. **Intent classification** → Router agent classifies intent
5. **Route to agent** → Appropriate agent handles the request
6. **Stream response** → Agent streams response back to client

### Example Queries

#### Product Query
```
User: "Show me men's jackets for skiing"
→ Gender detected: 'men'
→ Direct extraction: Finds skiing jackets
→ If found: Returns products immediately
→ If not: Routes to Product Agent for recommendations
```

#### FAQ Query
```
User: "What's your return policy?"
→ Router classifies: 'faq'
→ Routes to FAQ Agent
→ FAQ Agent finds relevant FAQs
→ Returns answer with FAQ context
```

#### General Query
```
User: "Tell me about Arc'teryx"
→ Router classifies: 'general'
→ Routes to General Agent
→ Returns brand information
```

## 🛠️ Technologies Used

### Frontend
- **Next.js 15** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Radix UI** - Accessible component primitives
- **Lucide React** - Icons

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **OpenAI API** - GPT-4o-mini for AI responses
- **Node.js** - Runtime environment

### Data
- **JSON** - Product catalogs and FAQ data
- **File System** - Data loading and caching

## 📊 Performance Optimizations

1. **Direct Product Extraction**: Simple product queries skip AI calls entirely
2. **Keyword-Based Classification**: Router uses keywords before AI classification
3. **Streaming Responses**: Real-time streaming for better UX
4. **Data Caching**: Product and FAQ data cached in memory
5. **Selective Agent Invocation**: Only necessary agents are called

## 🎨 Features in Detail

### Product Discovery
- Natural language search ("show me waterproof jackets")
- Category browsing (jackets, pants, footwear, accessories)
- Best sellers and new arrivals
- Gift guide recommendations
- Top 10 products by category
- Gender-aware filtering

### Shopping Cart
- Add products to cart
- View cart items
- Remove items
- Total calculation
- Persistent cart state

### Internationalization
- Multi-language support
- Country selection
- Localized content
- Language-specific responses

## 🔮 Future Enhancements

### Planned Features
- [ ] Semantic search using embeddings for better product/FAQ matching
- [ ] Response caching for common queries
- [ ] Analytics dashboard for agent usage
- [ ] A/B testing framework for prompts
- [ ] GPT-4o for Product Agent (better recommendations)
- [ ] Enhanced multi-language support
- [ ] Voice input/output
- [ ] Product comparison tool
- [ ] Wishlist functionality
- [ ] Order tracking integration

### Architecture Improvements
- [ ] Vector database for semantic search
- [ ] Redis caching layer
- [ ] Rate limiting per agent
- [ ] Agent performance monitoring
- [ ] Cost tracking per agent
- [ ] Fallback mechanisms

## 📝 Development

### Running Tests
```bash
npm run lint
npm run build
```

### Code Style
- TypeScript strict mode enabled
- ESLint for code quality
- Prettier for formatting (if configured)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is private and proprietary.

## 🙏 Acknowledgments

- Arc'teryx for product information
- OpenAI for GPT models
- Next.js team for the amazing framework
- All open-source contributors

## 📞 Support

For questions or issues, please open an issue in the repository.

---

**Built with ❤️ using Next.js, React, and OpenAI**
