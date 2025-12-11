# Arc'teryx AI Chat Assistant

## Product Overview

Arc'teryx AI Chat Assistant is an intelligent e-commerce shopping assistant for Arc'teryx customers. It uses a multi-agent AI architecture to help customers discover products through natural conversation.

## Core Purpose

Enable customers to find Arc'teryx products through conversational AI, with specialized agents handling different types of queries (product recommendations, FAQs, general conversation) for improved accuracy and performance.

## Key Features

- **Intelligent Product Discovery**: Natural language search with gender-aware filtering
- **Multi-Agent Architecture**: Specialized agents for products, FAQs, and general conversation
- **Shopping Cart**: Add/remove products, persistent cart state
- **Internationalization**: Multi-language and country support
- **Real-time Streaming**: Live response streaming for better UX
- **Product Recommendations**: Best sellers, new arrivals, gift guides, category browsing

## Product Categories

- Jackets & Shells
- Pants
- Footwear (shoes, boots)
- Accessories
- Backpacks & Packs

## Data Sources

- Men's product catalog (`src/data/mens-products.json`)
- Women's product catalog (`src/data/womens-products.json`)
- FAQ database (`src/data/faq.json`)

## User Interactions

1. User sends natural language query
2. System detects gender preference (men/women/both)
3. Attempts direct product extraction (skips AI if possible)
4. Routes to appropriate agent if needed
5. Streams response back to user
