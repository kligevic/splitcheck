'use client'

import { useMemo, useState, type CSSProperties } from 'react'
import { Camera, Check, ReceiptText, ScanLine, Users } from 'lucide-react'

type PreviewScreen = 'main' | 'receipt' | 'summary'

type ParticipantId = 'me' | 'pasha' | 'masha'

type ReceiptItem = {
  id: string
  name: string
  price: number
  assignedTo: ParticipantId[]
}

type Participant = {
  id: ParticipantId
  name: string
  short: string
  color: string
}

const screens: { id: PreviewScreen; label: string; title: string }[] = [
  { id: 'main', label: '01', title: 'Главный экран' },
  { id: 'receipt', label: '02', title: 'Разбор чека' },
  { id: 'summary', label: '03', title: 'Итоги' },
]

const PARTICIPANTS: Participant[] = [
  { id: 'me', name: 'Я', short: 'Я', color: '#2dd4bf' },
  { id: 'pasha', name: 'Паша', short: 'П', color: '#fb923c' },
  { id: 'masha', name: 'Маша', short: 'М', color: '#c084fc' },
]

/** Карта получателя для PrivatShare — подставьте свою. */
const PRIVAT_CARD = '5168750000001234'
const HOST_ID: ParticipantId = 'me'

/**
 * Текстовая заглушка OCR: после «снимка» эти позиции
 * автоматически попадают на экран разбора чека.
 */
const OCR_RECEIPT_STUB = `ЧЕК №4821  Splito Pizza
Пицца        420.00
Кола          60.00
Пиво          90.00
РАЗОМ        570.00`

const OCR_ITEMS: Omit<ReceiptItem, 'assignedTo'>[] = [
  { id: 'pizza', name: 'Пицца', price: 420 },
  { id: 'cola', name: 'Кола', price: 60 },
  { id: 'beer', name: 'Пиво', price: 90 },
]

/** Ссылка быстрого перевода Monobank с суммой долга. */
function buildMonoLink(amount: number) {
  const sum = amount.toFixed(2)
  return `https://send.monobank.ua/?amount=${encodeURIComponent(sum)}&ccy=UAH`
}

/** PrivatShare / Приват24: сумма долга + карта получателя. */
function buildPrivatLink(amount: number, card: string) {
  const sum = amount.toFixed(2)
  return `https://www.privat24.ua/send/${encodeURIComponent(card)}/${encodeURIComponent(sum)}`
}

function formatUah(value: number) {
  return `${value.toFixed(2)} ₴`
}

function itemShare(item: ReceiptItem): number {
  if (item.assignedTo.length === 0) return 0
  return item.price / item.assignedTo.length
}

