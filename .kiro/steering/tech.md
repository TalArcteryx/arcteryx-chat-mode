# Technology Stack & Build System

## Framework & Runtime

- **Next.js 15.5.2** - React framework with App Router and API routes
- **React 19.1.0** - UI library
- **TypeScript 5** - Type-safe development
- **Node.js 18+** - Runtime environment

## Build & Development

### Development Server
```bash
npm run dev
```
Runs on port 3001 with Turbopack for fast builds.

### Production Build
```bash
npm run build
npm start
```
Builds optimized production bundle and starts server on port 3001.

### Linting
```bash
npm run lint
```
Uses ESLint for code quality checks.

## Frontend Libraries

- **Tailwind CSS 4** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
  - `@radix-ui/react-dialog` - Modal dialogs
  - `@radix-ui/react-label` - Form labels
  - `@radix-ui/react-slot` - Slot composition
- **Lucide React** - Icon library
- **Sonner** - Toast notifications
- **React Markdown** - Markdown rendering
- **next-themes** - Dark/light theme support
- **class-variance-authority** - Component variant management
- **clsx** - Conditional className utility
- **tailwind-merge** - Merge Tailwind classes

## Backend & AI

- **OpenAI API** - GPT-4o-mini for AI responses
- **Next.js API Routes** - Serverless endpoints at `/api/chat`

## Data & Utilities

- **JSON** - Product catalogs and FAQ data stored as JSON files
- **cheerio** - HTML parsing (for data processing)
- **jsdom** - DOM simulation (for data processing)

## Code Quality

- **ESLint 9** - Linting with Next.js config
- **TypeScript strict mode** - Enabled for type safety
- **Path aliases** - `@/*` maps to `src/*`

## Environment Variables

Required in `.env.local`:
```
OPENAI_KEY=your_openai_api_key
```

## Build Configuration

- **Turbopack** - Fast bundler for dev and build
- **Image optimization** - Remote image patterns configured for Arc'teryx CDNs
- **Supported image formats** - AVIF, WebP for modern browsers
