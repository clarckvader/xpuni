import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'rgb(10 11 18)' }}>
      <div className="text-center space-y-4 animate-fade-in">
        <p className="text-8xl font-extrabold gradient-text">404</p>
        <h2 className="text-2xl font-semibold" style={{ color: 'rgb(226 232 240)' }}>Page Not Found</h2>
        <p className="text-lg" style={{ color: 'rgb(100 116 139)' }}>This block doesn't exist on-chain.</p>
        <Link to="/" className="btn btn-primary inline-flex mt-4">
          Go Back Home
        </Link>
      </div>
    </div>
  )
}
