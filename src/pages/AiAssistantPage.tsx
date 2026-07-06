import { useMemo, useRef, useState, type FormEvent } from 'react';
import { Bot, Loader2, Send, Sparkles } from 'lucide-react';
import { usePageTitle } from '../hooks/usePageTitle';
import { generateAiChatReply, type AiChatMessage } from '../services/propertyApi';

const quickPrompts = [
  'Tóm tắt quy trình chăm sóc khách đang tìm nhà dưới 6 tỷ.',
  'Gợi ý nội dung ghi chú cho khách mua cần nhà hẻm xe hơi.',
  'Viết mô tả ngắn cho nguồn nhà mới, pháp lý rõ, phù hợp ở và đầu tư.',
];

export default function AiAssistantPage() {
  usePageTitle('Trợ lý AI | Sổ Đỏ Vạn Phúc');
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const [messages, setMessages] = useState<AiChatMessage[]>([
    {
      sender: 'assistant',
      text: 'Anh/chị cần hỗ trợ viết mô tả, gợi ý tag, soạn ghi chú chăm khách hoặc tóm tắt nhu cầu thì nhập trực tiếp ở đây.',
      timestamp: new Date().toISOString(),
    },
  ]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const usableMessages = useMemo(() => messages.filter((message) => message.text.trim()), [messages]);

  const sendMessage = async (text: string) => {
    const content = text.trim();
    if (!content || loading) return;

    const userMessage: AiChatMessage = {
      sender: 'me',
      text: content,
      timestamp: new Date().toISOString(),
    };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setDraft('');
    setError('');
    setLoading(true);

    try {
      const result = await generateAiChatReply({ lang: 'vi', messages: nextMessages });
      const reply = result.data?.reply?.trim() || '';
      if (!result.ok || !reply) throw new Error(result.error || 'AI chưa trả lời được lúc này.');
      setMessages((current) => [
        ...current,
        { sender: 'assistant', text: reply, timestamp: new Date().toISOString() },
      ]);
    } catch {
      setError('Trợ lý AI chưa phản hồi được. Vui lòng thử lại sau ít phút.');
    } finally {
      setLoading(false);
      window.setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    void sendMessage(draft);
  };

  return (
    <div className="mx-auto max-w-4xl pb-24">
      <section className="mb-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
        <div className="flex items-start gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-red-50 text-[#c40012]">
            <Bot className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#c40012]">Trợ lý AI</p>
            <h1 className="mt-1 text-2xl font-black text-[#25202a]">Hỗ trợ nội dung và vận hành</h1>
            <p className="mt-1 text-sm font-medium leading-6 text-[#667085]">
              Dùng để viết mô tả, gợi ý tag, soạn ghi chú chăm khách và chuẩn hóa nội dung nguồn nhà.
            </p>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-gray-100">
        <div className="border-b border-gray-100 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-black text-[#25202a]">
            <Sparkles className="h-4 w-4 text-[#c40012]" />
            Gợi ý nhanh
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => void sendMessage(prompt)}
                disabled={loading}
                className="min-h-12 rounded-2xl border border-red-100 bg-red-50 px-3 text-left text-xs font-bold leading-5 text-[#7a353b] transition hover:border-[#c40012] disabled:opacity-60"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        <div className="max-h-[52vh] min-h-[340px] space-y-3 overflow-y-auto bg-[#fff8f2] p-4">
          {usableMessages.map((message, index) => {
            const mine = message.sender === 'me';
            return (
              <div key={`${message.timestamp}-${index}`} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[92%] rounded-2xl px-4 py-3 text-sm font-semibold leading-6 sm:max-w-[78%] ${
                  mine ? 'bg-[#c40012] text-white' : 'bg-white text-[#25202a] ring-1 ring-gray-100'
                }`}>
                  {message.text}
                </div>
              </div>
            );
          })}
          {loading ? (
            <div className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-[#667085] ring-1 ring-gray-100">
              <Loader2 className="h-4 w-4 animate-spin text-[#c40012]" />
              Đang soạn trả lời...
            </div>
          ) : null}
        </div>

        {error ? <div className="mx-4 mt-3 rounded-2xl bg-red-50 px-3 py-2 text-sm font-bold text-[#c40012]">{error}</div> : null}

        <form onSubmit={handleSubmit} className="grid gap-3 border-t border-gray-100 p-4 sm:grid-cols-[minmax(0,1fr)_auto]">
          <textarea
            ref={inputRef}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={2}
            placeholder="Nhập yêu cầu cho AI..."
            className="min-h-[52px] w-full resize-none rounded-2xl border border-gray-200 px-3 py-3 text-sm font-semibold leading-5 outline-none focus:border-[#c40012]"
          />
          <button
            type="submit"
            disabled={loading || !draft.trim()}
            className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-2xl bg-[#c40012] px-5 text-sm font-black text-white disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Gửi
          </button>
        </form>
      </section>
    </div>
  );
}