export default function Page() {
  const [activeScreen, setActiveScreen] = useState<PreviewScreen>('main')
  const [cameraOpen, setCameraOpen] = useState(false)
  const [cameraPhase, setCameraPhase] = useState<'live' | 'scanning' | 'done'>('live')
  const [ocrText, setOcrText] = useState('')
  const [items, setItems] = useState<ReceiptItem[]>([])
  const [selectedPeople, setSelectedPeople] = useState<ParticipantId[]>(['me'])

  const totals = useMemo(() => {
    const spent: Record<ParticipantId, number> = { me: 0, pasha: 0, masha: 0 }
    for (const item of items) {
      const share = itemShare(item)
      for (const id of item.assignedTo) spent[id] += share
    }
    const billTotal = items.reduce((sum, item) => sum + item.price, 0)
    const debts = PARTICIPANTS
      .filter((person) => person.id !== HOST_ID)
      .map((person) => ({
        ...person,
        amount: spent[person.id],
      }))
      .filter((person) => person.amount > 0.009)

    return { spent, billTotal, debts, hostSpent: spent[HOST_ID] }
  }, [items])

  function togglePerson(id: ParticipantId) {
    setSelectedPeople((current) =>
      current.includes(id) ? current.filter((person) => person !== id) : [...current, id],
    )
  }

  /** Тап по блюду делит цену между выбранными аватарками. */
  function assignDish(itemId: string) {
    if (selectedPeople.length === 0) return
    setItems((current) =>
      current.map((item) =>
        item.id === itemId ? { ...item, assignedTo: [...selectedPeople] } : item,
      ),
    )
  }

  function openCamera() {
    setCameraOpen(true)
    setCameraPhase('live')
  }

  function takePhoto() {
    setCameraPhase('scanning')
    window.setTimeout(() => {
      setCameraPhase('done')
      setOcrText(OCR_RECEIPT_STUB)
      setItems(OCR_ITEMS.map((item) => ({ ...item, assignedTo: [] })))
      window.setTimeout(() => {
        setCameraOpen(false)
        setCameraPhase('live')
        setActiveScreen('receipt')
      }, 700)
    }, 1200)
  }

  return (
    <main className="prototype-preview">
      <header className="preview-header">
        <a className="preview-brand" href="/" aria-label="Сплит-Чек — начало просмотра">
          <span className="preview-brand-icon" aria-hidden="true"><ReceiptText size={17} /></span>
          <span>Сплит<span>-</span>Чек</span>
        </a>
        <div className="preview-caption">
          <span className="preview-status-dot" />
          <span>ANDROID · ЖИВАЯ ЛОГИКА</span>
        </div>
      </header>

      <nav className="preview-tabs" aria-label="Экраны приложения">
        {screens.map((screen) => (
          <button
            className={`preview-tab ${activeScreen === screen.id ? 'is-active' : ''}`}
            id={`tab-${screen.id}`}
            type="button"
            aria-pressed={activeScreen === screen.id}
            key={screen.id}
            onClick={() => setActiveScreen(screen.id)}
          >
            <span className="preview-tab-index">{screen.label}</span>
            <span>{screen.title}</span>
          </button>
        ))}
      </nav>

      <section className="preview-stage" aria-label="Экраны приложения">
        <div className="preview-device is-current" id={`panel-${activeScreen}`}>
          <div className="device-shell">
            <div className="device-screen app-screen">
              {activeScreen === 'main' && (
                <HomeScreen
                  cameraOpen={cameraOpen}
                  cameraPhase={cameraPhase}
                  onOpenCamera={openCamera}
                  onTakePhoto={takePhoto}
                  onCloseCamera={() => setCameraOpen(false)}
                  hasReceipt={items.length > 0}
                  onOpenReceipt={() => setActiveScreen('receipt')}
                />
              )}

              {activeScreen === 'receipt' && (
                <ReceiptScreen
                  ocrText={ocrText}
                  items={items}
                  selectedPeople={selectedPeople}
                  onTogglePerson={togglePerson}
                  onAssignDish={assignDish}
                  onGoSummary={() => setActiveScreen('summary')}
                />
              )}

              {activeScreen === 'summary' && (
                <SummaryScreen totals={totals} items={items} />
              )}
            </div>
          </div>
          <span className="device-caption">
            {screens.find((screen) => screen.id === activeScreen)?.title}
          </span>
        </div>
      </section>

      <footer className="preview-footer">
        <span>ANDROID · DARK MODE</span>
        <span>Камера → деление позиций → оплата Mono / Приват</span>
      </footer>

      <style>{appStyles}</style>
    </main>
  )
}

