import '../styles/globals.css'
import { Lato } from 'next/font/google'
import { SettingsProvider } from '../contexts/SettingsContext'
import { BodyScripts, BodyEndScripts } from '../components/SeoHead'
import CookieConsent, { CookieConsentProvider } from '../components/CookieConsent'

const lato = Lato({
  subsets: ['latin'],
  display: 'swap',
  weight: ['100', '300', '400', '700', '900'],
  variable: '--font-lato',
})

export default function App({ Component, pageProps }) {
  return (
    <SettingsProvider>
      <CookieConsentProvider>
        <div className={`${lato.variable} font-sans`}>
          <BodyScripts />
          <Component {...pageProps} />
          <BodyEndScripts />
          <CookieConsent />
        </div>
      </CookieConsentProvider>
    </SettingsProvider>
  )
}
