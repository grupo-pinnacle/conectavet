import { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { useColorScheme, AccessibilityInfo, PixelRatio } from 'react-native';
import type { ReactNode } from 'react';
import { lightColors, darkColors } from './index';
import type { ColorScheme } from './index';

export interface ThemeContextValue {
  colors: ColorScheme;
  isDark: boolean;
  toggle: () => void;
  fontScale: number;
  isReducedMotion: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  colors: lightColors, isDark: false, toggle: () => {},
  fontScale: 1, isReducedMotion: false,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [isDark, setIsDark] = useState(systemScheme === 'dark');
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const fontScale = PixelRatio.getFontScale();

  useEffect(() => {
    setIsDark(systemScheme === 'dark');
  }, [systemScheme]);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setIsReducedMotion);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setIsReducedMotion);
    return () => sub.remove();
  }, []);

  const value = useMemo(() => ({
    colors: isDark ? darkColors : lightColors,
    isDark,
    toggle: () => setIsDark((p) => !p),
    fontScale,
    isReducedMotion,
  }), [isDark, fontScale, isReducedMotion]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}