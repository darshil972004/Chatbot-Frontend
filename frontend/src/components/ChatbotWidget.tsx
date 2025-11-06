import { useEffect, useMemo, useRef, useState } from 'react'
import { ChatMessage, sendMessageToBot } from '../api/chatbot'

function uid() {
  return Math.random().toString(36).slice(2)
}

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(true)
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: uid(), role: 'bot', text: 'Hi' },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const [pendingOptions, setPendingOptions] = useState<string[]>([])
  const [pendingMode, setPendingMode] = useState<'buttons' | 'dropdown' | null>(null)
  const [selectedOption, setSelectedOption] = useState('')
  const [propertyGroups, setPropertyGroups] = useState<{ id: string; header?: string; items: any[] }[]>([])
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]) // <-- Add this line

  const userId = useMemo(() => {
    const key = 'cp_chat_user_id'
    const existing = localStorage.getItem(key)
    if (existing) return existing
    const v = `${uid()}`
    // localStorage.setItem(key, v)
    return v
  }, [])

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  async function handleSend(customText?: string) {
    const trimmed = (customText ?? input).trim()
    if (!trimmed || loading) return

    const userMsg: ChatMessage = { id: uid(), role: 'user', text: trimmed }
    setMessages((m) => [...m, userMsg])
    setInput('')
    setPendingOptions([])
    setPendingMode(null)
    setSelectedOption('')
    setLoading(true)

    const res = await sendMessageToBot(userId, trimmed)
    setLoading(false)

    if (!('success' in res) || res.success !== true) {
      setMessages((m) => [...m, { id: uid(), role: 'bot', text: 'Failed to fetch' }])
      return
    }

    const botText = res.data?.result ?? '…'
    setMessages((m) => [...m, { id: uid(), role: 'bot', text: botText }])

    // If backend asks for button input next
    const rType = (res.data as any)?.response_type
    const opts = ((res.data as any)?.options || []) as string[]
    if ((rType === 'buttons' || rType === 'dropdown') && Array.isArray(opts) && opts.length > 0) {
      setPendingOptions(opts)
      setPendingMode(rType)
    }

    // If backend returned properties, render cards below the message
    const propsArr = (res.data as any)?.properties
    if (Array.isArray(propsArr) && propsArr.length > 0) {
      setPropertyGroups((g) => [...g, { id: uid(), header: botText, items: propsArr }])
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleSend()
  }

  return (
    <>
      {!isOpen && (
        <button className="cp-launcher" onClick={() => setIsOpen(true)} aria-label="Open chat" type="button">
          <span className="cp-launcher__icon">💬</span>
        </button>
      )}
      {isOpen && (
        <div className="cp-chatbot-container">
          <div className="cp-chatbot">
            <div className="cp-chatbot__header">
              <div className="cp-chatbot__title">Crighton Properties</div>
              <div className="cp-chatbot__subtitle">AI PROPERTY ASSISTAN</div>
              <button className="cp-chatbot__close" onClick={() => setIsOpen(false)} aria-label="Close" type="button">
                ×
              </button>
            </div>

            <div className="cp-chatbot__body" ref={listRef}>
        {messages.map((m) => (
          <div key={m.id} className={`cp-msg ${m.role === 'user' ? 'cp-msg--user' : 'cp-msg--bot'}`}>
            {m.text}
          </div>
        ))}
        {loading && <div className="cp-msg cp-msg--bot">Typing…</div>}
        {!loading && pendingOptions.length > 0 && pendingMode === 'buttons' && (
          <div className="cp-options">
            {pendingOptions.map((opt) => (
              <button key={opt} className="cp-option" onClick={() => handleSend(opt)}>
                {opt}
              </button>
            ))}
          </div>
        )}
        {!loading && pendingOptions.length > 0 && pendingMode === 'dropdown' && (
          <div className="cp-options cp-options--row">
            <select
              className="cp-select"
              value={selectedOption}
              onChange={(e) => setSelectedOption(e.target.value)}
            >
              <option value="" disabled>
                Select an option
              </option>
              {pendingOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <button
              className="cp-option"
              onClick={() => selectedOption && handleSend(selectedOption)}
              disabled={!selectedOption}
            >
              OK
            </button>
          </div>
        )}
        {propertyGroups.map((group) => {
          const isExpanded = expandedGroups.includes(group.id)
          const itemsToShow = isExpanded ? group.items : group.items.slice(0, 5)
          const hasMore = group.items.length > 5 && !isExpanded
          return (
            <div key={group.id} className="cp-prop-group">
              {/* {group.header && <div className="cp-prop-header">{group.header}</div>} */}
              <div className="cp-prop-grid">
                {itemsToShow.map((p, idx) => {
                  console.log('Property item', p)
                  const title = p?.varTitle || p?.title || p?.varName || 'Property'
                  const priceRaw = p?.decPrice ?? p?.price ?? p?.varAskingPrice ?? p?.asking_price
                  const price = typeof priceRaw === 'number' ? priceRaw : Number(priceRaw || 0)
                  const priceText = price ? `CI$${price.toLocaleString()}` : ''
                  const mls = p?.varMLS || p?.mls || p?.mls_no || ''
                  const beds = p?.intBedrooms ?? p?.beds ?? p?.num_beds
                  const baths = p?.intBathrooms ?? p?.baths ?? p?.num_baths
                  const desc = p?.txtShortDescription || p?.description || ''
                  const img = p?.varFeaturedImage || p?.image || p?.thumbnail || ''
                  const sendDetails = () => {
                    const m = String(mls || '').replace(/[^0-9]/g, '')
                    if (m) {
                      handleSend(m)
                    }
                  }
                  return (
                    <div key={idx} className="cp-prop-card">
                      <div className="cp-prop-badge">{idx + 1}</div>
                      <div className="cp-prop-image">
                        {img ? (
                          <img src={img} alt={title} />
                        ) : (
                          <div className="cp-prop-image--ph">COMING SOON IMAGE</div>
                        )}
                      </div>
                      <div className="cp-prop-title">{title}</div>
                      {priceText && <div className="cp-prop-price">{priceText}</div>}
                      {mls && <div className="cp-prop-mls">MLS#: {mls}</div>}
                      <div className="cp-prop-meta">
                        {beds ? <span>{beds} bed</span> : null}
                        {baths ? <span>{baths} bath</span> : null}
                      </div>
                      {desc && <div className="cp-prop-desc">{String(desc).slice(0, 110)}...</div>}
                      <button className="cp-prop-btn" onClick={sendDetails}>View Details</button>
                    </div>
                  )
                })}
              </div>
              {hasMore && (
                <button
                  className="cp-prop-btn cp-prop-btn--more"
                  onClick={() => setExpandedGroups((prev) => [...prev, group.id])}
                  style={{ margin: '16px auto', display: 'block' }}
                >
                  More Properties
                </button>
              )}
            </div>
          )
        })}
            </div>

            <div className="cp-chatbot__footer">
              <input
                className="cp-input"
                placeholder="Type your property search request..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button
                className="cp-send"
                onClick={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                disabled={loading}
                aria-label="Send"
                type="button"
              >
                →
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}


