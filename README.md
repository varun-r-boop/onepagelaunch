# OnePageLaunch

A beautiful, no-login MVP for creating bento-style one-page websites for your side projects. Built with Next.js, Tailwind CSS, ShadCN UI, and Vercel KV for persistent storage.

## Features

- 🔐 **User Authentication** - GitHub OAuth via Supabase
- 📊 **User Dashboard** - Manage all your projects in one place  
- 🚀 **Anonymous publishing** - Create projects without signing in
- 🎨 **Bento-style design** - Modern grid layout for features
- 📱 **Fully responsive** - Mobile-friendly design
- 💾 **Dual storage** - Supabase for user projects + Redis for fast public access
- 📤 **Export functionality** - Download as static HTML
- 🔗 **Shareable links** - Works across devices and browsers
- ⚡ **Live preview** - See changes in real-time
- ✏️ **Edit projects** - Update your saved projects anytime

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS
- **Components**: ShadCN UI
- **Authentication**: Supabase Auth (GitHub OAuth)
- **Database**: Supabase (PostgreSQL) + Redis (for public pages)
- **Icons**: Lucide React
- **Language**: TypeScript

## Getting Started

### Prerequisites

- Node.js 18+ 
- A Supabase account (for authentication and user projects)
- A Vercel account (for Redis storage - optional for public pages)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd onepagelaunch
```

2. Install dependencies:
```bash
npm install
```

3. Set up Supabase:
   - Go to [Supabase](https://supabase.com) and create a new project
   - In Authentication > Providers, enable GitHub OAuth
   - In SQL Editor, run the schema from `supabase-schema.sql`
   - Copy your project URL and anon key

4. Set up Redis (Optional - for fast public page access):
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Create a new Redis database
   - Copy the Redis URL

5. Create `.env.local` file:
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Redis Configuration (Optional - for public page caching)
REDIS_URL=your_redis_url

# Base URL for generating shareable links
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

6. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Usage

### 🚀 **Anonymous Publishing (No Login)**

1. **Visit the homepage** - Click "Start Building" to begin
2. **Fill the form** with your project details
3. **Preview live** - See your page update in real-time  
4. **Publish anonymously** - Get a shareable link instantly

### 🔐 **With User Account (Recommended)**

1. **Sign in** with GitHub on the homepage
2. **Create projects** that are saved to your dashboard
3. **Manage projects** - View, edit, delete from `/dashboard`
4. **Edit anytime** - Update your projects and keep the same URL

### 📊 **Dashboard Features**

- **View all projects** - See your complete project portfolio
- **Quick actions** - View live, edit, or delete projects
- **Project stats** - See feature count and creation dates
- **Direct editing** - Click "Edit" to modify any project

### 🔗 **Sharing & Export**

- Each project gets a unique URL: `yourdomain.com/project-name-xyz`
- **Shareable links** work across all devices and browsers
- **Download as HTML** - Export static files for self-hosting
- **Social sharing** - Built-in copy link and native share options

## API Endpoints

### POST `/api/publish` (Anonymous)

Publishes a project anonymously to Redis only.

**Request Body:**
```json
{
  "projectName": "My Awesome Project",
  "tagline": "A brief description of the project",
  "features": [
    {
      "title": "Feature Name", 
      "description": "Feature description",
      "icon": "Star"
    }
  ],
  "ctaText": "Get Started",
  "ctaUrl": "https://example.com",
  "screenshot": "https://example.com/image.png"
}
```

### POST `/api/projects` (Authenticated)

Saves a project to user's account in Supabase + Redis.

**Request Body:**
```json
{
  "projectData": {
    // Same structure as above
  },
  "editId": "optional-project-id-for-editing"
}
```

**Response:**
```json
{
  "success": true,
  "slug": "my-awesome-project-xyz", 
  "projectId": "uuid",
  "url": "https://yourdomain.com/my-awesome-project-xyz",
  "isEdit": false
}
```

### GET `/api/projects?id=<project-id>` (Authenticated)

Fetches a specific project for editing.

## Project Structure

```
src/
├── app/
│   ├── api/publish/          # API endpoint for publishing projects
│   ├── builder/              # Form-based page builder
│   ├── [slug]/              # Dynamic project pages
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Landing page
│   └── not-found.tsx        # 404 page
├── components/
│   ├── ui/                  # ShadCN UI components
│   ├── project-preview.tsx  # Live preview component
│   └── project-page-client.tsx  # Client-side project page
├── lib/
│   ├── types.ts            # TypeScript interfaces
│   └── storage.ts          # API functions and utilities
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes |
| `REDIS_URL` | Redis connection URL | No* |
| `NEXT_PUBLIC_BASE_URL` | Base URL for shareable links | No |

*Redis is optional but recommended for fast public page loading

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set up environment variables in Vercel dashboard
4. Deploy!

The app is optimized for Vercel deployment with:
- Server-side rendering for project pages
- API routes for publishing
- Static asset optimization

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit your changes: `git commit -am 'Add new feature'`
4. Push to the branch: `git push origin feature/new-feature`
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

- Create an issue for bug reports or feature requests
- Check existing issues before creating new ones
- Provide detailed information for faster resolution

---

Built with ❤️ using Next.js and Vercel KV
