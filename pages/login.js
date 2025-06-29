import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { User, Lock, LogIn, AlertCircle } from 'lucide-react'

export default function Login() {
  const [credentials, setCredentials] = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    // Se l'utente è già loggato, reindirizza alla dashboard
    const token = localStorage.getItem('auth-token')
    if (token) {
      router.push('/')
    }
  }, [router])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      })

      const data = await response.json()

      if (data.success) {
        // Salva token e dati utente
        localStorage.setItem('auth-token', data.token)
        localStorage.setItem('user-data', JSON.stringify(data.operator))
        
        // Reindirizza alla dashboard
        router.push('/')
      } else {
        setError(data.message || 'Errore durante il login')
      }
    } catch (error) {
      console.error('Errore login:', error)
      setError('Errore di connessione. Riprova.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <User className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Accesso Operatori</h1>
          <p className="text-gray-600">Gestione Pulizie Smoobu</p>
        </div>

        {/* Form di login */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Campo Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={credentials.username}
                  onChange={handleChange}
                  className="input-field pl-10"
                  placeholder="Inserisci username"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Campo Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={credentials.password}
                  onChange={handleChange}
                  className="input-field pl-10"
                  placeholder="Inserisci password"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Messaggio di errore */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Pulsante di login */}
            <button
              type="submit"
              disabled={loading || !credentials.username || !credentials.password}
              className="w-full btn-primary flex items-center justify-center gap-2 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Accedi
                </>
              )}
            </button>
          </form>

          {/* Credenziali di test */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600 mb-2">Account di test:</p>
            <div className="text-xs space-y-1">
              <div><strong>mario.rossi</strong> / password123</div>
              <div><strong>anna.bianchi</strong> / password123</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}