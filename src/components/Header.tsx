import type { ReactNode } from 'react'
import { PlaybackControls } from '../scenario/playback'
import logoMark from '../assets/logo-mark.svg'
import wordmark4 from '../assets/wordmark-4.svg'
import wordmark7Mirrored from '../assets/wordmark-7-mirrored.svg'
import wordmark7 from '../assets/wordmark-7.svg'
import dotLive from '../assets/dot-live.svg'
import { STEP_NAMES } from '../data/steps'

interface Props {
  clock: string
  connection: string
  children?: ReactNode
  activeStep: number
  showSteps: boolean
  onNavigate: (step: number) => void
  detailAvailable: boolean
}

export function Header({ clock, connection, children, activeStep, showSteps, onNavigate, detailAvailable }: Props) {
  return (
    <header className="header">
      <div className="header-inner">
        <div className="brand">
          <img src={logoMark} alt="" />
          <div className="wordmark" role="img" aria-label="477">
            <span className="wordmark-4">
              <img src={wordmark4} alt="" />
            </span>
            <img src={wordmark7Mirrored} alt="" />
            <img src={wordmark7} alt="" />
          </div>
          <span className="brand-rule" />
          <span className="brand-tag">AI 관제 보조</span>
        </div>

        {showSteps && <nav className="steps" aria-label="데모 단계">
          {STEP_NAMES.map((name, i) => <button type="button" key={name} className="step" aria-current={activeStep === i + 1 ? 'step' : undefined} disabled={i === 5 && !detailAvailable} onClick={() => onNavigate(i + 1)}>{i + 1}  {name}</button>)}
        </nav>}
        <div className="status">
          <span className="status-site">477 로컬 관제 데모</span>
          <span className="status-live">
            <img src={dotLive} alt="" />
            {connection}
          </span>
          <time className="status-clock">{clock}</time>
          <details className="header-tools"><summary className="user" aria-label="관제사 · 연결 설정" title="연결 설정">관</summary>{children}</details>
          <PlaybackControls />
        </div>
      </div>
    </header>
  )
}