function HomeScreen({
  cameraOpen,
  cameraPhase,
  onOpenCamera,
  onTakePhoto,
  onCloseCamera,
  hasReceipt,
  onOpenReceipt,
}: {
  cameraOpen: boolean
  cameraPhase: 'live' | 'scanning' | 'done'
  onOpenCamera: () => void
  onTakePhoto: () => void
  onCloseCamera: () => void
  hasReceipt: boolean
  onOpenReceipt: () => void
}) {
  return (
    <div className="app-home">
      <div className="status-bar">9:41</div>
      <h1>Сплит-Чек</h1>
      <p className="lead">Сфотографируйте чек — позиции появятся автоматически.</p>

      <button className="primary-btn" type="button" onClick={onOpenCamera}>
        <Camera size={18} />
        Сфотографировать чек
      </button>

      {hasReceipt && (
        <button className="ghost-btn" type="button" onClick={onOpenReceipt}>
          Открыть распознанный чек
        </button>
      )}

      {cameraOpen && (
        <div className="camera-overlay" role="dialog" aria-label="Камера">
          <div className="viewfinder">
            <span className="corner tl" />
            <span className="corner tr" />
            <span className="corner bl" />
            <span className="corner br" />
            {cameraPhase === 'scanning' && <div className="scan-line" />}
            {cameraPhase === 'done' && (
              <div className="scan-ok">
                <Check size={28} />
                <span>Чек распознан</span>
              </div>
            )}
          </div>
          <p className="camera-hint">
            {cameraPhase === 'live' && 'Наведите камеру на чек'}
            {cameraPhase === 'scanning' && 'OCR: читаем позиции...'}
            {cameraPhase === 'done' && 'Загружаем Пиццу, Колу и Пиво'}
          </p>
          <div className="camera-actions">
            <button className="ghost-btn" type="button" onClick={onCloseCamera} disabled={cameraPhase !== 'live'}>
              Отмена
            </button>
            <button
              className="shutter"
              type="button"
              aria-label="Сделать снимок"
              onClick={onTakePhoto}
              disabled={cameraPhase !== 'live'}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function ReceiptScreen({
  ocrText,
  items,
  selectedPeople,
  onTogglePerson,
  onAssignDish,
  onGoSummary,
}: {
  ocrText: string
  items: ReceiptItem[]
  selectedPeople: ParticipantId[]
  onTogglePerson: (id: ParticipantId) => void
  onAssignDish: (id: string) => void
  onGoSummary: () => void
}) {
  const assigned = items.filter((item) => item.assignedTo.length > 0).length

  return (
    <div className="app-receipt">
      <div className="status-bar">9:41</div>
      <h1>Разбор чека</h1>
      <p className="lead">Выберите людей, затем нажмите на блюдо — сумма разделится поровну.</p>

      <div className="avatars" aria-label="Участники">
        {PARTICIPANTS.map((person) => {
          const active = selectedPeople.includes(person.id)
          return (
            <button
              key={person.id}
              type="button"
              className={`avatar ${active ? 'is-on' : ''}`}
              style={{ '--p': person.color } as CSSProperties}
              onClick={() => onTogglePerson(person.id)}
              aria-pressed={active}
            >
              <span>{person.short}</span>
              <small>{person.name}</small>
            </button>
          )
        })}
      </div>

      {items.length === 0 ? (
        <div className="empty">
          <ScanLine size={22} />
          <span>Сначала сфотографируйте чек на главном экране</span>
        </div>
      ) : (
        <ul className="dishes">
          {items.map((item) => {
            const people = PARTICIPANTS.filter((person) => item.assignedTo.includes(person.id))
            const gradient = people.length
              ? `linear-gradient(135deg, ${people.map((person) => person.color).join(', ')})`
              : 'transparent'
            const share = itemShare(item)

            return (
              <li key={item.id}>
                <button
                  type="button"
                  className={`dish ${people.length ? 'is-split' : ''}`}
                  style={{ borderColor: people[0]?.color ?? '#2a3344', backgroundImage: gradient }}
                  onClick={() => onAssignDish(item.id)}
                >
                  <span className="dish-name">{item.name}</span>
                  <span className="dish-price">{formatUah(item.price)}</span>
                  <span className="dish-meta">
                    {people.length === 0
                      ? 'Никто не выбран'
                      : `${people.map((person) => person.name).join(', ')} · по ${formatUah(share)}`}
                  </span>
                  <span className="dish-dots">
                    {people.map((person) => (
                      <i key={person.id} style={{ background: person.color }} />
                    ))}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {ocrText && (
        <details className="ocr-stub">
          <summary>Текст OCR (заглушка)</summary>
          <pre>{ocrText}</pre>
        </details>
      )}

      <button className="primary-btn" type="button" onClick={onGoSummary} disabled={assigned === 0}>
        <Users size={18} />
        К итогам
      </button>
    </div>
  )
}

function SummaryScreen({
  totals,
  items,
}: {
  totals: {
    spent: Record<ParticipantId, number>
    billTotal: number
    hostSpent: number
    debts: (Participant & { amount: number })[]
  }
  items: ReceiptItem[]
}) {
  return (
    <div className="app-summary">
      <div className="status-bar">9:41</div>
      <h1>Итоги</h1>
      <p className="lead">Вы оплатили счёт. Должники могут перевести свою долю.</p>

      <div className="total-card">
        <span>Чек целиком</span>
        <strong>{formatUah(totals.billTotal)}</strong>
        <small>Ваша доля: {formatUah(totals.hostSpent)}</small>
      </div>

      {items.length === 0 || totals.debts.length === 0 ? (
        <div className="empty">Нет долгов — распределите блюда на экране 2</div>
      ) : (
        <ul className="debts">
          {totals.debts.map((person) => {
            const mono = buildMonoLink(person.amount)
            const privat = buildPrivatLink(person.amount, PRIVAT_CARD)
            return (
              <li key={person.id} className="debt-card" style={{ '--p': person.color } as CSSProperties}>
                <div className="debt-head">
                  <span className="avatar mini">{person.short}</span>
                  <div>
                    <strong>{person.name}</strong>
                    <small>должен вам {formatUah(person.amount)}</small>
                  </div>
                </div>
                <div className="pay-row">
                  <a className="pay-btn mono" href={mono} target="_blank" rel="noreferrer">
                    На Mono
                  </a>
                  <a className="pay-btn privat" href={privat} target="_blank" rel="noreferrer">
                    На Приват
                  </a>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

const appStyles = `
.device-screen.app-screen {
  background: #0b1220;
  color: #e8eef8;
  overflow: hidden;
  position: relative;
  font-family: Inter, system-ui, sans-serif;
}
.app-home, .app-receipt, .app-summary {
  height: 100%;
  padding: 14px 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-sizing: border-box;
}
.status-bar { font-size: 11px; opacity: .55; text-align: right; }
h1 { margin: 0; font-size: 22px; letter-spacing: -.02em; }
.lead { margin: 0; color: #9aa8bd; font-size: 13px; line-height: 1.4; }
.primary-btn, .ghost-btn {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  border: 0; border-radius: 14px; padding: 12px 14px; font-weight: 600; cursor: pointer;
}
.primary-btn { background: #5eead4; color: #042f2e; }
.primary-btn:disabled { opacity: .4; cursor: not-allowed; }
.ghost-btn { background: #1a2436; color: #d5deea; }
.camera-overlay {
  position: absolute; inset: 0; background: #05080f; display: flex; flex-direction: column;
  align-items: center; justify-content: space-between; padding: 28px 18px 24px; z-index: 5;
}
.viewfinder {
  width: 100%; flex: 1; margin: 12px 0; border-radius: 18px; position: relative;
  background: radial-gradient(circle at 50% 40%, #1c283c, #070b12 70%);
  overflow: hidden;
}
.corner { position: absolute; width: 22px; height: 22px; border: 2px solid #5eead4; }
.corner.tl { top: 14px; left: 14px; border-right: 0; border-bottom: 0; }
.corner.tr { top: 14px; right: 14px; border-left: 0; border-bottom: 0; }
.corner.bl { bottom: 14px; left: 14px; border-right: 0; border-top: 0; }
.corner.br { bottom: 14px; right: 14px; border-left: 0; border-top: 0; }
.scan-line {
  position: absolute; left: 10%; right: 10%; height: 2px; background: #5eead4;
  box-shadow: 0 0 12px #5eead4; animation: scan 1.1s linear infinite;
}
@keyframes scan { from { top: 18%; } to { top: 78%; } }
.scan-ok {
  position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 8px; background: rgba(6,24,20,.55); color: #5eead4; font-weight: 700;
}
.camera-hint { color: #9aa8bd; font-size: 13px; }
.camera-actions { display: flex; align-items: center; justify-content: space-between; width: 100%; }
.shutter {
  width: 64px; height: 64px; border-radius: 50%; border: 4px solid #e8eef8; background: #fff;
  box-shadow: 0 0 0 4px #111827;
}
.shutter:disabled { opacity: .4; }
.avatars { display: flex; gap: 10px; }
.avatar {
  flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px;
  background: #121a28; border: 2px solid #243044; border-radius: 16px; color: #e8eef8;
  padding: 10px 6px; cursor: pointer;
}
.avatar span, .avatar.mini {
  width: 36px; height: 36px; border-radius: 50%; display: grid; place-items: center;
  background: #1f2a3d; font-weight: 700;
}
.avatar.is-on { border-color: var(--p); box-shadow: 0 0 0 2px color-mix(in srgb, var(--p) 35%, transparent); }
.avatar.is-on span { background: var(--p); color: #081018; }
.avatar small { font-size: 11px; opacity: .8; }
.dishes { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; overflow: auto; }
.dish {
  width: 100%; text-align: left; border-radius: 14px; border: 1px solid #243044;
  background: #121a28; color: #e8eef8; padding: 12px; display: grid;
  grid-template-columns: 1fr auto; gap: 2px 8px; cursor: pointer;
}
.dish.is-split { color: #081018; }
.dish-name { font-weight: 700; }
.dish-price { font-weight: 700; }
.dish-meta { grid-column: 1 / -1; font-size: 11px; opacity: .85; }
.dish-dots { grid-column: 1 / -1; display: flex; gap: 4px; }
.dish-dots i { width: 8px; height: 8px; border-radius: 50%; display: block; }
.empty {
  background: #121a28; border-radius: 14px; padding: 16px; color: #9aa8bd;
  display: flex; gap: 8px; align-items: center; font-size: 13px;
}
.ocr-stub { background: #121a28; border-radius: 12px; padding: 8px 10px; color: #9aa8bd; font-size: 12px; }
.ocr-stub pre { white-space: pre-wrap; margin: 8px 0 0; color: #d5deea; }
.total-card {
  background: #121a28; border-radius: 16px; padding: 14px; display: flex; flex-direction: column; gap: 4px;
}
.total-card strong { font-size: 24px; }
.debts { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; overflow: auto; }
.debt-card { background: #121a28; border-radius: 16px; padding: 12px; border-left: 4px solid var(--p); }
.debt-head { display: flex; gap: 10px; align-items: center; margin-bottom: 10px; }
.avatar.mini { background: var(--p); color: #081018; font-weight: 700; }
.debt-head small { display: block; color: #9aa8bd; }
.pay-row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.pay-btn {
  text-align: center; text-decoration: none; border-radius: 12px; padding: 10px 8px;
  font-size: 13px; font-weight: 700;
}
.pay-btn.mono { background: #111827; color: #5eead4; border: 1px solid #2dd4bf; }
.pay-btn.privat { background: #1d4ed8; color: #fff; }
`
