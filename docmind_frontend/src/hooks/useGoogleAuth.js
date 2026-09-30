import { useEffect, useRef, useState } from 'react'

export function useGoogleAuth(onSuccess, onError) {
  const [ready, setReady] = useState(false)
  const clientRef = useRef(null)

  useEffect(() => {
    const checkGoogle = setInterval(() => {
      if (window.google?.accounts?.oauth2) {
        clientRef.current = window.google.accounts.oauth2.initTokenClient({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          scope: 'email profile',
          callback: (response) => {
            if (response.access_token) {
              onSuccess(response.access_token)
            } else {
              onError?.(new Error('No access token returned'))
            }
          },
          error_callback: (err) => onError?.(err),
        })
        setReady(true)
        clearInterval(checkGoogle)
      }
    }, 100)

    return () => clearInterval(checkGoogle)
  }, [onSuccess, onError])

  const promptGoogleLogin = () => {
    if (clientRef.current) {
      clientRef.current.requestAccessToken()
    }
  }

  return { ready, promptGoogleLogin }
}