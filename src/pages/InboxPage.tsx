import { useState, useEffect, useRef, useCallback } from 'react';
import { usePageTitle } from '../hooks/usePageTitle';
import {
  Send,
  MessageSquare,
  CheckCheck,
  Loader2,
  Trash2,
  Headset,
} from 'lucide-react';
import PageShell from '../components/PageShell';
import { useLanguage } from '../contexts/LanguageContext';
import { generateAiChatReply } from '../services/propertyApi';
import { getUserItem, setUserItem, removeUserItem } from '../utils/userStorage';
import type { Language } from '../types/types';

/* Custom Gemini AI icon — cleaner than generic Bot */
const GeminiIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C12 2 14.5 7 17 9.5S22 12 22 12s-5 2.5-5 5-5 5-5 5-2.5-5-5-5S2 12 2 12s5-2.5 5-5 5-5 5-5Z" fill="currentColor"/>
  </svg>
);

/* ──────────────────────────── Types ──────────────────────────── */

interface Message {
  id: string;
  sender: string; // 'me' or 'AI Assistant'
  text: string;
  timestamp: string; // ISO string
}

/* ──────────────────────────── Constants ──────────────────────── */

const STORAGE_KEY = 'gf_inbox_messages';

const createWelcomeMessage = (text: string): Message => ({
  id: 'mai-welcome',
  sender: 'AI Assistant',
  text,
  timestamp: new Date().toISOString(),
});

/* ──────────────────────────── Helpers ────────────────────────── */

function messageTime(isoStr: string, lang: Language): string {
  return new Date(isoStr).toLocaleTimeString(lang === 'vi' ? 'vi-VN' : 'en-US', { hour: 'numeric', minute: '2-digit', hour12: lang !== 'vi' });
}

