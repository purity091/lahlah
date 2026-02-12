

# Lahlah OS - AI Personal & Product Assistant

Lahlah OS is a comprehensive productivity and project management application designed for strategic thinking and efficient task management.

## Features

- Project management with hierarchical structures
- Task management with Kanban board
- RICE scoring methodology for prioritization
- Team/freelancer management
- Document generation (PRD, feature documents)
- Product discovery tools
- Pomodoro timer integration
- Strategic analysis and AI-powered insights

## Technologies Used

- React 19 with TypeScript
- Supabase for backend services (authentication, database)
- Vite as build tool
- Tailwind CSS for styling
- Lucide React for icons

## Getting Started

### Prerequisites

- Node.js 16+ 
- Access to a Supabase project

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd lahlah-os
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory with the following:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# AI Service Configuration
GEMINI_API_KEY=your-gemini-api-key
VITE_OPENAI_API_KEY=your-openai-api-key
```

4. Run the development server:
```bash
npm run dev
```

## Supabase Integration

This application uses Supabase for:

- User authentication
- Database storage for projects, tasks, documents, etc.

### Setting up Supabase Tables

Before running the application, you need to create the following tables in your Supabase database:

1. `projects` - For storing project information
2. `tasks` - For storing tasks
3. `freelancers` - For storing team members
4. `documents` - For storing PRDs and other documents
5. `chat_history` - For storing chat conversations
6. `categories` - For storing task categories

See `SUPABASE_SETUP.md` for detailed instructions on setting up these tables.

## Deployment to Vercel

This application is ready for deployment to Vercel.

### Steps:

1. Push your code to a Git repository
2. Go to [Vercel](https://vercel.com) and connect your Git repository
3. During the project setup, add the following environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `GEMINI_API_KEY`
   - `VITE_OPENAI_API_KEY`
4. Deploy the project

The `vercel.json` file is already configured for this application.

## Development Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

## Architecture

For detailed architectural information, see `ARCHITECTURE.md`.

## Supabase Setup

For detailed instructions on setting up Supabase tables, see `SUPABASE_SETUP.md`.
