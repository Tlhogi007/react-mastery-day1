/** Shared Clerk appearance that tracks the app light/dark theme. */

export type AppColorMode = 'light' | 'dark'

const brand = {
  primary: '#e23d2b',
  primaryHover: '#c93424',
  primaryForeground: '#ffffff',
  fontFamily: '"DM Sans", system-ui, sans-serif',
  borderRadius: '0.5rem',
} as const

const palettes = {
  light: {
    colorForeground: '#14151a',
    colorMutedForeground: '#6d7180',
    // Clerk mixes alpha from colorNeutral for hovers — use ink on light surfaces.
    colorNeutral: '#14151a',
    colorMuted: '#f4f5f7',
    colorBackground: '#ffffff',
    colorInput: '#f4f5f7',
    colorInputForeground: '#14151a',
    colorBorder: '#d0d4db',
    border: 'rgba(20, 21, 26, 0.08)',
    shadow: '0 8px 30px rgba(20, 21, 26, 0.12)',
    hoverBg: '#f4f5f7',
    dangerHoverBg: 'rgba(226, 61, 43, 0.08)',
  },
  dark: {
    colorForeground: '#f2f1ed',
    colorMutedForeground: '#9b9eaa',
    // White neutral → soft light wash on dark menus (not a solid gray flash).
    colorNeutral: '#ffffff',
    colorMuted: '#282a33',
    colorBackground: '#1c1d24',
    colorInput: '#282a33',
    colorInputForeground: '#f2f1ed',
    colorBorder: 'rgba(242, 241, 237, 0.1)',
    border: 'rgba(242, 241, 237, 0.1)',
    shadow: '0 10px 28px rgba(0, 0, 0, 0.45)',
    hoverBg: 'rgba(242, 241, 237, 0.08)',
    dangerHoverBg: 'rgba(226, 61, 43, 0.16)',
  },
} as const

