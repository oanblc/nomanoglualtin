import '../styles/globals.css'
import { Inter } from 'next/font/google'
import { SettingsProvider } from '../contexts/SettingsContext'
import { BodyScripts, BodyEndScripts } from '../components/SeoHead'
import CookieConsent, { CookieConsentProvider } from '../components/CookieConsent'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export default function App({ Component, pageProps }) {
  return (
    <SettingsProvider>
      <CookieConsentProvider>
        <div className={`${inter.variable} font-sans`}>
          <BodyScripts />
          <Component {...pageProps} />
          <BodyEndScripts />
          <CookieConsent />
        </div>
      </CookieConsentProvider>
    </SettingsProvider>
  )
}
