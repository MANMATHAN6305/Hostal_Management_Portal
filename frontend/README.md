# Hotel Management Portal - Frontend

React (Next.js) frontend for the Hotel Management Portal.

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Hooks

## Project Structure

```
frontend/
├── app/                    # Next.js App Router pages
│   ├── bookings/          # Bookings management page
│   ├── guests/            # Guests management page
│   ├── rooms/             # Rooms management page
│   ├── layout.tsx         # Root layout with sidebar
│   └── page.tsx           # Dashboard page
├── components/
│   ├── layout/            # Layout components (Sidebar, Header)
│   ├── ui/                # Reusable UI components
│   ├── rooms/             # Room-specific components
│   ├── bookings/          # Booking-specific components
│   └── guests/            # Guest-specific components
├── hooks/                 # Custom React hooks
├── lib/                   # Utility functions
├── services/              # API service functions
├── types/                 # TypeScript type definitions
└── public/                # Static assets
```

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:8080/api` |

## Features

- **Dashboard**: Overview of hotel statistics
- **Room Management**: Add, edit, delete rooms
- **Booking Management**: Create and manage bookings
- **Guest Management**: Manage guest information
