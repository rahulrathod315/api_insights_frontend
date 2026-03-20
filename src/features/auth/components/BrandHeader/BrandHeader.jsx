import './BrandHeader.css'

export default function BrandHeader({ tagline }) {
  return (
    <div className="brand-header">
      <span className="brand-header__name brand-header__accent">API Insights</span>
      {tagline && <p className="brand-header__tagline">{tagline}</p>}
    </div>
  )
}
