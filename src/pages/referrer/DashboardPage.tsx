import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Copy, Check, Share2, Users, Clock, CheckCircle } from 'lucide-react';

export default function ReferrerDashboardPage() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const code = user?.referralCode || '';
  const link = `https://sodovanphuc.vn/register?ref=${code}`;

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
    <div className="p-4 pb-20">
      <h1 className="text-xl font-bold mb-6">Giới thiệu</h1>

      <div className="bg-white rounded-xl shadow-sm p-6 text-center mb-6">
        <p className="text-sm text-[#757575] mb-2">Mã giới thiệu của bạn</p>
        <p className="text-3xl font-bold text-[#D32F2F] mb-4">{code || '---'}</p>
        <div className="flex gap-3 justify-center">
          <button onClick={copy} className="flex items-center gap-2 bg-[#D32F2F] text-white px-4 py-2 rounded-lg">
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Đã sao chép' : 'Sao chép link'}
          </button>
          <button onClick={share} className="flex items-center gap-2 border border-[#D32F2F] text-[#D32F2F] px-4 py-2 rounded-lg">
            <Share2 className="w-4 h-4" /> Chia sẻ
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-3 text-center">
          <Users className="w-5 h-5 text-blue-600 mx-auto mb-1" />
          <p className="text-xl font-bold">0</p>
          <p className="text-xs text-[#757575]">Đã giới thiệu</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-3 text-center">
          <Clock className="w-5 h-5 text-amber-600 mx-auto mb-1" />
          <p className="text-xl font-bold">0</p>
          <p className="text-xs text-[#757575]">Đang chờ</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-3 text-center">
          <CheckCircle className="w-5 h-5 text-green-600 mx-auto mb-1" />
          <p className="text-xl font-bold">0</p>
          <p className="text-xs text-[#757575]">Thành công</p>
        </div>
      </div>
    </div>
  );
}
