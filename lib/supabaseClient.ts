import { createBrowserClient } from '@supabase/ssr';

if (process.env.NODE_ENV === 'development') {
  console.log('✅ ENV CHECK:',
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Key Loaded' : 'Key MISSING'
  );
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  throw new Error('@supabase/ssr: Your project URL and API key are required to create a Supabase client!');
}

export const supabase = createBrowserClient(url, key);
