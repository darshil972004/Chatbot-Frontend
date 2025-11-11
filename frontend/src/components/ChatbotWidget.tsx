import { useEffect, useMemo, useRef, useState } from 'react'
import { ChatMessage, sendMessageToBot } from '../api/chatbot'

function uid() {
  return Math.random().toString(36).slice(2)
}

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(true)
  // Add propertyGroup to ChatMessage type via type assertion
  const [messages, setMessages] = useState<(ChatMessage & { propertyGroup?: { id: string; header?: string; items: any[] } })[]>([
    { id: uid(), role: 'bot', text: 'Hello,Welcome to Crighton Properties.' },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const [pendingOptions, setPendingOptions] = useState<string[]>([])
  const [pendingMode, setPendingMode] = useState<'button-list' | 'dropdown' | 'form' | null>(null)
  const [selectedOption, setSelectedOption] = useState('')
  const [expandedGroups, setExpandedGroups] = useState<string[]>([])

  const userId = useMemo(() => {
    const key = 'cp_chat_user_id'
    const existing = localStorage.getItem(key)
    if (existing) return existing
    const v = `${uid()}`
    // localStorage.setItem(key, v)
    return v
  }, [])
  // for scroll to bottom on new message
  // useEffect(() => {
  //   listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  // }, [messages])

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
    // If backend returned properties, attach to bot message
    const propsArr = (res.data as any)?.properties
    let botMsg: ChatMessage & { propertyGroup?: { id: string; header?: string; items: any[] } } = { id: uid(), role: 'bot', text: botText }
    if (Array.isArray(propsArr) && propsArr.length > 0) {
      botMsg.propertyGroup = { id: uid(), header: botText, items: propsArr }
    }
    setMessages((m) => [...m, botMsg])

    // If backend asks for button input next
    const rType = (res.data as any)?.response_type
    let optsRaw = (res.data as any)?.options || [];
    let opts: any[] = [];
    let formHeading = '';
    // Handle 'form' or object-based options_json
    if ((rType === 'form' || rType === 'Get User Details' || Array.isArray(optsRaw) && optsRaw.length > 0 && typeof optsRaw[0] === 'object')) {
      try {
        // If options_json is a string, parse it
        if (typeof optsRaw === 'string') optsRaw = JSON.parse(optsRaw);
      } catch {}
      opts = optsRaw;
      formHeading = (res.data as any)?.label || (res.data as any)?.question_text || 'User Details';
      setPendingOptions(opts);
      setPendingMode('form');
      (window as any).cpFormHeading = formHeading; // for passing heading to FormOptions
    } else if ((rType === 'button-list' || rType === 'dropdown') && Array.isArray(optsRaw) && optsRaw.length > 0) {
      setPendingOptions(optsRaw);
      setPendingMode(rType);
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
        {messages.map((m) => {
          // Check if this is a user message that looks like a form submission (contains ": ")
          if (m.role === 'user' && m.text.includes(':')) {
            // Parse the message into key-value pairs
            const fields = m.text.split(',').map(f => {
              const [label, ...rest] = f.split(':');
              return { label: label?.trim(), value: rest.join(':').trim() };
            });
            return (
              <div key={m.id} className="cp-msg cp-msg--user">
                <div className="cp-form-summary" style={{ background: '#f6f6f9', borderRadius: 8, padding: 12, margin: '8px 0', boxShadow: '0 1px 4px #eee' }}>
                  {fields.map((field, idx) => (
                    <div key={idx} style={{ marginBottom: 10 }}>
                      <span style={{ fontWeight: 500, minWidth: 120, display: 'block' }}>{field.label}:</span>
                      <span style={{ marginLeft: 0, display: 'block', wordBreak: 'break-word', whiteSpace: 'pre-line', color: '#333', paddingLeft: 8 }}>{field.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          }
          return (
            <div key={m.id}>
              <div className={`cp-msg ${m.role === 'user' ? 'cp-msg--user' : 'cp-msg--bot'}`}>{m.text}</div>
              {/* If this bot message has propertyGroup, render properties here */}
              {m.role === 'bot' && m.propertyGroup && (
                (() => {
                  const group = m.propertyGroup;
                  const isExpanded = expandedGroups.includes(group.id);
                  const itemsToShow = isExpanded ? group.items : group.items.slice(0, 5);
                  const hasMore = group.items.length > 5 && !isExpanded;
                  return (
                    <div className="cp-prop-group">
                      {/* {group.header && <div className="cp-prop-header">{group.header}</div>} */}
                      <div className="cp-prop-grid">
                        {itemsToShow.map((p, idx) => {
                          // ...existing code...
                          const currency = p?.varCurrency ;
                          const title = p?.varTitle || p?.title || p?.varName || 'Property';
                          const priceRaw = p?.decPrice ?? p?.price ?? p?.varAskingPrice ?? p?.asking_price;
                          const price = typeof priceRaw === 'number' ? priceRaw : Number(priceRaw || 0);
                          const priceText = price ? `${price.toLocaleString()}` : '';
                          const mls = p?.varMLS || p?.mls || p?.mls_no || '';
                          const beds = p?.intBeds ?? p?.beds ?? p?.num_beds;
                          const baths = p?.intBaths ?? p?.baths ?? p?.num_baths;
                          const desc = p?.txtDescription || p?.description || '';
                          const img = p?.varFeaturedImage || p?.image || p?.thumbnail || '';
                          const location = p?.city_name || p?.location || '';
                          const sendDetails = () => {
                            const m = String(mls || '').replace(/[^0-9]/g, '');
                            if (m) {
                              handleSend(m);
                            }
                          };
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
                              {priceText && <div className="cp-prop-price">{currency} {priceText}</div>}
                              {mls && <div className="cp-prop-mls">MLS#: {mls}</div>}
                              <div className="cp-prop-meta">
                                {beds ? <span>🛏️ {beds} beds</span> : null}
                                {baths ? <span>🚿 {baths} baths</span> : null}
                                {location ? <span>📍 {location}</span> : null}
                              </div>
                              {/* {desc && <div className="cp-prop-desc">{String(desc).slice(0, 110)}...</div>} */}
                              <button className="cp-prop-btn" onClick={sendDetails}>View Details</button>
                            </div>
                          );
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
                  );
                })()
              )}
            </div>
          );
        })}
        {loading && <div className="cp-msg cp-msg--bot">Typing…</div>}
        {!loading && pendingOptions.length > 0 && pendingMode === 'button-list' && (
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
        {/* Form mode for pending options */}
        {!loading && pendingOptions.length > 0 && pendingMode === 'form' && (
          <FormOptions
            options={pendingOptions}
            heading={(window as any).cpFormHeading}
            onSubmit={async (formValues: Record<string, string>) => {
              const msg = Object.entries(formValues)
                .map(([k, v]) => `${k}: ${v}`)
                .join(', ');
              await handleSend(msg);
            }}
          />
        )}
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

// FormOptions component for form mode
function FormOptions({ options, heading, onSubmit }: { options: any[]; heading?: string; onSubmit: (values: Record<string, string>) => void }) {
  // Support both string and object options
  const opts = Array.isArray(options) ? options : [];
  const [values, setValues] = useState<Record<string, string>>(() => Object.fromEntries(opts.map((o: any) => [o.label || o, ''])));
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Validation helpers
  function getInputProps(opt: any) {
    const label = typeof opt === 'string' ? opt : opt.label;
    const type = typeof opt === 'string' ? 'text' : (opt.type || 'text');
    const required = typeof opt === 'string' ? true : !!opt.required;
    let pattern, autoComplete, placeholder, validate;
    const lower = label.toLowerCase();
    if (type === 'email' || lower.includes('email')) {
      pattern = undefined; autoComplete = 'email'; placeholder = 'Enter your email'; validate = (v: string) => /.+@.+\..+/.test(v) ? '' : 'Invalid email';
    } else if (type === 'tel' || lower.includes('phone')) {
      pattern = '[0-9\-\+\s]{10,}'; autoComplete = 'tel'; placeholder = 'Enter your phone number'; validate = (v: string) => /^[0-9\-\+\s]{10,}$/.test(v) ? '' : 'Invalid phone number';
    } else if (type === 'number' || lower.includes('income')) {
      pattern = undefined; autoComplete = 'off'; placeholder = 'Enter number'; validate = (v: string) => /^\d+$/.test(v) ? '' : 'Invalid number';
    } else if (type === 'date' || lower.includes('dob')) {
      pattern = undefined; autoComplete = 'bday'; placeholder = 'Select date'; validate = (v: string) => v ? '' : 'Required';
    } else if (type === 'textarea') {
      pattern = undefined; autoComplete = 'off'; placeholder = 'Enter address'; validate = (_: string) => '';
    } else if (type === 'text' || lower.includes('name')) {
      pattern = "[A-Za-z\s\.'-]{2,}"; autoComplete = 'name'; placeholder = 'Enter your name'; validate = (v: string) => /^[A-Za-z\s\.'-]{2,}$/.test(v) ? '' : 'Invalid name';
    } else {
      pattern = undefined; autoComplete = undefined; placeholder = ''; validate = (_: string) => '';
    }
    return { type, pattern, autoComplete, placeholder, validate, required };
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, opt: any) => {
    const label = typeof opt === 'string' ? opt : opt.label;
    setValues((prev) => ({ ...prev, [label]: e.target.value }));
    const { validate } = getInputProps(opt);
    setErrors((prev) => ({ ...prev, [label]: validate(e.target.value) }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validate all fields before submit
    let valid = true;
    const newErrors: Record<string, string> = {};
    opts.forEach((opt: any) => {
      const label = typeof opt === 'string' ? opt : opt.label;
      const { validate, required } = getInputProps(opt);
      const err = required ? validate(values[label]) : '';
      if (err) valid = false;
      newErrors[label] = err;
    });
    setErrors(newErrors);
    if (!valid) return;
    onSubmit(values);
  };

  return (
    <form className="cp-form-options" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {heading && <div style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>{heading}</div>}
      {opts.map((opt: any) => {
        const label = typeof opt === 'string' ? opt : opt.label;
        const { type, pattern, autoComplete, placeholder, required } = getInputProps(opt);
        return (
          <label key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <span>{label}{required ? ' *' : ''}</span>
            {type === 'textarea' ? (
              <textarea
                className="cp-input"
                value={values[label]}
                onChange={(e) => handleChange(e, opt)}
                required={required}
                autoComplete={autoComplete}
                placeholder={placeholder}
                style={{ minHeight: 60 }}
              />
            ) : (
              <input
                className="cp-input"
                value={values[label]}
                onChange={(e) => handleChange(e, opt)}
                required={required}
                type={type}
                pattern={pattern}
                autoComplete={autoComplete}
                placeholder={placeholder}
              />
            )}
            {errors[label] && <span style={{ color: 'red', fontSize: 12 }}>{errors[label]}</span>}
          </label>
        );
      })}
      <button className="cp-option" type="submit" style={{ alignSelf: 'flex-end' }}>
        Submit
      </button>
    </form>
  );
}


