import { createBrowserClient } from '@supabase/ssr';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const createPlaceholderClient = () => {
  const reject = (message: string) => Promise.reject(new Error(message));
  const errorMessage = 'Supabase environment variables are not configured.';
  return {
    auth: {
      getUser: () => reject(errorMessage),
      signOut: () => reject(errorMessage),
    },
    from: () => ({
      select: () => reject(errorMessage),
      insert: () => reject(errorMessage),
      update: () => reject(errorMessage),
      delete: () => reject(errorMessage),
      eq: () => ({
        select: () => reject(errorMessage),
        update: () => reject(errorMessage),
        delete: () => reject(errorMessage),
      }),
    }),
    storage: {
      from: () => ({
        upload: () => reject(errorMessage),
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
      }),
    },
  } as unknown as ReturnType<typeof createBrowserClient>;
};

export const supabase =
  url && key ? createBrowserClient(url, key) : createPlaceholderClient();
