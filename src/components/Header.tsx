import type { ReactNode } from 'react'
import logoMark from '../assets/logo-mark.svg'
import wordmark4 from '../assets/wordmark-4.svg'
import wordmark7Mirrored from '../assets/wordmark-7-mirrored.svg'
import wordmark7 from '../assets/wordmark-7.svg'
import dotLive from '../assets/dot-live.svg'
import { STEP_NAMES } from '../data/steps'

interface Props {
  step: number
  onStep: (step: number) => void
  clock: string
  connection: string
  disabled?: boolean
  children?: ReactNode
}

export function Header({ step, onStep, clock, connection, disabled=false, children }: Props) {
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

        <nav className="steps" aria-label="데모 단계">
          {STEP_NAMES.map((name, i) => {
            const n = i + 1
            return (
              <button
                key={n}
                type="button"
                className="step"
                disabled={disabled}
                aria-current={n === step ? 'step' : undefined}
                onClick={() => onStep(n)}
              >
                {n}&nbsp;&nbsp;{name}
              </button>
            )
          })}
        </nav>

        <div className="status">
          <span className="status-site">477 로컬 관제 데모</span>
          <span className="status-live">
            <img src={dotLive} alt="" />
            {connection}
          </span>
          <details className="header-tools"><summary>연결 설정</summary>{children}</details>
          <time className="status-clock">{clock}</time>
          <span className="user" aria-label="관제사">
            관
          </span>
        </div>
      </div>
    </header>
  )
}
