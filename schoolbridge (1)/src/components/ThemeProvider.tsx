import React, { useEffect } from 'react';
import { useThemeStore, ThemeType } from '../store/useThemeStore';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { theme } = useThemeStore();

  useEffect(() => {
    const root = window.document.documentElement;
    
    const applyTheme = (currentTheme: ThemeType) => {
      // Clean up previous classes
      root.classList.remove('dark', 'glass');
      
      let effectiveTheme = currentTheme;
      
      if (currentTheme === 'system') {
        effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }

      if (effectiveTheme === 'dark') {
        root.classList.add('dark');
      } else if (effectiveTheme === 'glass') {
        // Glass theme often looks better in dark or light mode based on preference, 
        // but here we define its own class. We'll decide its base color in CSS.
        root.classList.add('glass');
      }
    };

    applyTheme(theme);

    // If system theme is selected, listen for changes
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme('system');
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  // Prevent flash of unstyled theme by initializing layout if possible 
  // (though in SPA/React this is tricky without SSR or a small script in head)
  
  return <>{children}</>;
};
