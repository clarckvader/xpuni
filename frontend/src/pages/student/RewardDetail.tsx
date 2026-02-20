import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '@/components/Layout'
import { apiClient } from '@/services/api'
import { useNotificationContext } from '@/hooks/useNotificationContext'

type BackendReward = { id: number; name: string; description: string; pointsCost: number; stock: number | null; imageUrl: string | null }

export default function StudentRewardDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [reward, setReward] = useState<BackendReward | null>(null)
  const [loading, setLoading] = useState(true)
  const [redeeming, setRedeeming] = useState(false)
  const [redeemed, setRedeemed] = useState(false)
  const notify = useNotificationContext()

  useEffect(() => {
    if (!id) return
    const load = async () => {
      try {
        const data = await apiClient.getReward(id)
        setReward(data as unknown as BackendReward)
      } catch {
        notify.error('Failed to load reward')
        navigate('/student/rewards')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const handleRedeem = async () => {
    if (!id || !confirm('Redeem this reward? Points will be deducted from your balance.')) return
    setRedeeming(true)
    try {
      await apiClient.createRedemption({ reward_id: id })
      notify.success('Reward redeemed successfully!')
      setRedeemed(true)
    } catch (err) {
      notify.error(apiClient.getErrorMessage(err))
    } finally {
      setRedeeming(false)
    }
  }

  if (loading) {
    return <Layout title="Reward Detail"><div className="text-center py-12"><p className="text-muted">Loading...</p></div></Layout>
  }

  if (!reward) return null

  const outOfStock = reward.stock !== null && reward.stock <= 0

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <button onClick={() => navigate('/student/rewards')} className="text-primary hover:underline text-sm">
          ← Back to Rewards
        </button>

        <div className="card overflow-hidden">
          {reward.imageUrl && <img src={reward.imageUrl} alt={reward.name} className="w-full h-64 object-cover" />}
          <div className="p-8 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-3xl font-bold text-foreground">{reward.name}</h1>
              <div className="text-right shrink-0">
                <p className="text-3xl font-bold text-primary">{reward.pointsCost}</p>
                <p className="text-xs text-muted">points</p>
              </div>
            </div>

            <p className="text-foreground leading-relaxed">{reward.description}</p>

            {reward.stock !== null && (
              <p className="text-sm text-muted">{reward.stock > 0 ? `${reward.stock} available` : 'Out of stock'}</p>
            )}

            {redeemed ? (
              <div className="bg-success bg-opacity-10 border border-success rounded-lg p-4 text-center">
                <p className="font-bold text-success">Redeemed successfully!</p>
                <p className="text-sm text-muted mt-1">Your request is pending fulfillment.</p>
              </div>
            ) : (
              <button className="btn btn-primary w-full" onClick={handleRedeem} disabled={redeeming || outOfStock}>
                {outOfStock ? 'Out of Stock' : redeeming ? 'Redeeming...' : `Redeem for ${reward.pointsCost} pts`}
              </button>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
