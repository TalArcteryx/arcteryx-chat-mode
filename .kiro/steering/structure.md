# Project Structure & Organization

## Directory Layout

```
src/
├── app/                          # Next.js App Router
│   ├── api/chat/                 # Chat API endpoint
│   │   ├── route.ts              # Main POST handler, orchestrates agents
│   │   ├── agents/               # AI agent implementations
│   │   │   ├── router.ts         # Intent classifier (product/faq/general)
│   │   │   ├── productAgent.ts   # Product recommendations
│   │   │   ├── faqAgent.ts       # FAQ responses
│   │   │   └── generalAgent.ts   # General conversation
│   │   └── utils/                # Shared utilities
│   │       ├── dataLoader.ts     # Load/cache product & FAQ data
│   │       ├── productExtractor.ts # Extract products from queries
│   │       └── genderDetector.ts # Detect gender preference
│   ├── page.tsx                  # Home page
│   ├── account/                  # Account page
│   ├── admin/                    # Admin page
│   ├── chats/                    # Chat history page
│   ├── rewards/                  # Rewards page
│   ├── search/                   # Search page
│   ├── settings/                 # Settings page
│   ├── support/                  # Support page
│   ├── tracking/                 # Order tracking page
│   ├── wishlist/                 # Wishlist page
│   ├── layout.tsx                # Root layout
│   └── globals.css               # Global styles
├── components/                   # React components
│   ├── Chat.tsx                  # Main chat interface
│   ├── ProductCarousel.tsx       # Product display carousel
│   ├── ProductCard.tsx           # Individual product card
│   ├── ProductModal.tsx          # Product detail modal
│   ├── CartSidebar.tsx           # Shopping cart sidebar
│   ├── CompleteYourLookProducts.tsx # Recommendation component
│   ├── LanguageCountryModal.tsx  # Language/country selector
│   ├── PromptSuggestions.tsx     # Suggested prompts
│   ├── SidebarMenu.tsx           # Navigation menu
│   ├── SuggestionCard.tsx        # Suggestion card
│   └── ui/                       # Reusable UI components
│       ├── button.tsx
│       ├── chat-input.tsx
│       ├── dialog.tsx
│       ├── input.tsx
│       ├── label.tsx
│       └── sonner.tsx
├── contexts/                     # React Context providers
│   ├── CartContext.tsx           # Shopping cart state
│   ├── ChatContext.tsx           # Chat state
│   ├── LanguageContext.tsx       # Language/country state
│   ├── ThemeContext.tsx          # Dark/light theme state
│   └── WishlistContext.tsx       # Wishlist state
├── data/                         # Static data files
│   ├── mens-products.json        # Men's product catalog
│   ├── womens-products.json      # Women's product catalog
│   └── faq.json                  # FAQ database
├── lib/                          # Utility functions
│   ├── translations.ts           # i18n translations
│   ├── countryFlags.ts           # Country flag mappings
│   ├── productTransform.ts       # Product data transformations
│   └── utils.ts                  # General utilities
└── types/                        # TypeScript type definitions
    ├── index.ts                  # Main exports
    ├── base.ts                   # Base types
    ├── user.ts                   # User types
    ├── chat.ts                   # Chat types
    ├── api.ts                    # API types
    ├── system.ts                 # System types
    ├── product.ts                # Product types
    ├── productCard.ts            # Product card types
    └── business.ts               # Business logic types
```

## Key Architectural Patterns

### Multi-Agent System
- **Router Agent** (`agents/router.ts`) - Classifies user intent
- **Product Agent** (`agents/productAgent.ts`) - Handles product queries
- **FAQ Agent** (`agents/faqAgent.ts`) - Answers FAQs
- **General Agent** (`agents/generalAgent.ts`) - General conversation

### Data Flow
1. User message → `/api/chat` route
2. Gender detection via `genderDetector.ts`
3. Direct product extraction attempt via `productExtractor.ts`
4. Intent classification via `router.ts`
5. Route to appropriate agent
6. Stream response back to client

### State Management
- **React Context** for global state (cart, chat, language, theme, wishlist)
- **Client-side state** in components
- **Server-side caching** in agent utilities

### Type Organization
- `base.ts` - Fundamental types (Message, User, etc.)
- `product.ts` - Product-related types
- `chat.ts` - Chat-related types
- `api.ts` - API request/response types
- `business.ts` - Business logic types

## Naming Conventions

- **Components**: PascalCase (e.g., `ProductCard.tsx`)
- **Utilities/Functions**: camelCase (e.g., `extractProductsFromQuery`)
- **Types/Interfaces**: PascalCase (e.g., `Product`, `ChatMessage`)
- **Constants**: UPPER_SNAKE_CASE
- **Files**: Match export name (e.g., `ProductCard.tsx` exports `ProductCard`)

## Code Organization Rules

- Keep agent files focused (200-300 lines max)
- Shared logic in `utils/` directory
- Type definitions in `types/` directory
- Reusable components in `components/ui/`
- Page-specific components co-located with pages
- API routes in `app/api/` following Next.js conventions

## Import Paths

Use path alias `@/` for imports:
```typescript
import { Product } from '@/types/product';
import { Chat } from '@/components/Chat';
import { extractProducts } from '@/app/api/chat/utils/productExtractor';
```

## Configuration Files

- `tsconfig.json` - TypeScript configuration with strict mode
- `next.config.ts` - Next.js configuration (image optimization)
- `tailwind.config.ts` - Tailwind CSS configuration
- `eslint.config.mjs` - ESLint rules
- `postcss.config.mjs` - PostCSS configuration
- `.env.local` - Environment variables (OPENAI_KEY)
