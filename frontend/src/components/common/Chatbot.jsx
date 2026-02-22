import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Loader2, ChevronDown } from 'lucide-react';
import api from '../../services/api';

const WELCOME = `Hello! I'm your AMIS Assistant 🎓\n\nI can help you with:\n• Navigating the portal\n• Your registered courses & timetable\n• How timetable generation works\n• Any questions about the system\n\nHow can I help you today?`;

const SUGGESTIONS = [
  'How do I register for a course?',
  'Show my registered courses',
  'How to drop a course?',
  'How does timetable generation work?',
  'Where can I view my timetable?',
];

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-3 py-2">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-2 h-2 rounded-full"
          style={{
            background: '#d4991f',
            animation: `chatDot 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

function Message({ msg }) {
  const isBot = msg.role === 'bot';
  return (
    <div className={`flex gap-2 ${isBot ? 'items-start' : 'items-end flex-row-reverse'}`}>
      {/* Avatar */}
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
        style={{
          background: isBot
            ? 'linear-gradient(135deg,#6b1a24,#8c2233)'
            : 'rgba(212,153,31,0.2)',
          border: isBot ? 'none' : '1px solid rgba(212,153,31,0.5)',
        }}
      >
        {isBot ? (
          <Bot size={14} style={{ color: '#e8b83a' }} />
        ) : (
          <User size={14} style={{ color: '#d4991f' }} />
        )}
      </div>

      {/* Bubble */}
      <div
        className="max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap"
        style={
          isBot
            ? {
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(212,153,31,0.15)',
                color: 'rgba(255,255,255,0.88)',
                borderTopLeftRadius: '4px',
              }
            : {
                background: 'linear-gradient(135deg,#6b1a24,#8c2233)',
                color: '#f5de92',
                borderTopRightRadius: '4px',
              }
        }
      >
        {msg.text}
      </div>
    </div>
  );
}

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([{ role: 'bot', text: WELCOME }]);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [unread, setUnread] = useState(0);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [open]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, loading]);

  const sendMessage = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;

    setShowSuggestions(false);
    setInput('');
    setHistory((h) => [...h, { role: 'user', text: msg }]);
    setLoading(true);

    try {
      const { data } = await api.post('/chatbot/message', {
        message: msg,
        history: history.slice(-10),
      });
      if (data.success === false) {
        setHistory((h) => [...h, { role: 'bot', text: `⚠️ ${data.message}` }]);
      } else {
        const reply = data.reply || 'Sorry, I could not get a response.';
        setHistory((h) => [...h, { role: 'bot', text: reply }]);
        if (!open) setUnread((u) => u + 1);
      }
    } catch (err) {
      // err from api.js interceptor: { message, status, data }
      const errMsg =
        err.data?.message ||
        err.message ||
        'Something went wrong. Please try again.';
      setHistory((h) => [...h, { role: 'bot', text: `⚠️ ${errMsg}` }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* ── CSS keyframe for dots ── */}
      <style>{`
        @keyframes chatDot {
          0%,80%,100% { transform: scale(0.7); opacity: 0.4; }
          40%          { transform: scale(1.1); opacity: 1; }
        }
        @keyframes chatSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      {/* ── Floating toggle button ── */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-transform hover:scale-110 active:scale-95"
        style={{
          background: 'linear-gradient(135deg,#6b1a24 0%,#8c2233 50%,#a0341f 100%)',
          border: '2px solid rgba(212,153,31,0.5)',
          boxShadow: '0 4px 24px rgba(107,26,36,0.6), 0 0 0 4px rgba(212,153,31,0.08)',
        }}
        title="Open AI Assistant"
      >
        {open ? (
          <ChevronDown size={22} style={{ color: '#f5de92' }} />
        ) : (
          <MessageCircle size={22} style={{ color: '#f5de92' }} />
        )}
        {!open && unread > 0 && (
          <span
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
            style={{ background: '#d4991f', color: '#1c0508' }}
          >
            {unread}
          </span>
        )}
      </button>

      {/* ── Chat window ── */}
      {open && (
        <div
          className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 rounded-2xl overflow-hidden flex flex-col"
          style={{
            height: '480px',
            background: 'linear-gradient(160deg,#1c0508 0%,#2d0a10 100%)',
            border: '1px solid rgba(212,153,31,0.3)',
            boxShadow: '0 12px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(212,153,31,0.08) inset',
            animation: 'chatSlideUp 0.25s ease',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center gap-3 px-4 py-3 shrink-0"
            style={{
              background: 'linear-gradient(90deg,#4a1019 0%,#8c2233 60%,#4a1019 100%)',
              borderBottom: '1px solid rgba(212,153,31,0.25)',
            }}
          >
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(212,153,31,0.15)', border: '1px solid rgba(212,153,31,0.4)' }}
            >
              <Bot size={16} style={{ color: '#e8b83a' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm tracking-wide truncate" style={{ color: '#f5de92' }}>
                AMIS Assistant
              </p>
              <p className="text-[10px]" style={{ color: 'rgba(212,153,31,0.6)' }}>
                Powered by Gemini AI
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
              style={{ color: 'rgba(245,222,146,0.5)' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#f5de92')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(245,222,146,0.5)')}
            >
              <X size={14} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
            {history.map((msg, i) => (
              <Message key={i} msg={msg} />
            ))}
            {loading && (
              <div className="flex items-start gap-2">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: 'linear-gradient(135deg,#6b1a24,#8c2233)' }}
                >
                  <Bot size={14} style={{ color: '#e8b83a' }} />
                </div>
                <div
                  className="rounded-2xl"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(212,153,31,0.15)',
                    borderTopLeftRadius: '4px',
                  }}
                >
                  <TypingDots />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions */}
          {showSuggestions && (
            <div className="px-3 pb-2 space-y-1.5 shrink-0">
              <p className="text-[10px] font-bold tracking-widest uppercase" style={{ color: 'rgba(212,153,31,0.5)' }}>
                Quick questions
              </p>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    className="text-[11px] px-2.5 py-1 rounded-full transition-colors"
                    style={{
                      background: 'rgba(212,153,31,0.08)',
                      border: '1px solid rgba(212,153,31,0.25)',
                      color: 'rgba(245,222,146,0.75)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(212,153,31,0.18)';
                      e.currentTarget.style.color = '#f5de92';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(212,153,31,0.08)';
                      e.currentTarget.style.color = 'rgba(245,222,146,0.75)';
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div
            className="px-3 pb-3 pt-2 shrink-0"
            style={{ borderTop: '1px solid rgba(212,153,31,0.15)' }}
          >
            <div
              className="flex items-end gap-2 rounded-xl px-3 py-2"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(212,153,31,0.2)',
              }}
            >
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything..."
                className="flex-1 bg-transparent resize-none outline-none text-sm leading-relaxed"
                style={{
                  color: 'rgba(255,255,255,0.88)',
                  maxHeight: '80px',
                  caretColor: '#d4991f',
                }}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = e.target.scrollHeight + 'px';
                }}
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all"
                style={{
                  background:
                    input.trim() && !loading
                      ? 'linear-gradient(135deg,#d4991f,#e8b83a)'
                      : 'rgba(212,153,31,0.15)',
                  transform: input.trim() && !loading ? 'scale(1)' : 'scale(0.9)',
                }}
              >
                {loading ? (
                  <Loader2 size={14} className="animate-spin" style={{ color: '#d4991f' }} />
                ) : (
                  <Send size={13} style={{ color: input.trim() ? '#1c0508' : 'rgba(212,153,31,0.4)' }} />
                )}
              </button>
            </div>
            <p className="text-[9px] text-center mt-1.5" style={{ color: 'rgba(212,153,31,0.35)' }}>
              Press Enter to send · Shift+Enter for new line
            </p>
          </div>
        </div>
      )}
    </>
  );
}
