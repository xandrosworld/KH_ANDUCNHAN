import { useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Bot, Loader2, Send, Sparkles } from 'lucide-react';
import PageShell from '../components/PageShell';
import { usePageTitle } from '../hooks/usePageTitle';
import { generateAiChatReply } from '../services/propertyApi';
import type { AiChatMessage } from '../services/propertyApi';

const quickPrompts = [
  'Viết giúp tôi mô tả ngắn cho nhà hẻm xe hơi, 5 tỷ, có thể kinh doanh nhỏ.',
  'Gợi ý những tag nên nhập cho căn nhà mặt tiền có dòng tiền cho thuê.',
  'Tóm tắt quy trình chăm sóc khách đang tìm nhà dưới 6 tỷ.',
];

const SvpAiAssistantPage = () => {
  usePageTitle('Trợ lý AI');
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const [messages, setMessages] = useState<AiChatMessage[]>([
    {
      sender: 'assistant',
      text: 'Anh/chị cần hỗ trợ viết mô tả nhà, gợi ý tag, soạn nội dung chăm khách hoặc tóm tắt nhu cầu thì nhập trực tiếp ở đây.',
      timestamp: new Date().toISOString(),
    },
  ]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const usableMessages = useMemo(
    () => messages.filter((message) => message.text.trim()),
    [messages],
  );

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
      const result = await generateAiChatReply({
        lang: 'vi',
        messages: nextMessages,
      });

      if (!result.ok || !result.data?.reply) {
        throw new Error(result.error || 'AI chưa trả lời được lúc này.');
      }

      const reply = result.data.reply.trim();
      setMessages((current) => [
        ...current,
        {
          sender: 'assistant',
          text: reply,
          timestamp: new Date().toISOString(),
        },
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
    <PageShell maxWidth="max-w-[1040px]">
      <div className="space-y-5">
        <section className="rounded-lg border border-white/10 bg-white/[0.035] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.16em] text-[#F6D37A]">
                <Sparkles className="h-4 w-4" />
                Hỗ trợ nội dung
              </div>
              <h1 className="mt-3 text-2xl font-bold text-[#F5F0E6] sm:text-3xl">Trợ lý AI</h1>
              <p className="mt-2 max-w-2xl text-[14px] leading-6 text-[#A7ABB6]">
                Dùng để viết mô tả, gợi ý tag, soạn ghi chú chăm khách và chuẩn hóa nội dung nguồn nhà.
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#F6D37A]/12 text-[#F6D37A]">
              <Bot className="h-6 w-6" />
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-white/10 bg-[#08090C]">
          <div className="space-y-3 border-b border-white/10 p-4 sm:p-5">
            <div className="text-[13px] font-semibold text-[#D7DAE3]">Gợi ý nhanh</div>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => void sendMessage(prompt)}
                  disabled={loading}
                  className="min-h-10 rounded-md border border-white/10 bg-white/[0.035] px-3 text-left text-[13px] font-semibold leading-5 text-[#D7DAE3] transition-colors hover:border-[#F6D37A]/50 hover:text-[#F6D37A] disabled:cursor-wait disabled:opacity-60"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          <div className="max-h-[52vh] min-h-[360px] space-y-3 overflow-y-auto p-4 sm:p-5">
            {usableMessages.map((message, index) => {
              const mine = message.sender === 'me';
              return (
                <div key={`${message.timestamp}-${index}`} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[92%] rounded-lg px-4 py-3 text-[14px] leading-6 sm:max-w-[78%] ${
                      mine
                        ? 'bg-[#F6D37A] text-[#101114]'
                        : 'border border-white/10 bg-white/[0.045] text-[#F5F0E6]'
                    }`}
                  >
                    {message.text}
                  </div>
                </div>
              );
            })}
            {loading && (
              <div className="flex justify-start">
                <div className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.045] px-4 py-3 text-[14px] text-[#D7DAE3]">
                  <Loader2 className="h-4 w-4 animate-spin text-[#F6D37A]" />
                  Đang soạn trả lời...
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="mx-4 mb-3 rounded-md border border-red-400/30 bg-red-500/10 px-3 py-2 text-[13px] text-red-100 sm:mx-5">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="border-t border-white/10 p-4 sm:p-5">
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
              <textarea
                ref={inputRef}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                rows={2}
                placeholder="Nhập yêu cầu cho AI..."
                className="min-h-[52px] w-full resize-none rounded-md border border-white/10 bg-black/30 px-3 py-3 text-[14px] leading-5 text-[#F5F0E6] outline-none placeholder:text-[#666B76] focus:border-[#F6D37A]/60"
              />
              <button
                type="submit"
                disabled={loading || !draft.trim()}
                className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-md bg-[#F6D37A] px-5 text-[14px] font-black text-[#101114] transition-colors hover:bg-[#FFE8A3] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Gửi
              </button>
            </div>
          </form>
        </section>
      </div>
    </PageShell>
  );
};

export default SvpAiAssistantPage;
