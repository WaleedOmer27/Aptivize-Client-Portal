import { useState, useEffect, useRef, useCallback } from 'react';
import { FiSend, FiMessageSquare, FiRefreshCw } from 'react-icons/fi';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import Spinner from '../components/Spinner';
import { useAuth } from '../context/AuthContext';

// ─── Helper: relative time label ──────────────────────────────────────────────
function timeLabel(isoString) {
  const d    = new Date(isoString);
  const now  = new Date();
  const diff = (now - d) / 1000; // seconds

  if (diff < 60)          return 'Just now';
  if (diff < 3600)        return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)       return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diff < 86400 * 7)  {
    const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    return days[d.getDay()];
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

// ─── Avatar initials ──────────────────────────────────────────────────────────
function initials(name = '') {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

const Messages = () => {
  const { api, user } = useAuth();

  const [threads, setThreads]           = useState([]);
  const [activeThread, setActiveThread] = useState(null); // { other_id, other_name }
  const [messages, setMessages]         = useState([]);
  const [body, setBody]                 = useState('');
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending]           = useState(false);
  const [threadsError, setThreadsError] = useState('');

  const messagesEndRef = useRef(null);

  // ── Fetch thread list ───────────────────────────────────────────────────────
  const fetchThreads = useCallback(async () => {
    try {
      const res = await api.get('/messages');
      setThreads(res.data.threads ?? []);
      setThreadsError('');

      // Auto-select first thread if none selected
      if (!activeThread && res.data.threads?.length > 0) {
        const first = res.data.threads[0];
        setActiveThread({ other_id: first.other_id, other_name: first.other_name });
      }
    } catch {
      setThreadsError('Could not load conversations. Please refresh.');
    } finally {
      setLoadingThreads(false);
    }
  }, [api, activeThread]);

  useEffect(() => { fetchThreads(); }, [api]); // eslint-disable-line

  // ── Fetch conversation when active thread changes ────────────────────────────
  useEffect(() => {
    if (!activeThread) return;

    setLoadingMessages(true);
    api
      .get(`/messages/${activeThread.other_id}`)
      .then((res) => {
        setMessages(res.data.messages ?? []);
        // Re-fetch threads to update unread counts
        fetchThreads();
      })
      .catch((err) => console.error('Failed to load conversation:', err))
      .finally(() => setLoadingMessages(false));
  }, [activeThread?.other_id]); // eslint-disable-line

  // ── Auto-scroll to latest message ───────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Send message ─────────────────────────────────────────────────────────────
  const handleSend = async (e) => {
    e?.preventDefault();
    if (!body.trim() || !activeThread) return;

    setSending(true);
    try {
      const res = await api.post('/messages', {
        receiverId: activeThread.other_id,
        body: body.trim(),
      });
      // Optimistically append
      setMessages((prev) => [
        ...prev,
        { ...res.data.message, sender_name: user.name, sender_id: user.id },
      ]);
      setBody('');
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--color-text)' }}>Messages</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>Your conversations with the Aptivize team.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" style={{ height: 'calc(100vh - 220px)' }}>
        {/* ── Thread List ─────────────────────────────────────────────────── */}
        <Card className="overflow-y-auto p-0">
          <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--color-border)' }}>
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--color-text-subtle)' }}>
              Conversations
            </p>
            <button
              onClick={fetchThreads}
              className="rounded-lg p-1 transition-colors hover:opacity-70"
              title="Refresh"
              style={{ color: 'var(--color-text-subtle)' }}
            >
              <FiRefreshCw size={13} />
            </button>
          </div>

          {loadingThreads ? (
            <div className="flex items-center justify-center h-32"><Spinner /></div>
          ) : threadsError ? (
            <div className="flex flex-col items-center justify-center h-32 gap-2 px-4 text-center">
              <p className="text-sm" style={{ color: '#ef4444' }}>{threadsError}</p>
            </div>
          ) : threads.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 gap-2">
              <FiMessageSquare size={24} style={{ color: 'var(--color-text-subtle)' }} />
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>No conversations yet</p>
            </div>
          ) : (
            threads.map((t) => {
              const isActive = activeThread?.other_id === t.other_id;
              return (
                <div
                  key={t.other_id}
                  onClick={() => setActiveThread({ other_id: t.other_id, other_name: t.other_name })}
                  className="flex items-start gap-3 p-4 cursor-pointer transition-colors"
                  style={{
                    borderBottom: '1px solid var(--color-border)',
                    background: isActive ? 'var(--color-primary-light)' : 'transparent',
                  }}
                >
                  <div className="w-9 h-9 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {initials(t.other_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <p className="font-semibold text-sm truncate" style={{ color: 'var(--color-text)' }}>{t.other_name}</p>
                      <span className="text-[11px] flex-shrink-0 ml-2" style={{ color: 'var(--color-text-subtle)' }}>
                        {timeLabel(t.last_time)}
                      </span>
                    </div>
                    <p className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>{t.last_message}</p>
                  </div>
                  {t.unread_count > 0 && (
                    <span className="w-5 h-5 rounded-full bg-[var(--color-primary)] text-white text-[10px] flex items-center justify-center flex-shrink-0 font-bold">
                      {t.unread_count}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </Card>

        {/* ── Chat Area ───────────────────────────────────────────────────── */}
        <Card className="lg:col-span-2 flex flex-col p-0" style={{ minHeight: 0 }}>
          {!activeThread ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <FiMessageSquare size={36} style={{ color: 'var(--color-text-subtle)' }} />
              <p style={{ color: 'var(--color-text-muted)' }}>Select a conversation</p>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="flex items-center gap-3 p-4 border-b flex-shrink-0" style={{ borderColor: 'var(--color-border)' }}>
                <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white text-sm font-bold">
                  {initials(activeThread.other_name)}
                </div>
                <div>
                  <p className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>{activeThread.other_name}</p>
                  <p className="text-[11px]" style={{ color: 'var(--color-accent-green)' }}>Aptivize Team</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 p-4 flex flex-col gap-3 overflow-y-auto">
                {loadingMessages ? (
                  <div className="flex items-center justify-center h-full"><Spinner /></div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>No messages yet. Say hello!</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.sender_id === user.id;
                    return (
                      <div key={msg.id} className={`flex gap-2 ${isMe ? 'justify-end' : ''}`}>
                        {!isMe && (
                          <div className="w-7 h-7 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-1">
                            {initials(msg.sender_name)}
                          </div>
                        )}
                        <div className="max-w-xs lg:max-w-sm">
                          <div
                            className={`rounded-xl px-3 py-2 text-sm ${isMe ? 'rounded-tr-none text-white' : 'rounded-tl-none'}`}
                            style={{
                              background: isMe ? 'var(--color-primary)' : 'var(--color-surface-2)',
                              color: isMe ? '#fff' : 'var(--color-text)',
                            }}
                          >
                            {msg.body}
                          </div>
                          <p className={`text-[10px] mt-0.5 ${isMe ? 'text-right' : ''}`} style={{ color: 'var(--color-text-subtle)' }}>
                            {timeLabel(msg.created_at)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form
                onSubmit={handleSend}
                className="p-4 border-t flex items-center gap-3 flex-shrink-0"
                style={{ borderColor: 'var(--color-border)' }}
              >
                <Input
                  placeholder="Type a message… (Enter to send)"
                  className="flex-1"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <Button
                  type="submit"
                  icon={<FiSend size={14} />}
                  size="md"
                  disabled={sending || !body.trim()}
                >
                  {sending ? 'Sending…' : 'Send'}
                </Button>
              </form>
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Messages;

