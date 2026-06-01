import { useEffect, useState } from 'react'

export function useLoadGoogleMaps(apiKey: string) {
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (window.google && window.google.maps) {
      setLoaded(true)
      return
    }

    if (document.getElementById('google-maps-script')) return

    const script = document.createElement('script')
    script.id = 'google-maps-script'
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`
    script.async = true
    script.defer = true
    script.onload = () => setLoaded(true)

    document.body.appendChild(script)
  }, [apiKey])

  return loaded
}
