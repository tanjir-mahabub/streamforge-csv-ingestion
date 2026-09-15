import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent, DragEvent } from 'react'
import './batch.css'
import './typography.css'

type Status = 'ready' | 'running' | 'paused' | 'complete'
type Customer = { id: string; name: string; email: string; phone: string; status: 'valid' | 'duplicate' | 'invalid' }

const names = ['Ava Thompson','Liam Carter','Sophia Martinez','Noah Williams','Mia Anderson','Ethan Brown','Isabella Davis','Lucas Wilson','Amelia Taylor','Mason Moore','Harper Jackson','James White']
const seedCustomers: Customer[] = Array.from({ length: 120 }, (_, index) => ({
  id: `CUS-${String(index + 1042).padStart(5, '0')}`,
  name: names[index % names.length],
  email: `${names[index % names.length].toLowerCase().replace(' ', '.')}+${index + 1}@example.com`,
  phone: `+1 415 55${String(10000 + index).slice(-5)}`,
  status: index % 17 === 0 ? 'duplicate' : index % 29 === 0 ? 'invalid' : 'valid',
}))

const icon = (name: string) => {
  const paths: Record<string, string> = {
    grid: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
    upload: 'M12 16V4m0 0L7 9m5-5 5 5M5 20h14',
    users: 'M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2m7-10a4 4 0 100-8 4 4 0 000 8zm13 10v-2a4 4 0 00-3-3.87m-1-8a4 4 0 010 7.75',
    activity: 'M3 12h4l3-8 4 16 3-8h4', search: 'M21 21l-4.35-4.35m2.35-5.65a8 8 0 11-16 0 8 8 0 0116 0',
    check: 'M20 6L9 17l-5-5', pause: 'M9 5v14m6-14v14', play: 'M5 3l14 9-14 9z', refresh: 'M20 11a8 8 0 10-2.34 5.66M20 4v7h-7',
    file: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M8 13h8M8 17h5', moon: 'M21 12.8A9 9 0 1111.2 3 7 7 0 0021 12.8z',
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d={paths[name]} /></svg>
}

export default function App() {
  const [status, setStatus] = useState<Status>('ready')
  const [progress, setProgress] = useState(0)
  const [rows, setRows] = useState(2_000_000)
  const [fileName, setFileName] = useState('customers-2m.csv')
  const [customers, setCustomers] = useState(seedCustomers)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<'all' | Customer['status']>('all')
  const [batch, setBatch] = useState(0)
  const [loadingBatch, setLoadingBatch] = useState(false)
  const [dark, setDark] = useState(false)
  const [dragging, setDragging] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (status !== 'running') return
    const timer = window.setInterval(() => setProgress(current => {
      const next = Math.min(100, current + 0.45 + Math.random() * 0.8)
      if (next >= 100) setStatus('complete')
      return next
    }), 120)
    return () => window.clearInterval(timer)
  }, [status])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  const processed = Math.round(rows * progress / 100)
  const skipped = Math.round(processed * 0.0037)
  const rate = status === 'running' ? 12840 + (Math.round(progress * 13) % 420) : progress ? 12864 : 0
  const eta = rate ? Math.max(0, Math.round((rows - processed) / rate)) : 0
  const filtered = useMemo(() => customers.filter(customer => {
    const matches = `${customer.name} ${customer.email} ${customer.phone}`.toLowerCase().includes(query.toLowerCase())
    return matches && (filter === 'all' || customer.status === filter)
  }), [customers, filter, query])
  const batchSize = 8
  const batchCount = Math.max(1, Math.ceil(filtered.length / batchSize))
  const visibleCustomers = filtered.slice(batch * batchSize, (batch + 1) * batchSize)

  const acceptFile = (file?: File) => {
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.csv')) return
    setFileName(file.name)
    setRows(Math.max(1000, Math.round(file.size / 82)))
    setProgress(0)
    setStatus('ready')
  }
  const onDrop = (event: DragEvent) => { event.preventDefault(); setDragging(false); acceptFile(event.dataTransfer.files[0]) }
  const onFile = (event: ChangeEvent<HTMLInputElement>) => acceptFile(event.target.files?.[0])
  const start = () => { if (status === 'complete') setProgress(0); setStatus('running') }
  const reset = () => { setStatus('ready'); setProgress(0); setFileName('customers-2m.csv'); setRows(2_000_000); setCustomers(seedCustomers); setBatch(0) }
  const loadNextBatch = () => {
    if (loadingBatch) return
    setLoadingBatch(true)
    window.setTimeout(() => {
      if (batch + 1 < batchCount) {
        setBatch(current => current + 1)
      } else {
        const offset = customers.length
        const next = seedCustomers.slice(0, batchSize).map((customer, index) => ({
          ...customer,
          id: `CUS-${String(offset + index + 1042).padStart(5, '0')}`,
          email: customer.email.replace('@', `+batch${batchCount}@`),
        }))
        setCustomers(current => [...current, ...next])
        setBatch(batchCount)
      }
      setLoadingBatch(false)
    }, 280)
  }

  return <div className="shell">
    <aside>
      <a className="logo" href="#top"><span>SF</span><strong>StreamForge</strong></a>
      <p className="nav-title">Workspace</p>
      <nav><a className="active" href="#top">{icon('grid')}Overview</a><a href="#pipeline">{icon('upload')}Import pipeline</a><a href="#records">{icon('users')}Records</a><a href="#architecture">{icon('activity')}Architecture</a></nav>
      <div className="engine-card"><div><i/><span>Processing engine</span></div><strong>Operational</strong><small>Streaming workers healthy</small></div>
      <div className="owner"><span>TM</span><div><strong>Tanjir Mahabub</strong><small>Workspace owner</small></div></div>
    </aside>
    <main id="top">
      <header><div className="mobile-logo">StreamForge</div><div className="header-status"><i/>All systems operational</div><button className="theme" onClick={() => setDark(!dark)} aria-label="Toggle color theme">{icon('moon')}</button><a className="github" href="https://github.com/tanjir-mahabub/streamforge-csv-ingestion" target="_blank" rel="noreferrer">View source ↗</a></header>
      <div className="content">
        <section className="intro"><div><p className="eyebrow">Data ingestion platform</p><h1>Move millions of records.<br/><span>Without breaking flow.</span></h1><p>Resilient CSV ingestion with streaming backpressure, resumable jobs, live observability, and memory-safe rendering.</p></div><div className="architecture-pill"><span>Designed for</span><strong>2GB+ datasets</strong><small>Constant-memory processing</small></div></section>

        <section className="metrics">
          <article><span>Rows processed</span><strong>{processed.toLocaleString()}</strong><small><b>↗ 12.4%</b> throughput</small></article>
          <article><span>Processing rate</span><strong>{rate.toLocaleString()}<em>/sec</em></strong><small>Rolling 10s average</small></article>
          <article><span>Data quality</span><strong>{processed ? '99.63' : '100'}<em>%</em></strong><small><b>{skipped.toLocaleString()}</b> safely skipped</small></article>
          <article><span>Memory profile</span><strong>74<em> MB</em></strong><small>Stable under backpressure</small></article>
        </section>

        <section className="workspace-grid" id="pipeline">
          <article className="panel import-panel"><div className="panel-heading"><div><p className="eyebrow">Import control</p><h2>Streaming pipeline</h2></div><span className={`status ${status}`}><i/>{status === 'ready' ? 'Ready' : status}</span></div>
            <button className={`dropzone ${dragging ? 'dragging' : ''}`} onClick={() => fileInput.current?.click()} onDragOver={e => {e.preventDefault();setDragging(true)}} onDragLeave={() => setDragging(false)} onDrop={onDrop}>
              <input ref={fileInput} type="file" accept=".csv,text/csv" onChange={onFile}/><span className="file-icon">{icon('file')}</span><div><strong>{fileName}</strong><small>{(rows * 82 / 1024 / 1024).toFixed(1)} MB · approximately {rows.toLocaleString()} rows</small></div><em>Replace file</em>
            </button>
            <div className="progress-head"><span>Import progress</span><strong>{progress.toFixed(1)}%</strong></div><div className="progress"><i style={{width:`${progress}%`}}/></div><div className="progress-meta"><span>{processed.toLocaleString()} processed</span><span>{eta ? `~${eta}s remaining` : status === 'complete' ? 'Completed successfully' : 'Awaiting start'}</span></div>
            <div className="pipeline-actions"><button className="primary" onClick={status === 'running' ? () => setStatus('paused') : start}>{icon(status === 'running' ? 'pause' : 'play')}{status === 'running' ? 'Pause safely' : status === 'paused' ? 'Resume import' : status === 'complete' ? 'Run again' : 'Start import'}</button><button className="secondary" onClick={reset}>{icon('refresh')}Reset</button></div>
          </article>
          <article className="panel events"><div className="panel-heading"><div><p className="eyebrow">Live telemetry</p><h2>Pipeline events</h2></div><span>Last 30s</span></div>
            <div className="pulse-chart">{Array.from({length:26},(_,i)=><i key={i} style={{height:`${22 + ((i*17)%58)}%`,opacity:.35+(i/40)}}/> )}</div>
            {[['Chunk committed',`${Math.max(1,Math.floor(processed/10000))} batches`,'now'],['Duplicate detection',`${skipped.toLocaleString()} records`,'2s'],['Checkpoint persisted',`row ${processed.toLocaleString()}`,'5s'],['Heap pressure','Within threshold','8s']].map(([title,value,time])=><div className="event" key={title}><i/><div><strong>{title}</strong><small>{value}</small></div><span>{time}</span></div>)}
          </article>
        </section>

        <section className="panel records" id="records"><div className="panel-heading"><div><p className="eyebrow">Imported records</p><h2>Customer data</h2></div><div className="record-tools"><label>{icon('search')}<input value={query} onChange={e=>{setQuery(e.target.value);setBatch(0)}} placeholder="Search records"/></label><select value={filter} onChange={e=>{setFilter(e.target.value as typeof filter);setBatch(0)}}><option value="all">All records</option><option value="valid">Valid</option><option value="duplicate">Duplicates</option><option value="invalid">Invalid</option></select></div></div>
          <div className={`table-wrap ${loadingBatch ? 'table-loading' : ''}`}><table><thead><tr><th>Customer</th><th>Email</th><th>Phone</th><th>Record ID</th><th>Status</th></tr></thead><tbody>{visibleCustomers.map(customer=><tr key={customer.id}><td><span className="avatar">{customer.name.split(' ').map(x=>x[0]).join('')}</span><strong>{customer.name}</strong></td><td>{customer.email}</td><td>{customer.phone}</td><td><code>{customer.id}</code></td><td><span className={`row-status ${customer.status}`}><i/>{customer.status}</span></td></tr>)}</tbody></table>{visibleCustomers.length === 0 && <div className="empty-state">No records match the current filters.</div>}</div>
          <div className="table-footer"><span>Batch {Math.min(batch + 1, batchCount)} · showing {visibleCustomers.length} of {filtered.length.toLocaleString()} matching records</span><div><button disabled={batch === 0 || loadingBatch} onClick={() => setBatch(current => Math.max(0, current - 1))}>Previous</button><button disabled={loadingBatch} onClick={loadNextBatch}>{loadingBatch ? 'Loading…' : batch + 1 < batchCount ? 'Next batch' : 'Load more records'}</button></div></div>
        </section>

        <section className="architecture" id="architecture"><div><p className="eyebrow">Architecture</p><h2>Built to stay responsive<br/>under real load.</h2><p>The processing path applies backpressure from disk to database, stores durable checkpoints, and keeps UI rendering independent from dataset size.</p></div><div className="architecture-flow"><div><span>01</span><strong>Read stream</strong><small>Bounded chunks</small></div><b>→</b><div><span>02</span><strong>Validate</strong><small>Schema + dedupe</small></div><b>→</b><div><span>03</span><strong>Batch write</strong><small>Idempotent commits</small></div><b>→</b><div><span>04</span><strong>Checkpoint</strong><small>Resume safely</small></div></div></section>
      </div>
      <footer><span>StreamForge · CSV ingestion engineering showcase</span><span>React 19 · NestJS · Prisma · MongoDB · Streaming I/O</span></footer>
    </main>
  </div>
}