function uid(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/* ──────────────────────────── Gemini API ─────────────────────── */

async function callBackendAI(messages: Message[], lang: Language, fallbackNotConfigured: string, fallbackConnection: string): Promise<string> {
  const result = await generateAiChatReply({
    lang,
    messages: messages.slice(-10).map((msg) => ({
      sender: msg.sender,
      text: msg.text,
      timestamp: msg.timestamp,
    })),
  });

  if (result.ok && result.data?.reply) {
    return result.data.reply;
  }

  if ((result.error || '').toLowerCase().includes('not configured')) {
    return fallbackNotConfigured;
  }

  return fallbackConnection;

  // Build conversation history for context
  const chatHistory = messages.slice(-10).map((msg) => ({
    role: msg.sender === 'me' ? 'user' : 'model',
    parts: [{ text: msg.text }],
  }));

  const contents = [
    { role: 'user', parts: [{ text: 'Backend AI proxy handles the system prompt.' }] },
    { role: 'model', parts: [{ text: lang === 'vi' ? 'Đã hiểu. Tôi là So Do Van Phuc AI Assistant, sẵn sàng hỗ trợ các câu hỏi về bất động sản.' : 'Understood. I am So Do Van Phuc AI Assistant, ready to help with real estate questions.' }] },
    ...chatHistory,
  ];

  void contents;
}

/* ──────────────────────────── Component ──────────────────────── */

const InboxPage = () => {
  const { t, lang } = useLanguage();
  usePageTitle(t('inbox.title'));
  const welcomeMessage = createWelcomeMessage(t('inbox.welcome'));
  /* ── State ── */
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const stored = getUserItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Message[];
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch { /* ignore */ }
    return [welcomeMessage];
  });
  const [draft, setDraft] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /* ── Persist ── */
  useEffect(() => {
    setUserItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  /* ── Auto-scroll ── */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /* ── Focus input on mount ── */
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 200);
  }, []);

  /* ── Actions ── */
  const clearChat = useCallback(() => {
    setMessages([createWelcomeMessage(t('inbox.welcome'))]);
    removeUserItem(STORAGE_KEY);
  }, [t]);

  const sendMessage = useCallback(async () => {
    if (!draft.trim() || aiLoading) return;
    const text = draft.trim();
    const userMsg: Message = { id: uid(), sender: 'me', text, timestamp: new Date().toISOString() };
    
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setDraft('');

    // Call backend AI proxy. Provider keys stay in backend/config/config.php only.
    setAiLoading(true);
    try {
      const reply = await callBackendAI(updatedMessages, lang, t('inbox.notConfigured'), t('inbox.connectionIssue'));
      const aiMsg: Message = {
        id: uid(),
        sender: 'AI Assistant',
        text: reply,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      const errorMsg: Message = {
        id: uid(),
        sender: 'AI Assistant',
        text: t('inbox.error'),
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    }
    setAiLoading(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [draft, aiLoading, messages, lang, t]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
  const suggestions = [
    t('inbox.suggestionTrends'),
    t('inbox.suggestionCities'),
    t('inbox.suggestionMortgage'),
    t('inbox.suggestionList'),
  ];

  /* ──────────────────────────── Render ───────────────────────── */
  return (
    <PageShell raw>
      <div className="flex flex-col" style={{ height: 'calc(100vh - 64px)' }}>
        {/* Hero / Header */}
        <div className="relative overflow-hidden flex-shrink-0">
          <div className="absolute inset-0 bg-gradient-to-b from-[#15151D] via-[#0a0a10] to-[#030405]" />
          <div
            className="absolute inset-0 opacity-30"
            style={{
              background:
                'radial-gradient(ellipse at 30% 20%, rgba(184,135,23,0.15), transparent 50%), radial-gradient(ellipse at 70% 60%, rgba(82,64,180,0.1), transparent 50%)',
            }}
          />
          <div className="relative z-10 px-4 sm:px-6 lg:px-8 max-w-[900px] mx-auto pt-6 sm:pt-8 pb-4 sm:pb-5 min-w-0">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#B88717] to-[#F6D37A] flex items-center justify-center flex-shrink-0 shadow-[0_0_20px_rgba(246,211,122,0.2)]">
                <GeminiIcon className="h-6 w-6 text-[#030405]" />
              </div>
              <div className="flex-1">
                <h1
                  className="hero-gold-text font-extrabold leading-tight break-words flex items-center gap-2"
                  style={{ fontSize: 'clamp(22px, 4vw, 30px)' }}
                >
                  {t('inbox.title')}
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#B88717]/20 text-[#F6D37A] font-bold normal-case">
                    Gemini AI
                  </span>
                </h1>
                <p className="text-[#A7ABB6] text-[13px] leading-relaxed flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                  {t('inbox.onlineExpert')}
                </p>
              </div>
              {/* Talk to agent button */}
              <a
                href="https://wa.me/84912886794?text=Feedback%20-%20Contributions%20-%20Opinions%20-%20Complaints%20-%20Contact%20of%20Advertising"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#B88717]/30 bg-[#B88717]/10 text-[#F6D37A] hover:bg-[#B88717]/20 text-[12px] font-medium transition-all cursor-pointer flex-shrink-0"
                title={t('inbox.talkAgent')}
              >
                <Headset className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t('inbox.agent')}</span>
              </a>
              {/* Clear chat button */}
              <button
                onClick={clearChat}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/[0.085] text-[#7D8291] hover:text-red-400 hover:border-red-400/30 text-[12px] font-medium transition-all cursor-pointer flex-shrink-0"
                title={t('inbox.clearHistory')}
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t('common.clear')}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto min-h-0 px-4 sm:px-6 py-4 max-w-[900px] w-full mx-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
          {messages.map((msg, idx) => {
            const isMe = msg.sender === 'me';
            // Date separator
            const prevMsg = idx > 0 ? messages[idx - 1] : null;
            const msgDate = new Date(msg.timestamp).toLocaleDateString();
            const prevDate = prevMsg ? new Date(prevMsg.timestamp).toLocaleDateString() : null;
            const showDate = msgDate !== prevDate;

            return (
              <div key={msg.id}>
                {showDate && (
                  <div className="flex items-center justify-center py-3">
                    <span className="text-[10px] text-[#7D8291]/60 bg-[#15151D] px-3 py-1 rounded-full border border-white/[0.04]">
                      {new Date(msg.timestamp).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                )}
                <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-3`}>
                  {/* AI Avatar */}
                  {!isMe && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#B88717] to-[#F6D37A] flex items-center justify-center flex-shrink-0 mr-2 mt-1 shadow-[0_0_10px_rgba(246,211,122,0.15)]">
                      <GeminiIcon className="h-4 w-4 text-[#030405]" />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 ${
                      isMe
                        ? 'bg-[#B88717]/20 border border-[#B88717]/20 rounded-br-md'
                        : 'bg-[#15151D] border border-white/[0.06] rounded-bl-md'
                    }`}
                  >
                    {!isMe && (
                      <p className="text-[11px] font-semibold text-[#B88717]/70 mb-1 flex items-center gap-1">
                        {t('inbox.assistantName')}
                      </p>
                    )}
                    <p className="text-[13px] text-[#E4E6EB] leading-relaxed whitespace-pre-wrap break-words">
                      {msg.text}
                    </p>
                    <div
                      className={`flex items-center gap-1.5 mt-1.5 ${
                        isMe ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <span className="text-[10px] text-[#7D8291]">
                        {messageTime(msg.timestamp, lang)}
                      </span>
                      {isMe && (
                        <CheckCheck className="h-3.5 w-3.5 text-[#B88717]/60" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {/* AI typing indicator */}
          {aiLoading && (
            <div className="flex justify-start mb-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#B88717] to-[#F6D37A] flex items-center justify-center flex-shrink-0 mr-2 mt-1">
                <GeminiIcon className="h-4 w-4 text-[#030405]" />
              </div>
              <div className="bg-[#15151D] border border-white/[0.06] rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2">
                <Loader2 className="h-4 w-4 text-[#F6D37A] animate-spin" />
                <span className="text-[13px] text-[#7D8291]">{t('inbox.aiThinking')}</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="flex-shrink-0 px-4 sm:px-6 py-3 border-t border-white/[0.06] bg-[#0a0a12]/60">
          <div className="flex items-center gap-2 max-w-[900px] mx-auto">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                placeholder={t('inbox.askPlaceholder')}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={aiLoading}
                className="w-full px-4 py-3 rounded-xl bg-[#15151D] border border-white/[0.085] text-[#F5F0E6] text-[14px] placeholder:text-[#7D8291] focus:outline-none focus:border-[#B88717]/40 transition-colors disabled:opacity-50"
              />
            </div>
            <button
              onClick={sendMessage}
              disabled={!draft.trim() || aiLoading}
              className={`p-3 rounded-xl flex-shrink-0 transition-all cursor-pointer ${
                draft.trim() && !aiLoading
                  ? 'bg-[#B88717] hover:bg-[#D4A020] text-[#030405] shadow-[0_4px_16px_rgba(184,135,23,0.3)]'
                  : 'bg-white/[0.04] text-[#7D8291] cursor-not-allowed'
              }`}
            >
              {aiLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Empty state hint */}
        {messages.length <= 1 && (
          <div className="flex-shrink-0 pb-4 px-4">
            <div className="max-w-[900px] mx-auto grid grid-cols-2 sm:grid-cols-4 gap-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => { setDraft(suggestion); inputRef.current?.focus(); }}
                  className="px-3 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] text-[#A7ABB6] text-[12px] text-left hover:bg-white/[0.04] hover:border-[#B88717]/20 hover:text-[#F6D37A] transition-all cursor-pointer leading-snug"
                >
                  <MessageSquare className="h-3 w-3 mb-1 text-[#B88717]/40" />
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
};

export default InboxPage;
