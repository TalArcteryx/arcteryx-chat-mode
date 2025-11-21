# Database Setup for Arc'teryx Chat

## Project Structure

The types are now organized in a clean, maintainable folder structure:

```
src/
├── types/
│   ├── index.ts          # Main exports
│   ├── base.ts           # Base interfaces
│   ├── user.ts           # User & Subscription
│   ├── chat.ts           # Chat, Prompt, Feedback
│   ├── api.ts            # API Calls & Rate Limits
│   ├── system.ts         # Logs, Configs, Notifications, Integrations
│   ├── real-estate.ts    # Properties, Brokerages, Leads, Appointments, Market Data
│   └── business.ts       # Analytics & Templates
├── lib/
│   └── db.ts             # Database utilities
```

## MongoDB Collections Created

We've created 18 comprehensive collections for your real estate platform:

### Core Collections
1. **Users** - User accounts, roles, and preferences
2. **Chats** - AI chat conversations and history
3. **ApiCalls** - API usage tracking and costs
4. **Logs** - System and application logging
5. **Configs** - Runtime configuration management

### Real Estate Specific Collections
6. **Properties** - Property listings and details
7. **Brokerages** - Real estate companies and teams
8. **Leads** - Lead generation and management
9. **Appointments** - Showings and meetings
10. **Market Data** - Real estate market analytics

### Business Collections
11. **Prompts** - AI prompt templates
12. **Feedback** - User ratings and comments
13. **Subscriptions** - Billing and plan management
14. **Analytics** - Aggregated business metrics
15. **Rate Limits** - Usage control and limits
16. **Notifications** - User communications
17. **Integrations** - Third-party service connections
18. **Templates** - Communication templates

## Environment Variables Needed

Create a `.env.local` file in your project root:

```bash
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017
DB_NAME=arcteryx-chat

# OpenAI Configuration
OPENAI_KEY=your_openai_api_key_here

# Optional: MongoDB Atlas (Cloud)
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/arcteryx-chat?retryWrites=true&w=majority
```

## Installation Steps

1. **Install MongoDB dependencies:**
   ```bash
   npm install mongodb
   ```

2. **Set up MongoDB:**
   - Local: Install MongoDB locally or use Docker
   - Cloud: Use MongoDB Atlas (recommended for production)

3. **Create indexes** (run these in MongoDB shell):
   ```javascript
   // Users
   db.users.createIndex({ "email": 1 }, { unique: true })
   db.users.createIndex({ "role": 1, "isActive": 1 })
   
   // Chats
   db.chats.createIndex({ "userId": 1, "createdAt": -1 })
   db.chats.createIndex({ "status": 1, "createdAt": -1 })
   
   // ApiCalls
   db.apiCalls.createIndex({ "userId": 1, "timestamp": -1 })
   db.apiCalls.createIndex({ "timestamp": -1 })
   
   // Properties
   db.properties.createIndex({ "mlsNumber": 1 }, { unique: true })
   db.properties.createIndex({ "agentId": 1, "status": 1 })
   db.properties.createIndex({ "address.city": 1, "status": 1 })
   
   // Leads
   db.leads.createIndex({ "assignedTo": 1, "status": 1 })
   db.leads.createIndex({ "createdAt": -1 })
   db.leads.createIndex({ "score": -1 })
   ```

## Usage Examples

### Import Types
```typescript
// Import specific types
import { User, Chat, Property } from '@/types';

// Or import all types
import * as Types from '@/types';
```

### Connect to Database
```typescript
import { getCollection } from '@/lib/db';
import { User } from '@/types';

// Get users collection
const usersCollection = await getCollection<User>('users');

// Find a user
const user = await usersCollection.findOne({ email: 'user@example.com' });
```

### Create a New User
```typescript
import { getCollection } from '@/lib/db';
import { User } from '@/types';

const usersCollection = await getCollection<User>('users');

const newUser: Omit<User, '_id' | 'createdAt' | 'updatedAt'> = {
  email: 'realtor@example.com',
  name: 'John Doe',
  role: 'realtor',
  subscription: {
    plan: 'basic',
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    status: 'active'
  },
  usage: {
    totalChats: 0,
    totalTokens: 0,
    monthlyTokens: 0,
    lastReset: new Date()
  },
  preferences: {
    language: 'en',
    timezone: 'America/Vancouver',
    notifications: true
  },
  lastActive: new Date(),
  isActive: true,
  realtorLicense: 'RE123456',
  specialties: ['residential', 'first_time_buyers']
};

const result = await usersCollection.insertOne(newUser);
```

## Benefits of New Structure

✅ **Organized by Domain** - Related interfaces are grouped together
✅ **Easy to Maintain** - Find and modify specific types quickly
✅ **Better Imports** - Import only what you need
✅ **Scalable** - Easy to add new types and collections
✅ **Type Safety** - Full TypeScript support with proper imports
✅ **Clean Architecture** - Follows separation of concerns

## Next Steps

1. **Set up authentication system** (NextAuth.js recommended)
2. **Create API routes** for each collection
3. **Implement real-time updates** with WebSockets
4. **Add data validation** with Zod or Joi
5. **Set up automated backups** for production
6. **Implement caching** with Redis for performance

## Notes

- All IDs are currently strings (can be changed to ObjectId later)
- Schemas include TypeScript interfaces for type safety
- Database connection includes graceful shutdown handling
- Collections are designed for scalability and real estate industry needs
- Types are now organized in a clean, maintainable folder structure