export function resolveAppColorMode(): AppColorMode {
  if (typeof document === 'undefined') return 'dark'
  const root = document.documentElement
  if (root.classList.contains('light-theme')) return 'light'
  if (root.classList.contains('dark-theme')) return 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function getClerkAppearance(mode: AppColorMode = resolveAppColorMode()) {
  const p = palettes[mode]

  return {
    options: {
      logoImageUrl: typeof window !== 'undefined' ? `${window.location.origin}/favicon.svg` : '/favicon.svg',
      logoPlacement: 'inside' as const,
    },
    variables: {
      colorPrimary: brand.primary,
      colorPrimaryForeground: brand.primaryForeground,
      colorForeground: p.colorForeground,
      colorMutedForeground: p.colorMutedForeground,
      colorMuted: p.colorMuted,
      colorBackground: p.colorBackground,
      colorInput: p.colorInput,
      colorInputForeground: p.colorInputForeground,
      colorNeutral: p.colorNeutral,
      colorBorder: p.colorBorder,
      colorDanger: brand.primary,
      borderRadius: brand.borderRadius,
      fontFamily: brand.fontFamily,
    },
    elements: {
      logoImage: {
        width: 40,
        height: 40,
        borderRadius: 8,
      },
      headerTitle: {
        whiteSpace: 'pre-line' as const,
        textAlign: 'center' as const,
        lineHeight: 1.25,
        color: p.colorForeground,
      },
      headerSubtitle: {
        color: p.colorMutedForeground,
      },
      modalContent: {
        backgroundColor: p.colorBackground,
      },
      card: {
        backgroundColor: p.colorBackground,
        color: p.colorForeground,
        boxShadow: p.shadow,
        border: `1px solid ${p.border}`,
      },
      cardBox: {
        backgroundColor: p.colorBackground,
        boxShadow: p.shadow,
      },
      main: {
        color: p.colorForeground,
      },
      socialButtonsBlockButton: {
        backgroundColor: p.colorInput,
        color: p.colorForeground,
        border: `1px solid ${p.border}`,
        '&:hover': {
          backgroundColor: p.hoverBg,
        },
      },
      socialButtonsBlockButtonText: {
        color: p.colorForeground,
      },
      dividerLine: {
        backgroundColor: p.border,
      },
      dividerText: {
        color: p.colorMutedForeground,
      },
      formFieldLabel: {
        color: p.colorForeground,
      },
      formFieldInput: {
        backgroundColor: p.colorInput,
        color: p.colorInputForeground,
        borderColor: p.border,
      },
      formButtonPrimary: {
        fontWeight: 600,
        backgroundColor: brand.primary,
        color: brand.primaryForeground,
        '&:hover': { backgroundColor: brand.primaryHover },
      },
      footerActionText: {
        color: p.colorMutedForeground,
      },
      footerActionLink: {
        color: brand.primary,
      },
      identityPreview: {
        backgroundColor: p.colorInput,
        borderColor: p.border,
      },
      identityPreviewText: {
        color: p.colorForeground,
      },
      identityPreviewEditButton: {
        color: brand.primary,
      },
      userButtonAvatarBox: {
        width: 28,
        height: 28,
        borderRadius: 8,
      },
      userButtonPopoverCard: {
        backgroundColor: p.colorBackground,
        borderRadius: 12,
        border: `1px solid ${p.border}`,
        boxShadow: p.shadow,
        color: p.colorForeground,
      },
      userButtonPopoverMain: {
        backgroundColor: p.colorBackground,
        color: p.colorForeground,
      },
      userButtonPopoverActionButton: {
        borderRadius: 8,
        color: p.colorForeground,
        '&:hover, &:focus-visible': {
          backgroundColor: p.hoverBg,
        },
      },
      userButtonPopoverActionButtonIconBox: {
        color: p.colorMutedForeground,
      },
      userButtonPopoverActionButton__signOut: {
        color: brand.primary,
        '&:hover, &:focus-visible': {
          backgroundColor: p.dangerHoverBg,
          color: brand.primary,
        },
      },
      userButtonPopoverFooter: {
        display: 'none',
      },
      userPreviewMainIdentifier: {
        color: p.colorForeground,
      },
      userPreviewSecondaryIdentifier: {
        color: p.colorMutedForeground,
      },
      userProfileScrollBox: {
        backgroundColor: p.colorBackground,
      },
      navbar: {
        backgroundColor: p.colorBackground,
      },
      navbarButton: {
        color: p.colorForeground,
        borderRadius: 8,
        '&:hover, &:focus-visible': {
          backgroundColor: p.hoverBg,
        },
      },
      profileSectionTitleText: {
        color: p.colorForeground,
      },
      profileSectionPrimaryButton: {
        color: brand.primary,
        '&:hover, &:focus-visible': {
          backgroundColor: p.dangerHoverBg,
        },
      },
      menuButton__danger: {
        color: brand.primary,
        '&:hover, &:focus-visible': {
          backgroundColor: p.dangerHoverBg,
        },
      },
      // "Primary", "This device", "Last used", etc.
      badge: {
        backgroundColor: p.colorMuted,
        color: p.colorForeground,
        border: `1px solid ${p.border}`,
        borderRadius: 6,
        fontWeight: 600,
      },
      badge__primary: {
        backgroundColor: p.dangerHoverBg,
        color: brand.primary,
        border: `1px solid ${brand.primary}33`,
      },
      lastAuthenticationStrategyBadge: {
        backgroundColor: p.colorMuted,
        color: p.colorForeground,
        border: `1px solid ${p.border}`,
      },
      activeDeviceListItem: {
        color: p.colorForeground,
      },
      activeDeviceListItem__current: {
        color: p.colorForeground,
      },
      activeDevice: {
        color: p.colorForeground,
      },
      activeDevice__current: {
        color: p.colorForeground,
      },
    },
  }
}
