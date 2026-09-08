import { Link } from 'react-router-dom'

import Container from '../common/Container'
import PureVegBadge from '../common/PureVegBadge'

import { SOCIAL_LINKS, WHATSAPP_URL } from '../../config/siteConfig.js'
import { useBakery } from '../../context/BakeryContext.jsx'

const BAKERY_MAP_URL =
  'https://www.google.com/maps?q=19.3033825,84.8092379&z=17&output=embed'

const BAKERY_GOOGLE_MAPS_LINK =
  'https://maps.app.goo.gl/jcmfSenZXwjwBoVu8'

function Footer() {
  const { hours } = useBakery()
  function handleContactClick(event) {
    event.preventDefault()

    const contactSection = document.getElementById('contact')

    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }
  return (
    <footer
      id="contact"
      className="relative overflow-hidden border-t border-[var(--color-border)] bg-[var(--color-surface)]"
    >
      <div aria-hidden="true" className="ticket-edge relative -mt-[1px]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-primary)] to-transparent opacity-30" />
      <div aria-hidden="true" className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-[var(--color-accent)] opacity-[0.06] blur-3xl" />

      <Container>
        <div
          className={`grid gap-10 py-14 md:py-16 ${
            hours.length > 0
              ? 'md:grid-cols-[1.35fr_0.7fr_0.9fr_1.05fr_1.1fr]'
              : 'md:grid-cols-[1.4fr_0.8fr_1fr_1.1fr]'
          }`}
        >
          {/* Brand */}
          <div>
            <div className="flex flex-wrap items-center gap-4">
              <Link
                to="/"
                className="font-serif text-2xl italic font-semibold tracking-tight text-[var(--color-primary)] transition-transform duration-300 hover:scale-[1.02]"
              >
                Raisal's The Whispering Whisk
              </Link>

              <PureVegBadge compact />
            </div>

            <p className="mt-4 max-w-sm text-sm leading-6 text-[var(--color-text-muted)]">
              Homemade treats, baked with love and made to bring a little more
              sweetness to your day.
            </p>

            <p className="mt-4 max-w-sm text-sm font-semibold leading-6 text-[var(--color-veg-text)]">
              100% Pure Vegetarian Bakery
            </p>

          </div>

          {/* Explore */}
          <div>
            <h3 className="flex items-center gap-3 font-serif text-lg font-semibold text-[var(--color-text)]">
              Explore
              <span className="h-px flex-1 bg-gradient-to-r from-[var(--color-hairline)] to-transparent" aria-hidden="true" />
            </h3>

            <nav
              className="mt-4 flex flex-col gap-3 text-sm"
              aria-label="Footer navigation"
            >
              <Link
                to="/"
                className="text-[var(--color-text-muted)] transition-all duration-300 hover:translate-x-1 hover:text-[var(--color-primary)]"
              >
                Home
              </Link>

              <Link
                to="/menu"
                className="text-[var(--color-text-muted)] transition-all duration-300 hover:translate-x-1 hover:text-[var(--color-primary)]"
              >
                Menu
              </Link>

              <Link
                to="/about"
                className="text-[var(--color-text-muted)] transition-all duration-300 hover:translate-x-1 hover:text-[var(--color-primary)]"
              >
                About Us
              </Link>

              <Link
                to="/reviews"
                className="text-[var(--color-text-muted)] transition-all duration-300 hover:translate-x-1 hover:text-[var(--color-primary)]"
              >
                Reviews
              </Link>

              <a
                href="#contact"
                onClick={handleContactClick}
                className="text-[var(--color-text-muted)] transition-all duration-300 hover:translate-x-1 hover:text-[var(--color-primary)]"
              >
                Contact
              </a>
            </nav>
          </div>

          {/* Get in Touch */}
          <div>
            <h3 className="flex items-center gap-3 font-serif text-lg font-semibold text-[var(--color-text)]">
              Get in Touch
              <span className="h-px flex-1 bg-gradient-to-r from-[var(--color-hairline)] to-transparent" aria-hidden="true" />
            </h3>

            <div className="mt-4 flex flex-col gap-3 text-sm">
              {/* WhatsApp */}
              {WHATSAPP_URL && (
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--color-text-muted)] transition-all duration-300 hover:translate-x-1 hover:text-[var(--color-primary)]"
                >
                  WhatsApp
                </a>
              )}

              {/* Instagram */}
              {SOCIAL_LINKS.instagram && (
                <a
                  href={SOCIAL_LINKS.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--color-text-muted)] transition-all duration-300 hover:translate-x-1 hover:text-[var(--color-primary)]"
                >
                  Instagram
                </a>
              )}

              {/* Facebook */}
              {SOCIAL_LINKS.facebook && (
                <a
                  href={SOCIAL_LINKS.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--color-text-muted)] transition-all duration-300 hover:translate-x-1 hover:text-[var(--color-primary)]"
                >
                  Facebook
                </a>
              )}

              {/* Email */}
              {SOCIAL_LINKS.email && (
                <a
                  href={SOCIAL_LINKS.email}
                  className="text-[var(--color-text-muted)] transition-all duration-300 hover:translate-x-1 hover:text-[var(--color-primary)]"
                >
                  Email
                </a>
              )}

              {/* Swiggy */}
              {SOCIAL_LINKS.swiggy && (
                <a
                  href={SOCIAL_LINKS.swiggy}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--color-text-muted)] transition-all duration-300 hover:translate-x-1 hover:text-[var(--color-primary)]"
                >
                  Swiggy
                </a>
              )}
            </div>

          </div>

          {/* Bakery Hours */}
          {hours.length > 0 && (
            <div className="min-w-0">
              <h3 className="flex items-center gap-3 font-serif text-lg font-semibold text-[var(--color-text)]">
                Bakery Hours
                <span
                  className="h-px flex-1 bg-gradient-to-r from-[var(--color-hairline)] to-transparent"
                  aria-hidden="true"
                />
              </h3>

              <div className="mt-4 flex flex-col gap-2 text-sm">
                {hours.map((hour) => (
                  <div
                    key={hour.id}
                    className="flex min-w-0 items-center justify-between gap-3 text-[var(--color-text-muted)]"
                  >
                    <span>{hour.dayName}</span>
                    <span className="shrink-0 font-medium text-[var(--color-text)]">
                      {hour.openTime} – {hour.closeTime}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Fixed bakery location */}
          <div className="w-full max-w-sm self-start md:max-w-none">
            <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] shadow-[var(--shadow-soft)]">
              <div className="flex items-center justify-between gap-3 px-3 py-2">
                <p className="text-xs font-semibold tracking-[0.01em] text-[var(--color-text)]">
                  Find Raisal's The Whispering Whisk
                </p>

                <a
                  href={BAKERY_GOOGLE_MAPS_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 text-xs font-semibold text-[var(--color-primary)] hover:underline"
                >
                  Open Map
                </a>
              </div>

              <a
                href={BAKERY_GOOGLE_MAPS_LINK}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open Raisal's The Whispering Whisk location in Google Maps"
                className="block"
              >
                <iframe
                  title="Raisal's The Whispering Whisk location"
                  src={BAKERY_MAP_URL}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="pointer-events-none block h-36 w-full border-0"
                />
              </a>
            </div>
          </div>
        </div>

        {/* Footer bottom */}
        <div className="border-t border-[var(--color-border)] py-7">
          <div className="flex min-w-0 flex-col gap-3 text-center text-sm text-[var(--color-text-muted)] sm:text-left">
              <div className="max-w-3xl rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-3 text-left sm:px-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-primary)]">
                  Website &amp; Service Note
                </p>
                <p className="mt-1.5 text-xs leading-5 text-[var(--color-text-muted)]">
                  Our website currently operates on a cost-conscious infrastructure setup. You may occasionally experience brief loading delays, particularly after periods of inactivity, as some services may require a moment to become responsive. These delays are infrastructure-related and do not necessarily indicate an issue with the website. Thank you for your patience and understanding.
                </p>
              </div>
              <p className="tracking-[0.01em]">
                © {new Date().getFullYear()} Raisal's The Whispering Whisk. All
                rights reserved.
              </p>

              <p className="font-medium text-[var(--color-veg-text)]">
                Pure Veg • Freshly Baked • Made with Care
              </p>

              <p className="text-xs leading-5 text-[var(--color-text-muted)]">
                Designed &amp; Developed by{' '}
                <a
                  href="https://portfolio-subhankar-pandits-projects.vercel.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-[var(--color-primary)] transition-colors hover:underline"
                >
                  Subhankar Pandit
                </a>{' '}
                · AI-assisted with ChatGPT (Aether) &amp; Claude
              </p>
            </div>
        </div>
      </Container>
    </footer>
  )
}

export default Footer
