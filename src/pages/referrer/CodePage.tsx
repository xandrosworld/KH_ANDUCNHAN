import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Copy, Check, Share2 } from 'lucide-react';
import { svpAxios as api } from '../../services/svpAxios';

export default function ReferrerCodePage() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [referrals, setReferrals] = useState<any[]>([]);
  const code = user?.referralCode || '';
  const link = `https://sodovanphuc.vn/register?ref=${code}`;

  useEffect(() => {
    if (code) {
      api.get('/referrals', { params: { referralCode: code } })
        .then(r => setReferrals(r.data?.items || []))
        .catch(() => {});
    }
  }, [code]);

  const copy = () => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const share = async () => {
    if (navigator.share) {
      await navigator.share({ title: 'Sổ Đỏ Vạn Phúc', text: 'Đăng ký Sổ Đỏ Vạn Phúc qua mã giới thiệu của tôi', url: link });
      return;
    }
    copy();
  };

  return (
    <div className="mx-auto max-w-lg min-w-0 p-4 pb-20">
      <h1 className="text-xl font-bold mb-6">Mã giới thiệu</h1>

      <div className="mb-6 min-w-0 rounded-xl bg-white p-6 text-center shadow-sm">
        <p className="mb-2 break-all text-4xl font-bold text-[#D32F2F]">{code}</p>
        <p className="text-sm text-[#757575] mb-4 break-all">{link}</p>
        <div className="flex min-w-0 flex-col gap-3 justify-center min-[360px]:flex-row">
          <button onClick={copy} className="flex min-w-0 items-center justify-center gap-2 rounded-lg bg-[#D32F2F] px-4 py-2 text-white">
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Đã sao chép' : 'Sao chép'}
          </button>
          <button onClick={share} className="flex min-w-0 items-center justify-center gap-2 rounded-lg border border-[#D32F2F] px-4 py-2 text-[#D32F2F]">
            <Share2 className="w-4 h-4" /> Chia sẻ
          </button>
        </div>
      </div>

      <h2 className="text-lg font-semibold mb-3">Người đã giới thiệu</h2>
      {referrals.length === 0 ? (
        <p className="text-[#757575] text-center">Chưa giới thiệu ai</p>
      ) : referrals.map((r: any) => (
        <div key={r.id} className="bg-white rounded-xl shadow-sm p-4 mb-3">
          <p className="font-medium">{r.referredName || '***'}</p>
          <p className="text-sm text-[#757575]">{r.createdAt?.slice(0, 10)}</p>
          <span className={`text-xs px-2 py-0.5 rounded-full ${r.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
            {r.status === 'active' ? 'Đã kích hoạt' : 'Mới'}
          </span>
        </div>
      ))}
    </div>
  );
}
