import GranularityDropdown from '../TopBar/GranularityDropdown'
import './SubBar.css'

export default function SubBar({ granularity, onGranularityChange }) {
  return (
    <div className="subbar">
      <div className="subbar__spacer" />
      <GranularityDropdown value={granularity} onChange={onGranularityChange} />
    </div>
  )
}
