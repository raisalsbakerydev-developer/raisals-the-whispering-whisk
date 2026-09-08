import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext(null)

function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('warm')

  useEffect(() => {
    if (theme === 'cocoa') {
      document.documentElement.setAttribute('data-theme', 'cocoa')
    } else {
      document.documentElement.removeAttribute('data-theme')
    }
  }, [theme])

  const toggleTheme = () => {
    const flip = () =>
      setTheme((currentTheme) =>
        currentTheme === 'warm' ? 'cocoa' : 'warm',
      )

    // Progressive enhancement only: where the View Transitions API is
    // available, the theme swap gets a soft, premium crossfade instead
    // of an instant snap. Behavior (which theme ends up active) is
    // identical either way.
    if (typeof document !== 'undefined' && typeof document.startViewTransition === 'function') {
      document.startViewTransition(flip)
    } else {
      flip()
    }
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

function useTheme() {
  const context = useContext(ThemeContext)

  if (!context) {
    throw new Error('useTheme must be used inside ThemeProvider')
  }

  return context
}

export { ThemeProvider, useTheme }