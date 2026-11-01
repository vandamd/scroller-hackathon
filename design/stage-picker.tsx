export const designStages = [
  { id: 'connect', label: 'Connect X' },
  { id: 'scanning', label: 'Scanning' },
  { id: 'taste', label: 'Your taste' },
  { id: 'office', label: 'Office' },
] as const

export type DesignStage = typeof designStages[number]['id']

export function getStage(): DesignStage {
  const value = new URLSearchParams(window.location.search).get('stage')
  return designStages.find(stage => stage.id === value)?.id ?? 'connect'
}

export function subscribeToStage(onChange: () => void) {
  window.addEventListener('popstate', onChange)
  return () => window.removeEventListener('popstate', onChange)
}

export function goToStage(stage: DesignStage) {
  if (getStage() === stage) return
  const url = new URL(window.location.href)
  url.searchParams.set('stage', stage)
  url.hash = ''
  window.history.pushState(null, '', url)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

export function StagePicker({ stage }: { stage: DesignStage }) {
  return (
    <nav className="stage-picker" aria-label="Design preview stages">
      <span className="stage-picker-label">Preview</span>
      <div className="stage-buttons">
        {designStages.map(item => (
          <button key={item.id} className={`stage-button${stage === item.id ? ' stage-selected' : ''}`} aria-current={stage === item.id ? 'step' : undefined} onClick={() => goToStage(item.id)}>{item.label}</button>
        ))}
      </div>
      <select className="stage-select" aria-label="Preview stage" value={stage} onChange={event => goToStage(event.target.value as DesignStage)}>
        {designStages.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
      </select>
    </nav>
  )
}
