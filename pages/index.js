import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { 
  Calendar, 
  MapPin, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  User, 
  Home, 
  Filter,
  LogOut,
  RefreshCw,
  Phone,
  Mail
} from 'lucide-react'

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [selectedDate, setSelectedDate] = useState(getToday())
  const [cleaningJobs, setCleaningJobs] = useState([])
  const [properties, setProperties] = useState([])
  const [completedJobs, setCompletedJobs] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  // Utility functions
  function getToday() {
    return new Date().toISOString().split('T')[0]
  }

  function getNext3Days() {
    const dates = []
    const today = new Date()
    for (let i = 0; i < 3; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      dates.push(date.toISOString().split('T')[0])
    }
    return dates
  }

  function formatDate(dateString) {
    const date = new Date(dateString)
    const options = { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short' 
    }
    return date.toLocaleDateString('it-IT', options)
  }

  function formatTime(timeString) {
    return timeString.slice(0, 5) // HH:MM
  }

  // Auth check
  useEffect(() => {
    const token = localStorage.getItem('auth-token')
    const userData = localStorage.getItem('user-data')
    
    if (!token || !userData) {
      router.push('/login')
      return
    }
    
    try {
      setUser(JSON.parse(userData))
    } catch (error) {
      console.error('Errore parsing user data:', error)
      router.push('/login')
    }
  }, [router])

  // Load data
  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  const loadData = async () => {
    setLoading(true)
    setError('')
    
    try {
      const token = localStorage.getItem('auth-token')
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }

      // Load properties
      const propertiesRes = await fetch('/api/my-properties', { headers })
      const propertiesData = await propertiesRes.json()
      
      if (propertiesData.success) {
        setProperties(propertiesData.properties)
      }

      // Load cleaning jobs for next 3 days
      const dateFrom = getToday()
      const dateTo = getNext3Days()[2] // 3rd day
      
      const jobsRes = await fetch(`/api/cleaning-jobs?date_from=${dateFrom}&date_to=${dateTo}`, { headers })
      const jobsData = await jobsRes.json()
      
      if (jobsData.success) {
        setCleaningJobs(jobsData.jobs)
        // Mark completed jobs
        const completed = new Set(
          jobsData.jobs
            .filter(job => job.status === 'completed')
            .map(job => job.id)
        )
        setCompletedJobs(completed)
      }
      
    } catch (error) {
      console.error('Errore caricamento dati:', error)
      setError('Errore caricamento dati')
    } finally {
      setLoading(false)
    }
  }

  const handleJobCompletion = async (jobId, currentStatus) => {
    try {
      const token = localStorage.getItem('auth-token')
      const newStatus = currentStatus === 'completed' ? 'pending' : 'completed'
      
      const response = await fetch('/api/cleaning-jobs', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          job_id: jobId,
          status: newStatus,
          completion_notes: newStatus === 'completed' ? 'Completato dall\'app mobile' : null
        })
      })

      const data = await response.json()
      
      if (data.success) {
        // Update local state
        setCleaningJobs(prev => prev.map(job => 
          job.id === jobId ? { ...job, status: newStatus } : job
        ))
        
        const newCompleted = new Set(completedJobs)
        if (newStatus === 'completed') {
          newCompleted.add(jobId)
        } else {
          newCompleted.delete(jobId)
        }
        setCompletedJobs(newCompleted)
      }
    } catch (error) {
      console.error('Errore aggiornamento lavoro:', error)
    }
  }

  const handleSync = async () => {
    setSyncing(true)
    try {
      const token = localStorage.getItem('auth-token')
      const response = await fetch('/api/sync-smoobu', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()
      if (data.success) {
        await loadData() // Reload data after sync
      }
    } catch (error) {
      console.error('Errore sincronizzazione:', error)
    } finally {
      setSyncing(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('auth-token')
    localStorage.removeItem('user-data')
    router.push('/login')
  }

  const getJobsForDate = (date) => {
    return cleaningJobs.filter(job => job.scheduled_date === date)
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case 'checkout': return <AlertCircle className="w-4 h-4 text-red-600" />
      case 'checkin': return <User className="w-4 h-4 text-blue-600" />
      case 'maintenance': return <Home className="w-4 h-4 text-gray-600" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  if (loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Caricamento...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  const selectedDateJobs = getJobsForDate(selectedDate)
  const next3Days = getNext3Days()
  const totalJobsToday = selectedDateJobs.length
  const completedToday = selectedDateJobs.filter(job => completedJobs.has(job.id)).length
  const remainingToday = totalJobsToday - completedToday

  return (
    <div className="max-w-sm mx-auto bg-white min-h-screen">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 rounded-b-lg shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-lg font-bold">Ciao, {user.name?.split(' ')[0] || user.username}</h1>
            <p className="text-blue-100 text-sm">Pulizie Assegnate</p>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            <span className="text-sm bg-blue-700 px-2 py-1 rounded-full">{properties.length} strutture</span>
          </div>
        </div>
        
        {/* Date selector */}
        <div className="flex gap-2 overflow-x-auto">
          {next3Days.map((date) => (
            <button
              key={date}
              onClick={() => setSelectedDate(date)}
              className={`flex-shrink-0 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedDate === date
                  ? 'bg-white text-blue-600 shadow-md'
                  : 'bg-blue-700 text-blue-100 hover:bg-blue-500'
              }`}
            >
              {formatDate(date)}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="p-4 bg-gray-50">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-white p-3 rounded-lg shadow-sm">
            <div className="text-xl font-bold text-blue-600">{totalJobsToday}</div>
            <div className="text-xs text-gray-600">Lavori oggi</div>
          </div>
          <div className="bg-white p-3 rounded-lg shadow-sm">
            <div className="text-xl font-bold text-green-600">{completedToday}</div>
            <div className="text-xs text-gray-600">Completati</div>
          </div>
          <div className="bg-white p-3 rounded-lg shadow-sm">
            <div className="text-xl font-bold text-orange-600">{remainingToday}</div>
            <div className="text-xs text-gray-600">Rimanenti</div>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mx-4 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Jobs List */}
      <div className="p-4 space-y-3 pb-24">
        {loading ? (
          <div className="text-center py-8">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-gray-500">Caricamento lavori...</p>
          </div>
        ) : selectedDateJobs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Nessuna pulizia programmata per questo giorno</p>
          </div>
        ) : (
          selectedDateJobs.map((job) => (
            <div
              key={job.id}
              className={`bg-white rounded-lg shadow-sm border-l-4 p-4 transition-all ${
                job.status === 'completed'
                  ? 'border-green-400 bg-green-50'
                  : 'border-blue-400 hover:shadow-md'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {getTypeIcon(job.type)}
                    <h3 className="font-semibold text-gray-900">{job.property_name}</h3>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <Clock className="w-4 h-4" />
                    <span>{formatTime(job.scheduled_time)}</span>
                    <span className={`px-2 py-1 rounded-full text-xs border ${getPriorityColor(job.priority)}`}>
                      {job.type}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleJobCompletion(job.id, job.status)}
                  className={`p-2 rounded-full transition-all ${
                    job.status === 'completed'
                      ? 'bg-green-100 text-green-600'
                      : 'bg-gray-100 text-gray-400 hover:bg-green-100 hover:text-green-600'
                  }`}
                >
                  <CheckCircle className="w-5 h-5" />
                </button>
              </div>

              {job.guest_name && (
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <User className="w-4 h-4" />
                  <span>Ospite: {job.guest_name}</span>
                </div>
              )}

              <div className="flex items-start gap-2 text-sm text-gray-600 mb-3">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span className="leading-tight">{job.property_address}</span>
              </div>

              {job.notes && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-700">{job.notes}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-sm bg-white border-t border-gray-200 p-4">
        <div className="flex gap-3">
          <button 
            onClick={handleSync}
            disabled={syncing}
            className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg font-medium shadow-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Sincronizzando...' : 'Sincronizza'}
          </button>
          
          <button 
            onClick={handleLogout}
            className="bg-gray-200 text-gray-700 px-4 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}