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

---

Built with ❤️ using Next.js and Vercel KV
