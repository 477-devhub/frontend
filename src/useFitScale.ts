import { useLayoutEffect, useState, type CSSProperties } from 'react'

// 디자인 기준 캔버스. 뷰포트가 이보다 작으면 전체를 같은 비율로 줄여 스크롤 없이 맞춘다.
const DESIGN_WIDTH = 1600
const DESIGN_HEIGHT = 1000
// styles.css의 세로 배치 전환 지점과 같아야 한다. 그 아래에서는 줄이지 않고 스크롤한다.
const STACK_BREAKPOINT = 1180

export function useFitScale(): CSSProperties | undefined {
  const [style, setStyle] = useState<CSSProperties>()

  useLayoutEffect(() => {
    const update = () => {
      const { innerWidth: w, innerHeight: h } = window
      if (w <= STACK_BREAKPOINT) {
        setStyle(undefined)
        return
      }
      const zoom = Math.min(1, w / DESIGN_WIDTH, h / DESIGN_HEIGHT)
      setStyle({ zoom, width: w / zoom, height: h / zoom, minHeight: 0 })
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  return style
}
