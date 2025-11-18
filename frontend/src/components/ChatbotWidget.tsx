import { useEffect, useMemo, useRef, useState } from 'react'
import { ChatMessage as BaseChatMessage, sendMessageToBot } from '../api/chatbot'

// Extend ChatMessage to support optional blog property (array)
type BlogInfo = { blog_id: string; title: string; blog_url: string };
type ChatMessage = BaseChatMessage & { propertyGroup?: { id: string; header?: string; items: any[] }, blog?: BlogInfo[] };

function uid() {
  return Math.random().toString(36).slice(2)
}

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(true)
  // Persist chat history in localStorage
  const LOCAL_KEY = 'cp_chatbot_history';
  const [messages, setMessages] = useState<(ChatMessage & { propertyGroup?: { id: string; header?: string; items: any[] } })[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });
  const [isInitialized, setIsInitialized] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const [pendingOptions, setPendingOptions] = useState<string[]>([]);
  const [pendingMode, setPendingMode] = useState<'button-list' | 'dropdown' | 'form' | null>(null);
  const [selectedOption, setSelectedOption] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(messages));
    } catch {}
  }, [messages]);

  // Manage multiple conversations
  const CONVOS_KEY = 'cp_chatbot_convos';
  const [showConvos, setShowConvos] = useState(false);
  const [convos, setConvos] = useState<{ id: string; userId: string; messages: any[]; created: number }[]>([]);
  const [activeConvoId, setActiveConvoId] = useState<string | null>(null);

  function handleShowConvos() {
    // Load all conversations from localStorage
    let all = [];
    try {
      all = JSON.parse(localStorage.getItem(CONVOS_KEY) || '[]');
    } catch {}
    setConvos(all);
    setShowConvos(true);
  }

  function handleCloseConvos() {
    setShowConvos(false);
  }

  function handleSelectConvo(convo: { id: string; userId: string; messages: any[]; created: number }) {
    setActiveConvoId(convo.id);
    setUserId(convo.userId);
    setMessages(convo.messages);
    localStorage.setItem('cp_chat_user_id', convo.userId);
    localStorage.setItem(LOCAL_KEY, JSON.stringify(convo.messages));
    setShowConvos(false);
    setPendingOptions([]);
    setPendingMode(null);
    setSelectedOption('');
    setExpandedGroups([]);
    setInput('');
  }


  const [userId, setUserId] = useState(() => {
    const key = 'cp_chat_user_id';
    const existing = localStorage.getItem(key);
    if (existing) return existing;
    const v = `${uid()}`;
    localStorage.setItem(key, v)
    return v;
  });
  // for scroll to bottom on new message
  // Save conversation to history only if there is a user message
  useEffect(() => {
    // Only save if there is at least one user message
    const hasUserMsg = messages.some(m => m.role === 'user');
    if (hasUserMsg) {
      let all = [];
      try {
        all = JSON.parse(localStorage.getItem(CONVOS_KEY) || '[]');
      } catch {}
      // Use a unique id for each conversation
      const convoId = `${userId}_${messages[0]?.id || ''}`;
      // Remove any with same convoId
      all = all.filter((c: any) => c.id !== convoId);
      all.push({ id: convoId, userId, messages, created: Date.now() });
      localStorage.setItem(CONVOS_KEY, JSON.stringify(all));
    }
  }, [messages, userId]);
  // useEffect(() => {
  //   listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  // }, [messages])

  // Fetch initial message from backend on mount or when starting new chat
  useEffect(() => {
    if (!isInitialized && messages.length === 0) {
      const fetchInitialMessage = async () => {
        setLoading(true);
        try {
          const res = await sendMessageToBot(userId, 'init');
          if (res.success && res.data) {
            const rType = res.data.response_type;
            const optsRaw = res.data.options || [];
            let opts: any[] = [];
            let formHeading = '';
            // If options_json is a string, parse it
            try {
              if (typeof optsRaw === 'string') opts = JSON.parse(optsRaw);
              else opts = optsRaw;
            } catch { opts = optsRaw; }
            formHeading = (res.data && (res.data as any).label) || (res.data && (res.data as any).question_text) || 'User Details';

            // If initial message includes options for form, dropdown, or button-list
            if ((rType === 'form' || rType === 'Get User Details' || (Array.isArray(opts) && opts.length > 0 && typeof opts[0] === 'object'))) {
              setPendingOptions(opts);
              setPendingMode('form');
              (window as any).cpFormHeading = formHeading;
            } else if ((rType === 'button-list' || rType === 'dropdown') && Array.isArray(opts) && opts.length > 0) {
              setPendingOptions(opts);
              setPendingMode(rType);
            }

            // Always show initial message text
            const initialMsg: ChatMessage = { 
              id: uid(), 
              role: 'bot', 
              text: res.data.result || ''
            };
            setMessages([initialMsg]);
            localStorage.setItem(LOCAL_KEY, JSON.stringify([initialMsg]));

            // Auto-send "defult" for initial message if needed
            if (rType === 'message') {
              setLoading(false);
              await handleSend('defult', true);
              return;
            }
          }
        } catch (err) {
          console.error('Failed to fetch initial message:', err);
          const fallbackMsg: ChatMessage = { 
            id: uid(), 
            role: 'bot', 
            text: 'Hello, Welcome to Crighton Properties.' 
          };
          setMessages([fallbackMsg]);
          localStorage.setItem(LOCAL_KEY, JSON.stringify([fallbackMsg]));
        }
        setLoading(false);
        setIsInitialized(true);
      };
      fetchInitialMessage();
    }
  }, [userId, isInitialized]);

  async function handleSend(customText?: string, skipAutoRespond: boolean = false) {
    const trimmed = (customText ?? input).trim();
    if (!trimmed) return;
    
    // Allow auto-respond to bypass loading check
    if (!skipAutoRespond && loading) return;

    // Only add user message if it's not an auto-response
    if (!skipAutoRespond) {
      const userMsg: ChatMessage = { id: uid(), role: 'user', text: trimmed };
      setMessages((m) => {
        const updated = [...m, userMsg];
        try { localStorage.setItem(LOCAL_KEY, JSON.stringify(updated)); } catch {}
        return updated;
      });
    }

    setInput('');
    setPendingOptions([]);
    setPendingMode(null);
    setSelectedOption('');
    setLoading(true);

    const res = await sendMessageToBot(userId, trimmed);
    setLoading(false);

    if (!('success' in res) || res.success !== true) {
      setMessages((m) => {
        const failedMsg: ChatMessage & { propertyGroup?: { id: string; header?: string; items: any[] } } = { id: uid(), role: 'bot', text: 'Failed to fetch' };
        const updated = [...m, failedMsg];
        try { localStorage.setItem(LOCAL_KEY, JSON.stringify(updated)); } catch {}
        return updated;
      });
      return;
    }

    const rTypeEarly = (res.data as any)?.response_type;
    
    // Handle RAG type response
    if ((res.data as any)?.type === 'RAG') {
      const ragResult = res.data as any;
      // blogs can be an array or object
      let blogs: BlogInfo[] = [];
      if (Array.isArray(ragResult.blogs) && ragResult.blogs.length > 0) {
        blogs = ragResult.blogs;
      } else if (ragResult.blogs && typeof ragResult.blogs === 'object' && ragResult.blogs.title) {
        blogs = [ragResult.blogs];
      }
      setMessages((m) => {
        const updated = [
          ...m,
          {
            id: uid(),
            role: 'bot' as const,
            text: ragResult.answer || ragResult.result || '',
            blog: blogs.length > 0 ? blogs : undefined
          }
        ];
        try { localStorage.setItem(LOCAL_KEY, JSON.stringify(updated)); } catch {}
        return updated;
      });
      return;
    }

    const botText = res.data?.result ?? '…';
    // If backend returned properties, attach to bot message
    const propsArr = (res.data as any)?.properties;
    let botMsg: ChatMessage & { propertyGroup?: { id: string; header?: string; items: any[] } } = { id: uid(), role: 'bot', text: botText };
    if (Array.isArray(propsArr) && propsArr.length > 0) {
      botMsg.propertyGroup = { id: uid(), header: botText, items: propsArr };
    }
    setMessages((m) => {
      const updated = [...m, botMsg];
      try { localStorage.setItem(LOCAL_KEY, JSON.stringify(updated)); } catch {}
      return updated;
    });

    // Auto-send if response_type is 'message' - send hidden "defult" message and show next result
    if (rTypeEarly === 'message' && !skipAutoRespond) {
      const autoText = 'defult';
      await handleSend(autoText, true);
    }

    // If backend asks for button input next
    const rType = (res.data as any)?.response_type;
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

  function handleNewChat() {
    // Before starting new chat, save current conversation if it has user messages
    const hasUserMsg = messages.some(m => m.role === 'user');
    if (hasUserMsg) {
      let all = [];
      try {
        all = JSON.parse(localStorage.getItem(CONVOS_KEY) || '[]');
      } catch {}
      const convoId = `${userId}_${messages[0]?.id || ''}`;
      all = all.filter((c: any) => c.id !== convoId);
      all.push({ id: convoId, userId, messages, created: Date.now() });
      localStorage.setItem(CONVOS_KEY, JSON.stringify(all));
    }
    // Generate new user id and reset chat
    const newUserId = uid();
    setUserId(newUserId);
    localStorage.setItem('cp_chat_user_id', newUserId);
    setMessages([]);
    localStorage.setItem(LOCAL_KEY, JSON.stringify([]));
    setIsInitialized(false);
    setPendingOptions([]);
    setPendingMode(null);
    setSelectedOption('');
    setExpandedGroups([]);
    setInput('');
  }

  // Add a stub for handleLiveSupport
  function handleLiveSupport() {
    // Send a message to tech support via the chatbot
    const techSupportMsg = 'tech support';
    handleSend(techSupportMsg);
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
          // Show form summary for user message
          if (m.role === 'user' && m.text.includes(':')) {
            const fields = m.text.split(',').map(f => {
              const [label, ...rest] = f.split(':');
              return { label: label?.trim(), value: rest.join(':').trim() };
            });
            return (
              <div key={m.id} className="cp-msg cp-msg--user">
                <div className="cp-form-summary">
                  {fields.map((field, idx) => (
                    <div key={idx} className="cp-form-summary-row">
                      <span className="cp-form-summary-label">{field.label}:</span>
                      <span className="cp-form-summary-value">{field.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          }
            // Show RAG blog info after bot answer
          if (m.role === 'bot' && m.blog && Array.isArray(m.blog)) {
            const blogsArr = m.blog;
            return (
              <div key={m.id}>
                <div className="cp-msg cp-msg--bot">{m.text}</div>
                <div className="cp-blog-info">
                  {blogsArr.length > 0 ? (
                    blogsArr.map((blog, idx) => {
                      const isBlogValid = blog && blog.title && blog.blog_url;
                      return isBlogValid ? (
                        <span className="cp-blog-title" key={blog.blog_id || idx} style={{ display: 'block', marginBottom: 4 }}>
                          <span className="cp-blog-label">Blog:</span>&nbsp;
                          <a
                            className="cp-blog-name"
                            href={blog.blog_url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {blog.title}
                          </a>
                        </span>
                      ) : (
                        <span className="cp-blog-error" key={idx}>Blog info not fetched completely from backend.</span>
                      );
                    })
                  ) : (
                    <span className="cp-blog-error">Blog info not fetched completely from backend.</span>
                  )}
                </div>
              </div>
            );
          }
          // ...existing code...
          return (
            <div key={m.id}>
              <div className={`cp-msg ${m.role === 'user' ? 'cp-msg--user' : 'cp-msg--bot'}`}>{m.text}</div>
              {/* ...existing code... */}
              {m.role === 'bot' && m.propertyGroup && (
                (() => {
                  // ...existing code...
                  const group = m.propertyGroup;
                  const isExpanded = expandedGroups.includes(group.id);
                  const itemsToShow = isExpanded ? group.items : group.items.slice(0, 5);
                  const hasMore = group.items.length > 5 && !isExpanded;
                  return (
                    <div className="cp-prop-group">
                      {/* ...existing code... */}
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
                            const m = String(mls || '').replace(/\D/g, '');
                            if (m) {
                              const message = `Provide the details for the property listed under MLS number ${m}`;
                              handleSend(message);
                            } else {
                              console.warn('Invalid or missing MLS ID.');
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
                              {/* ...existing code... */}
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

            <div className="cp-chatbot__footer cp-footer-col">
              <div className="cp-footer-row">
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
              <div className="cp-footer-row">
                <button
                  className="cp-chatbot__newchat cp-footer-btn"
                  onClick={handleNewChat}
                  aria-label="Start new chat"
                  type="button"
                >
                  Start New Chat
                </button>
                <button
                  className="cp-chatbot__showconvos cp-footer-btn"
                  onClick={handleShowConvos}
                  aria-label="Chat History"
                  type="button"
                >
                  Chat History
                </button>
              </div>
              <div className="cp-footer-row">
                <button
                  className="cp-chatbot__livesupport-btn "
                  onClick={handleLiveSupport}
                  aria-label = "Live Support"
                  type="button"
                  >
                    Connect To Live Support
                </button>
              </div>
            </div>
      {/* Modal for all conversations */}
      {showConvos && (
        <div className="cp-modal-overlay">
          <div className="cp-modal">
            <div className="cp-modal-title">All Conversations</div>
            <button className="cp-modal-close" onClick={handleCloseConvos}>×</button>
            <div className="cp-modal-list">
              {convos.length === 0 && <div className="cp-modal-empty">No previous conversations found.</div>}
              {convos.map((c) => (
                <div key={c.id} className={`cp-modal-item${activeConvoId === c.id ? ' cp-modal-item--active' : ''}`}>
                  <div className="cp-modal-item-title">Conversation {c.id.slice(0, 8)}</div>
                  <div className="cp-modal-item-date">Started: {new Date(c.created).toLocaleString()}</div>
                  <button className="cp-modal-view-btn" onClick={() => handleSelectConvo(c)}>View Conversation</button>
                  <div className="cp-modal-item-preview">
                    {c.messages.slice(0, 2).map((m: any, idx: number) => (
                      <div key={idx} className="cp-modal-msg-preview">
                        <span className="cp-modal-msg-role">{m.role === 'user' ? 'User:' : 'Bot:'}</span> {m.text.length > 60 ? m.text.slice(0, 60) + '...' : m.text}
                      </div>
                    ))}
                    {c.messages.length > 2 && <div className="cp-modal-msg-more">...{c.messages.length - 2} more messages</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
          </div>
        </div>
      )}
    </>
  )
}

// FormOptions component for form mode
function FormOptions({ options, heading, onSubmit }: { options: any[]; heading?: string; onSubmit: (values: Record<string, string>) => void }) {
  const opts = Array.isArray(options) ? options : [];
  const [values, setValues] = useState<Record<string, string>>(() => Object.fromEntries(opts.map((o: any) => [o.label || o, ''])));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const displayHeading = heading?.trim().length ? heading : 'Tell us how we can help';

  function getInputProps(opt: any) {
    const label = typeof opt === 'string' ? opt : opt.label;
    const type = typeof opt === 'string' ? 'text' : (opt.type || 'text');
    const required = typeof opt === 'string' ? true : !!opt.required;
    const placeholderFromConfig = typeof opt === 'object' ? opt.placeholder : '';
    const description = typeof opt === 'object' ? opt.description || opt.help_text : '';
    let pattern: string | undefined;
    let autoComplete: string | undefined;
    let placeholder = placeholderFromConfig || 'Type your answer';
    let validate: (value: string) => string = (value: string) =>
      required && !value.trim() ? 'This field is required' : '';
    const lower = label.toLowerCase();
    if (type === 'email' || lower.includes('email')) {
      placeholder = placeholderFromConfig || 'you@example.com';
      autoComplete = 'email';
      validate = (v: string) => /.+@.+\..+/.test(v) ? '' : 'Enter a valid email address';
    } else if (type === 'tel' || lower.includes('phone')) {
      placeholder = placeholderFromConfig || '+1 (555) 123-4567';
      autoComplete = 'tel';
      pattern = '[0-9\\-\\+\\s]{10,}';
      validate = (v: string) => /^[0-9\-\+\s]{10,}$/.test(v) ? '' : 'Enter a valid phone number';
    } else if (type === 'number' || lower.includes('budget') || lower.includes('income') || lower.includes('price')) {
      placeholder = placeholderFromConfig || 'Enter amount';
      autoComplete = 'off';
      validate = (v: string) => /^\d+(\.\d+)?$/.test(v) ? '' : 'Numbers only';
    } else if (type === 'date' || lower.includes('dob')) {
      placeholder = placeholderFromConfig || '';
      autoComplete = 'bday';
      validate = (v: string) => v ? '' : 'This field is required';
    } else if (type === 'textarea' || lower.includes('message') || lower.includes('details')) {
      placeholder = placeholderFromConfig || 'Add any extra details here...';
      autoComplete = 'off';
      validate = (_: string) => '';
    } else if (type === 'text' || lower.includes('name')) {
      placeholder = placeholderFromConfig || 'Type your answer';
      autoComplete = lower.includes('name') ? 'name' : 'off';
      pattern = !lower.includes('address') ? "[A-Za-z\\s\\.'-]{2,}" : undefined;
      validate = (v: string) => {
        if (!lower.includes('address') && pattern) return /^[A-Za-z\s\.'-]{2,}$/.test(v) ? '' : 'Letters only';
        return v.trim() ? '' : 'This field is required';
      };
    } else {
      placeholder = placeholderFromConfig || 'Type your answer';
      autoComplete = 'off';
    }
    return { type, pattern, autoComplete, placeholder, validate, required, description };
  }

  const validateField = (label: string, opt: any, value: string) => {
    const { validate, required } = getInputProps(opt);
    const err = required ? validate(value) : '';
    setErrors((prev) => ({ ...prev, [label]: err }));
    return err;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, opt: any) => {
    const label = typeof opt === 'string' ? opt : opt.label;
    const value = e.target.value;
    setValues((prev) => ({ ...prev, [label]: value }));
    validateField(label, opt, value);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>, opt: any) => {
    const label = typeof opt === 'string' ? opt : opt.label;
    validateField(label, opt, e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let valid = true;
    const newErrors: Record<string, string> = {};
    opts.forEach((opt: any) => {
      const label = typeof opt === 'string' ? opt : opt.label;
      const value = values[label];
      const err = validateField(label, opt, value);
      if (err) valid = false;
      newErrors[label] = err;
    });
    setErrors(newErrors);
    if (!valid) return;
    onSubmit(values);
  };

  return (
    <form className="cp-form-options" onSubmit={handleSubmit}>
      <div className="cp-form-card">
        <div className="cp-form-header">
          <span className="cp-form-pill">Quick Form</span>
          <h3 className="cp-form-title">{displayHeading}</h3>
          <p className="cp-form-subtitle">Share a few details so our concierge team can tailor suggestions just for you.</p>
        </div>
        <div className="cp-form-body">
          {opts.map((opt: any) => {
            const label = typeof opt === 'string' ? opt : opt.label;
            const { type, pattern, autoComplete, placeholder, required, description } = getInputProps(opt);
            const value = values[label] ?? '';
            return (
              <label key={label} className={`cp-form-field${errors[label] ? ' cp-form-field--error' : ''}`}>
                <span className="cp-form-label">
                  {label}
                  {required ? <span className="cp-form-required">*</span> : null}
                </span>
                {description ? <span className="cp-form-description">{description}</span> : null}
                {type === 'textarea' ? (
                  <textarea
                    className="cp-form-input cp-form-input--textarea"
                    value={value}
                    onChange={(e) => handleChange(e, opt)}
                    onBlur={(e) => handleBlur(e, opt)}
                    required={required}
                    autoComplete={autoComplete}
                    placeholder={placeholder}
                  />
                ) : (
                  <input
                    className="cp-form-input"
                    value={value}
                    onChange={(e) => handleChange(e, opt)}
                    onBlur={(e) => handleBlur(e, opt)}
                    required={required}
                    type={type === 'textarea' ? 'text' : type}
                    pattern={pattern}
                    autoComplete={autoComplete}
                    placeholder={placeholder}
                  />
                )}
                {errors[label] && <span className="cp-form-error">{errors[label]}</span>}
              </label>
            );
          })}
        </div>
        <div className="cp-form-footer">
          <button className="cp-form-submit" type="submit">
            Submit Details
            <span className="cp-form-submit-icon">→</span>
          </button>
        </div>
      </div>
    </form>
  );
}


