# Crew's Academy

A luxurious, role-based educational platform for Emirates cabin crew training with complete Layer 1 free courses.

## Quick Start

```bash
npm install
npm run dev
```

Visit `http://localhost:5173` and log in with:
- **Governor**: `governor@emirates.com` / `Governor123`
- **Mentor**: `coach@emirates.com` / `Coach123`
- **Student**: `student@emirates.com` / `Student123`

## Features

### Layer 1: Free Source (6 Complete Courses)
1. Welcome to Crew's Academy
2. Dress Code & Grooming
3. Open Day Strategy
4. Assessment Day Process
5. English Proficiency & Communication
6. Final Interview Tips

### Platform Features
- Role-based dashboards (Student, Mentor, Governor)
- Fully responsive mobile-first design
- Course management and progress tracking
- Encrypted messaging system
- Governor admin panel with user control
- Global alerts and maintenance mode
- Editable user profiles

### Design
- Emirates color palette: Red (#D71921), Gold (#FFD700), Jet Black (#000000)
- Lato font family
- Smooth animations and transitions
- Mobile-optimized (375px+)

See `EMIRATES_ACADEMY_README.md` for full documentation.

## AI Configuration

The AI Trainer feature requires an OpenAI API key to be configured in your Supabase project:

1. Go to your Supabase Dashboard
2. Navigate to Project Settings > Edge Functions
3. Add a secret named `OPENAI_API_KEY` with your OpenAI API key
4. The AI edge function will automatically use this key

Without this configuration, the AI Trainer will show an error message asking users to contact the administrator.

## Tech Stack

React 18 • TypeScript • React Router • Tailwind CSS • Framer Motion • Supabase • Firebase
