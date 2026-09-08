import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

import Container from '../common/Container'
import Button from '../common/Button'
import PureVegBadge from '../common/PureVegBadge'

import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'

const desktopLinkClass =
  'relative whitespace-nowrap text-[0.95rem] font-semibold text-[var(--color-text)] transition-all duration-300 hover:-translate-y-0.5 hover:text-[var(--color-primary)] after:absolute after:-bottom-1.5 after:left-0 after:h-[2px] after:w-full after:origin-left after:scale-x-0 after:bg-[var(--color-primary)] after:transition-transform after:duration-300 hover:after:scale-x-100'

const desktopLinkActiveClass = 'text-[var(--color-primary)] after:scale-x-100'

const mobileLinkClass =
  'rounded-lg px-4 py-3 text-sm font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-primary)]'

const mobileLinkActiveClass = 'bg-[var(--color-surface)] text-[var(--color-primary)]'

function Navbar() {
  const { theme, toggleTheme } = useTheme()
  const { count: cartCount } = useCart()
  const { user, loading, isAuthenticated, isAuthorizedAdmin, logout } = useAuth()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [avatarImageError, setAvatarImageError] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    setAvatarImageError(false)
  }, [user?.avatarUrl])

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 12)
    }
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  function isActive(path) {
    return path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)
  }

  function closeMobileMenu() {
    setMobileMenuOpen(false)
  }

  function handleContactClick(event) {
    event.preventDefault()
    closeMobileMenu()

    const contactSection = document.getElementById('contact')

    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  async function handleLogout() {
    try {
      await logout()
      closeMobileMenu()
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <header className={`sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-background)]/92 backdrop-blur-xl transition-all duration-300 ${scrolled ? 'shadow-[0_8px_30px_rgba(61,41,35,0.09)]' : 'shadow-[0_4px_24px_rgba(61,41,35,0.035)]'}`}>
      <Container className="max-w-[96rem]">
        <nav className={`flex items-center gap-6 transition-all duration-300 xl:gap-9 ${scrolled ? 'min-h-[4.25rem]' : 'min-h-[5.25rem]'}`}>
          <Link
            to="/"
            onClick={closeMobileMenu}
            className="group flex shrink-0 items-center gap-3"
          >
            <span className="whitespace-nowrap font-serif text-[1.7rem] italic font-semibold tracking-tight text-[var(--color-primary)] transition-transform duration-300 group-hover:scale-[1.02]">
              Raisal&apos;s
            </span>
            <PureVegBadge compact className="hidden xl:inline-flex" />
          </Link>

          <div className="hidden min-w-0 flex-1 items-center justify-center gap-7 xl:flex xl:gap-9">
            <Link to="/" className={`${desktopLinkClass} ${isActive('/') ? desktopLinkActiveClass : ''}`}>Home</Link>
            <Link to="/menu" className={`${desktopLinkClass} ${isActive('/menu') ? desktopLinkActiveClass : ''}`}>Menu</Link>
            <Link to="/cart" className={`${desktopLinkClass} ${isActive('/cart') ? desktopLinkActiveClass : ''}`}>Cart{cartCount > 0 ? ` · ${cartCount}` : ''}</Link>
            <Link to="/about" className={`${desktopLinkClass} ${isActive('/about') ? desktopLinkActiveClass : ''}`}>About Us</Link>
            <Link to="/reviews" className={`${desktopLinkClass} ${isActive('/reviews') ? desktopLinkActiveClass : ''}`}>Review Our Team</Link>
            <a href="#contact" onClick={handleContactClick} className={desktopLinkClass}>Contact</a>
          </div>

          <div className="hidden shrink-0 items-center gap-3 xl:flex xl:gap-4">
            <button
              type="button"
              onClick={toggleTheme}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-primary)] transition-all duration-300 hover:rotate-12 hover:scale-110 hover:shadow-[var(--shadow-soft)]"
              aria-label="Toggle theme"
              title="Switch theme"
            >
              {theme === 'warm' ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-5 w-5">
                  <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-5 w-5">
                  <circle cx="12" cy="12" r="4.2" />
                  <path d="M12 2.5v2.4M12 19.1v2.4M4.5 12H2.1M21.9 12h-2.4M5.6 5.6l1.7 1.7M16.7 16.7l1.7 1.7M18.4 5.6l-1.7 1.7M7.3 16.7l-1.7 1.7" strokeLinecap="round" />
                </svg>
              )}
            </button>

            {!loading && !isAuthenticated && (
              <div className="flex shrink-0 items-center gap-2">
                <Link to="/login"><Button variant="ghost">Login</Button></Link>
                <Link to="/register"><Button>Register</Button></Link>
              </div>
            )}

            {!loading && isAuthenticated && (
              <div className="flex shrink-0 items-center gap-2 xl:gap-4">
                {isAuthorizedAdmin && (
                  <Link to="/admin"><Button variant="secondary">Admin</Button></Link>
                )}
                <Link
                  to="/account"
                  className="group/profile hidden max-w-[165px] items-center gap-2 rounded-full px-2 py-1.5 text-sm font-medium transition-all duration-300 hover:bg-[var(--color-surface)] hover:text-[var(--color-primary)] xl:flex"
                  title="View your profile"
                  aria-label={`View ${user.name}'s profile`}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-primary)] transition-transform duration-300 group-hover/profile:scale-105">
                    {user.avatarUrl && !avatarImageError ? (
                      <img
                        src={user.avatarUrl}
                        alt=""
                        className="h-full w-full object-contain"
                        onError={() => setAvatarImageError(true)}
                      />
                    ) : (
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        className="h-4 w-4"
                        aria-hidden="true"
                      >
                        <circle cx="12" cy="8" r="3.2" />
                        <path d="M5.5 19c.8-3.1 3.1-4.8 6.5-4.8s5.7 1.7 6.5 4.8" strokeLinecap="round" />
                      </svg>
                    )}
                  </span>
                  <span className="min-w-0 truncate">Hi, {user.name}</span>
                </Link>
                <Button variant="ghost" onClick={handleLogout}>Logout</Button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="ml-auto flex h-10 w-10 items-center justify-center rounded-lg text-[var(--color-text)] transition-transform duration-300 hover:scale-110 xl:hidden"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
              {mobileMenuOpen ? (
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </nav>

        <div className={`overflow-hidden transition-all duration-300 xl:hidden ${mobileMenuOpen ? 'max-h-[700px] pb-6 opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="border-t border-[var(--color-border)] pt-5">
            <div className="flex flex-col gap-1">
              <Link to="/" onClick={closeMobileMenu} className={`${mobileLinkClass} ${isActive('/') ? mobileLinkActiveClass : ''}`}>Home</Link>
              <Link to="/menu" onClick={closeMobileMenu} className={`${mobileLinkClass} ${isActive('/menu') ? mobileLinkActiveClass : ''}`}>Menu</Link>
              <Link to="/cart" onClick={closeMobileMenu} className={`${mobileLinkClass} ${isActive('/cart') ? mobileLinkActiveClass : ''}`}>Cart{cartCount > 0 ? ` · ${cartCount}` : ''}</Link>
              <Link to="/about" onClick={closeMobileMenu} className={`${mobileLinkClass} ${isActive('/about') ? mobileLinkActiveClass : ''}`}>About Us</Link>
              <Link to="/reviews" onClick={closeMobileMenu} className={`${mobileLinkClass} ${isActive('/reviews') ? mobileLinkActiveClass : ''}`}>Review Our Team</Link>
              <a href="#contact" onClick={handleContactClick} className={mobileLinkClass}>Contact</a>
            </div>

            <div className="mt-4"><PureVegBadge className="w-full justify-center" /></div>

            <div className="my-4 border-t border-[var(--color-border)]" />
            <button
              type="button"
              onClick={toggleTheme}
              className="flex w-full items-center justify-between rounded-lg px-4 py-3 text-sm font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface)]"
            >
              <span>Theme</span>
              <span className="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-primary)]">
                {theme === 'warm' ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-4 w-4">
                    <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-4 w-4">
                    <circle cx="12" cy="12" r="4.2" />
                    <path d="M12 2.5v2.4M12 19.1v2.4M4.5 12H2.1M21.9 12h-2.4M5.6 5.6l1.7 1.7M16.7 16.7l1.7 1.7M18.4 5.6l-1.7 1.7M7.3 16.7l-1.7 1.7" strokeLinecap="round" />
                  </svg>
                )}
              </span>
            </button>

            <div className="mt-4 border-t border-[var(--color-border)] pt-4">
              {!loading && !isAuthenticated && (
                <div className="flex flex-col gap-3">
                  <Link to="/login" onClick={closeMobileMenu}><Button variant="secondary" className="w-full">Login</Button></Link>
                  <Link to="/register" onClick={closeMobileMenu}><Button className="w-full">Register</Button></Link>
                </div>
              )}

              {!loading && isAuthenticated && (
                <div className="flex flex-col gap-3">
                  <Link
                    to="/account"
                    onClick={closeMobileMenu}
                    className="group/profile flex items-center gap-3 rounded-lg bg-[var(--color-surface)] px-4 py-3 transition-colors hover:text-[var(--color-primary)]"
                    title="View your profile"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--color-border)] text-[var(--color-primary)]">
                      {user.avatarUrl && !avatarImageError ? (
                        <img
                          src={user.avatarUrl}
                          alt=""
                          className="h-full w-full object-contain"
                          onError={() => setAvatarImageError(true)}
                        />
                      ) : (
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          className="h-4 w-4"
                          aria-hidden="true"
                        >
                          <circle cx="12" cy="8" r="3.2" />
                          <path d="M5.5 19c.8-3.1 3.1-4.8 6.5-4.8s5.7 1.7 6.5 4.8" strokeLinecap="round" />
                        </svg>
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xs uppercase tracking-wider opacity-50">Your Profile</span>
                      <span className="mt-1 block truncate text-sm font-semibold">{user.name}</span>
                      <span className="mt-1 block break-all text-xs opacity-60">{user.email}</span>
                    </span>
                  </Link>
                  {isAuthorizedAdmin && (
                    <Link to="/admin" onClick={closeMobileMenu}><Button variant="secondary" className="w-full">Admin</Button></Link>
                  )}
                  <Button variant="ghost" onClick={handleLogout} className="w-full">Logout</Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </Container>
    </header>
  )
}

export default Navbar
