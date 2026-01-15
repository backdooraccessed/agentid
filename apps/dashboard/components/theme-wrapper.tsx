'use client';

import { useEffect } from 'react';

export function DarkThemeWrapper({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    html.classList.add('dark');
    body.style.setProperty('background-color', '#000000', 'important');
    body.style.setProperty('color', '#fafafa', 'important');

    return () => {
      html.classList.remove('dark');
      body.style.removeProperty('background-color');
      body.style.removeProperty('color');
    };
  }, []);

  return <>{children}</>;
}

export function LightThemeWrapper({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    html.classList.remove('dark');
    html.classList.add('light');
    html.style.setProperty('background-color', '#ffffff', 'important');
    body.classList.add('light-theme');
    body.style.setProperty('background-color', '#ffffff', 'important');
    body.style.setProperty('color', '#000000', 'important');

    return () => {
      html.classList.remove('light');
      html.style.removeProperty('background-color');
      body.classList.remove('light-theme');
      body.style.removeProperty('background-color');
      body.style.removeProperty('color');
    };
  }, []);

  return <>{children}</>;
}
