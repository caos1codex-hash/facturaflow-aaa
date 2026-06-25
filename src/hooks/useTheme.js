import { useThemeContext } from '../context/ThemeContext'

// ============================================================
// Hook para acceder al tema de la aplicación
// ============================================================

/**
 * Retorna el estado y funciones del tema.
 *
 * @returns {{
 *   theme: 'light' | 'dark',
 *   isDark: boolean,
 *   isLight: boolean,
 *   toggleTheme: () => void,
 *   setTheme: (theme: 'light' | 'dark') => void,
 * }}
 */
export function useTheme() {
  const { theme, isDark, toggleTheme, setTheme } = useThemeContext()

  return {
    theme,
    isDark,
    isLight: !isDark,
    toggleTheme,
    setTheme,
  }
}

export default useTheme