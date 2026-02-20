export default function LoadingPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="space-y-4 text-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
        <h2 className="text-xl font-semibold text-foreground">Loading...</h2>
        <p className="text-muted">Initializing application</p>
      </div>
    </div>
  )
}
