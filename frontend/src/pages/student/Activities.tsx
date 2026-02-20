import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Layout from '@/components/Layout'
import { apiClient } from '@/services/api'
import { useNotificationContext } from '@/hooks/useNotificationContext'
import type { Activity } from '@/types/api'

export default function StudentActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const notify = useNotificationContext()

  useEffect(() => {
    const loadActivities = async () => {
      try {
        setLoading(true)
        const result = await apiClient.listActivities(1, 20, search || undefined)
        setActivities(result)
      } catch (error) {
        notify.error('Failed to load activities')
        console.error('Failed to load activities:', error)
      } finally {
        setLoading(false)
      }
    }

    const debounce = setTimeout(() => {
      loadActivities()
    }, 300)

    return () => clearTimeout(debounce)
  }, [search, notify])

  const categories = [...new Set(activities.map((a) => a.category))]
  const filtered = activities.filter(
    (a) => !category || a.category === category,
  )

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Available Activities</h1>
          <p className="text-muted mt-2">Complete activities to earn points</p>
        </div>

        {/* Filters */}
        <div className="card p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label-field">Search</label>
              <input
                type="text"
                placeholder="Search activities..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="label-field">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input-field"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Activities Grid */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted">Loading activities...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-muted">No activities found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((activity) => (
              <Link key={activity.id} to={`/student/activities/${activity.id}`}>
                <div className="card p-6 h-full hover:shadow-lg transition cursor-pointer">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-bold text-foreground text-lg">{activity.title}</h3>
                    </div>

                    <p className="text-sm text-muted line-clamp-2">{activity.description}</p>

                    <div className="flex justify-between items-center border-t border-border pt-4">
                      <span className="text-lg font-bold text-primary">
                        {(activity as any).pointsReward}
                      </span>
                      <span className="text-xs text-muted">points</span>
                    </div>

                    <button className="btn-primary w-full text-sm">
                      View Details
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
