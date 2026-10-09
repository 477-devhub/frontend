import { useCallback, useEffect, useRef, useState } from 'react'
import { acceptSnapshot, runtimeUrl, type Metrics, type RuntimeSnapshot } from './model'

async function request<T>(path: string, body?: unknown): Promise<T> {
  const r = await fetch(runtimeUrl(path), { method: body === undefined ? 'GET' : 'POST', headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(8000) })
  if (!r.ok) throw new Error(`Runtime ${r.status}: ${await r.text()}`)
  return r.json()
}
export function useRuntime() {
  const [snapshot, setSnapshot] = useState<RuntimeSnapshot | null>(null)
  const [connected, setConnected] = useState(false)
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const current = useRef(snapshot); current.current = snapshot
  const clock = useRef<{ offset: number; uncertainty: number } | null>(null)
  const receipts = useRef(new Map<string, { time: number; pending: boolean; done: boolean }>())
  useEffect(() => {
    let closed = false, socket: WebSocket | undefined, reconnect: ReturnType<typeof setTimeout>
    let lastMessage = 0
    const syncClock = async () => {
      let best = { offset: 0, uncertainty: Infinity }
      for (let i = 0; i < 5 && !closed; i++) {
        const before = performance.timeOrigin + performance.now()
        const { epoch } = await request<{ epoch: number }>('/api/time')
        const after = performance.timeOrigin + performance.now()
        const uncertainty = (after - before) / 2
        if (uncertainty < best.uncertainty) best = { offset: epoch * 1000 - (before + after) / 2, uncertainty }
      }
      if (!closed && best.uncertainty < 10000) clock.current = best
    }
    const connect = () => {
      if (closed) return
      socket = new WebSocket(`${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}/runtime/ws`)
      socket.onmessage = event => {
        try {
          const next = JSON.parse(event.data) as RuntimeSnapshot
          if (!next.instance || !Array.isArray(next.candidates) || !Array.isArray(next.cameras)) throw new Error('invalid_snapshot')
          lastMessage = performance.now()
          setSnapshot(previous => acceptSnapshot(previous, next)); setConnected(true)
        } catch { setError('런타임 응답 형식을 확인할 수 없습니다.'); socket?.close() }
      }
      socket.onclose = () => { if (!closed) { setConnected(false); reconnect = setTimeout(connect, 1500) } }
      socket.onerror = () => socket?.close()
      void syncClock().catch(() => { clock.current = null })
    }
    connect()
    const monitor = setInterval(() => {
      if (lastMessage && performance.now() - lastMessage > 4000) { setConnected(false); socket?.close() }
    }, 1000)
    const poll = async () => { try { const result = await request<Metrics>('/api/metrics'); if (!closed) setMetrics(result) } catch { /* Socket status is authoritative. */ } }
    void poll()
    const timer = setInterval(poll, 2000)
    const clockTimer = setInterval(() => { void syncClock().catch(() => {}) }, 30000)
    return () => { closed = true; clearTimeout(reconnect); clearInterval(timer); clearInterval(monitor); clearInterval(clockTimer); socket?.close() }
  }, [])
  const displayed = useCallback((id: string) => {
    const s = current.current, alignment = clock.current
    const c = s?.candidates.find(c => c.candidate_id === id)
    if (!s || !c || c.t3 !== null || !alignment || document.visibilityState !== 'visible') return
    const key = `${s.instance}:${id}`
    let receipt = receipts.current.get(key)
    if (!receipt) {
      receipt = { time: (performance.timeOrigin + performance.now() + alignment.offset) / 1000, pending: false, done: false }
      if (receipt.time < c.t2) return
      receipts.current.set(key, receipt)
    }
    if (receipt.pending || receipt.done) return
    receipt.pending = true
    const saved = receipt
    void request(`/api/candidates/${encodeURIComponent(id)}/displayed`, { t3_server_epoch: saved.time, clock_uncertainty_ms: alignment.uncertainty })
      .then(() => { saved.done = true }).catch(() => {}).finally(() => { saved.pending = false })
  }, [])
  const act = async (id?: string, action?: 'reviewed' | 'dismissed') => {
    if (busy || !connected) return
    setBusy(true); setError('')
    try {
      // WS alone owns state; slower HTTP responses cannot overwrite newer events.
      await request(id ? `/api/candidates/${encodeURIComponent(id)}/human` : '/api/start', id ? { action } : {})
    } catch (e) { setError(e instanceof Error ? e.message : '요청 실패') }
    finally { setBusy(false) }
  }
  return { snapshot, connected, metrics, error, busy, act, displayed }
}
