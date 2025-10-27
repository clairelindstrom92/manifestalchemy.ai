# Manifest Alchemy AI ✨

A beautiful AI-powered chat application with a mystical golden aesthetic. Experience magical conversations with OpenAI's GPT models in an elegant, animated interface.

## Features

- **Beautiful Welcome Page**: Animated golden logo with magical effects
- **Simple Chat Interface**: Clean, ChatGPT-style conversation experience
- **Magical Aesthetics**: Golden gradients, animated stars, and mystical UI elements
- **Responsive Design**: Works perfectly on desktop and mobile
- **Vercel Ready**: Optimized for deployment on Vercel with Supabase

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **AI**: HuggingFace Inference API
- **Deployment**: Vercel + Supabase

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- HuggingFace API key

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd manifestalchemy.ai
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory:
```bash
HUGGINGFACE_API_KEY=your_huggingface_api_key_here
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## How It Works

1. **Welcome Screen**: Users see a beautiful animated landing page with the Manifest Alchemy logo
2. **Chat Interface**: Click "I'M READY TO MANIFEST MY DREAMS" to start chatting
3. **AI Conversations**: Simple ChatGPT-style interface powered by OpenAI GPT-4
4. **Magical Experience**: Enjoy the mystical golden aesthetic throughout the app

## Project Structure

```
manifestalchemy.ai/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts          # Simple chat API endpoint
│   ├── layout.tsx                 # Root layout with metadata
│   ├── page.tsx                   # Welcome page with navigation
│   └── globals.css                # Global styles
├── components/
│   ├── ChatInterface.tsx          # Simple chat component
│   ├── AnimatedStarBackground.tsx # Animated background
│   └── shared/                    # Reusable UI components
│       ├── MagicalBackground.tsx
│       ├── MagicalButton.tsx
│       └── MagicalInput.tsx
├── lib/
│   └── openai.ts                  # HuggingFace client setup
├── types/
│   └── index.ts                   # TypeScript type definitions
└── package.json
```

## Key Components

### Welcome Page
- Beautiful golden animated logo
- Magical particle effects
- Smooth transitions and animations
- Call-to-action button to start chatting

### ChatInterface
- Simple ChatGPT-style interface
- Real-time messaging
- Loading states and error handling
- Back navigation to welcome page

### HuggingFace Integration
- Uses HuggingFace Inference API for chat responses
- Handles API errors gracefully
- Simple message-based conversation flow

## Deployment to Vercel

1. **Connect to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Vercel will automatically detect Next.js

2. **Set Environment Variables:**
   - In Vercel dashboard, go to your project settings
   - Add environment variable: `HUGGINGFACE_API_KEY`
   - Set the value to your HuggingFace API key
   - **Important**: After adding the variable, redeploy your application for the changes to take effect
   
   See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

3. **Deploy:**
   - Vercel will automatically deploy on every push to main
   - Your app will be available at `https://your-project.vercel.app`

## Supabase Integration

This app is ready for Supabase integration. To add database functionality:

1. Create a Supabase project
2. Add Supabase environment variables to Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Install Supabase client: `npm install @supabase/supabase-js`

## Customization

### Styling
The app uses a golden mystical theme. Modify colors in:
- `app/globals.css` - Global styles
- Component files - Tailwind classes
- `app/page.tsx` - Welcome page gradients

### AI Behavior
Customize the AI responses by modifying the system prompt in `app/api/chat/route.ts`.

### Adding Features
- Add new API routes in `app/api/`
- Create new components in `components/`
- Update types in `types/index.ts`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use this project for your own AI chat applications!

## Support

If you encounter any issues or have questions, please open an issue on GitHub.

---

Built with ❤️ for creating magical AI experiences.