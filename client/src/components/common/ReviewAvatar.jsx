function ReviewAvatar({ src, userType = null }) {
  const isAdmin = userType === 'admin'

  return (
    <span className="relative flex h-12 w-12 shrink-0 items-center justify-center">
      <span
        className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border-2 border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-primary)] shadow-[var(--shadow-soft)] transition-colors duration-300"
        aria-hidden="true"
      >
        {src ? (
          <img src={src} alt="" className="h-full w-full object-contain" loading="lazy" />
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5 opacity-70">
            <circle cx="12" cy="8" r="3.3" />
            <path d="M5 19.5c.9-3.2 3.3-5 7-5s6.1 1.8 7 5" strokeLinecap="round" />
          </svg>
        )}
      </span>
      {isAdmin && (
        <span
          className="absolute -bottom-1.5 -right-3 rounded-full border border-[var(--color-border)] bg-[var(--color-accent)] px-1.5 py-[1px] text-[8px] font-extrabold uppercase leading-none tracking-wide text-[var(--color-accent-foreground)] shadow-[var(--shadow-soft)]"
          aria-label="Administrator"
          title="Administrator"
        >
          Admin
        </span>
      )}
    </span>
  )
}

export default ReviewAvatar
