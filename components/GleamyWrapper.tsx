'use client';

import { GleamyProvider } from 'gleamy';
import { ReactNode } from 'react';

interface GleamyWrapperProps {
  children: ReactNode;
}

export default function GleamyWrapper({ children }: GleamyWrapperProps) {
  return <GleamyProvider>{children}</GleamyProvider>;
}

