import '../styles/globals.css'
import { useEffect, useState } from 'react'

export default function App({ Component, pageProps }) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Previene l'hydration mismatch per componenti che usano localStorage
  if (!isClient) {
    return null
  }

  return <Component {...pageProps} />
}