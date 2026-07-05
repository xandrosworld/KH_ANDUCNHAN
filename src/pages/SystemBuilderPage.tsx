import { useEffect, useMemo, useState } from 'react';
import { Check, Copy, Network, Share2, UsersRound } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { svpApi } from '../services/svpApi';

interface SystemData {
  user: {
    id: string;
    fullName: string;
    phone: string;
    email: string;
    svpId: string;
    referralCode: string;
    referralLink: string;
  };
  directReferrals: Array<{
    id: string;
    fullName: string;
    phone: string;
    email: string;
    svpId: string;
    referralCode: string;
    accountStatus: string;
    createdAt: string;
  }>;
  directReferralCount: number;
  indirectReferralCount: number;
}

export default function SystemBuilderPage() {
  const { user } = useAuth();
  const [data, setData] = useState<SystemData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    svpApi.getMySystem()
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch(() => {
        if (!cancelled) {
          const code = user?.referralCode || '';
          setData({
            user: {
              id: user?.id || '',
              fullName: user?.fullName || '',
              phone: user?.phone || '',
              email: user?.email || '',
              svpId: user?.svpId || '',
              referralCode: code,
              referralLink: `${window.location.origin}/register?ref=${encodeURIComponent(code)}`,
            },
            directReferrals: [],
            directReferralCount: 0,
            indirectReferralCount: 0,
          });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const referralLink = useMemo(() => {
    const code = data?.user.referralCode || user?.referralCode || '';
    return data?.user.referralLink || `${window.location.origin}/register?ref=${encodeURIComponent(code)}`;
  }, [data?.user.referralCode, data?.user.referralLink, user?.referralCode]);

  const copyText = async (value: string, key: string) => {
    await navigator.clipboard?.writeText(value);
    setCopied(key);
    window.setTimeout(() => setCopied(''), 1800);
  };

  const shareLink = async () => {
    if (navigator.share) {
      await navigator.share({
        title: 'Sổ Đỏ Vạn Phúc',
        text: 'Đăng ký Sổ Đỏ Vạn Phúc qua link giới thiệu của tôi',
        url: referralLink,
      });
      return;
    }
    await copyText(referralLink, 'link');
  };

  return (
    <div className="mx-auto max-w-5xl pb-24">
      <section className="mb-4 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-gray-100 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-red-50 text-[#c40012]">
            <Network className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#c40012]">Xây dựng hệ thống</p>
            <h1 className="mt-1 text-2xl font-black text-[#25202a]">Mã giới thiệu và tuyến F1</h1>
            <p className="mt-1 text-sm font-medium leading-6 text-[#667085]">
              Lấy mã/link giới thiệu nhanh và theo dõi những người đã đăng ký trực tiếp qua bạn.
            </p>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="rounded-3xl bg-white p-6 text-sm font-bold text-[#667085] shadow-sm ring-1 ring-gray-100">
          Đang tải hệ thống của bạn...
        </div>
      ) : (
        <>
          <section className="mb-4 grid gap-3 md:grid-cols-[1fr_1fr]">
            <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[#8a6b6b]">Mã giới thiệu</p>
              <div className="mt-3 rounded-2xl bg-[#fff8f2] p-4">
                <p className="break-all text-3xl font-black text-[#c40012]">{data?.user.referralCode || '-'}</p>
                <p className="mt-2 text-xs font-bold text-[#667085]">{data?.user.fullName || user?.fullName || 'Tài khoản của bạn'}</p>
              </div>
              <button
                type="button"
                onClick={() => copyText(data?.user.referralCode || '', 'code')}
                className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#c40012] px-4 text-sm font-black text-white"
              >
                {copied === 'code' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied === 'code' ? 'Đã sao chép mã' : 'Sao chép mã'}
              </button>
            </div>

            <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[#8a6b6b]">Link giới thiệu</p>
              <div className="mt-3 rounded-2xl bg-[#fff8f2] p-4">
                <p className="break-all text-sm font-bold leading-6 text-[#25202a]">{referralLink}</p>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => copyText(referralLink, 'link')}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-3 text-sm font-black text-[#c40012]"
                >
                  {copied === 'link' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  Copy link
                </button>
                <button
                  type="button"
                  onClick={() => void shareLink()}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-[#25202a] px-3 text-sm font-black text-white"
                >
                  <Share2 className="h-4 w-4" />
                  Chia sẻ
                </button>
              </div>
            </div>
          </section>

          <section className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-gray-100 sm:p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-[#25202a]">Tuyến trực tiếp F1</h2>
                <p className="text-sm font-medium text-[#667085]">Danh sách tài khoản được ghi nhận do bạn giới thiệu.</p>
              </div>
              <div className="grid h-12 min-w-12 place-items-center rounded-2xl bg-red-50 px-3 text-lg font-black text-[#c40012]">
                {data?.directReferralCount || 0}
              </div>
            </div>

            {!data?.directReferrals?.length ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-[#fffaf7] px-4 py-6 text-center">
                <UsersRound className="mx-auto h-10 w-10 text-red-200" />
                <p className="mt-2 text-sm font-black text-[#25202a]">Chưa có F1 nào</p>
                <p className="mt-1 text-xs font-semibold text-[#667085]">Gửi link giới thiệu để hệ thống tự ghi nhận người đăng ký mới.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {data.directReferrals.map((item) => (
                  <article key={item.id} className="rounded-2xl border border-gray-100 bg-white p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-black text-[#25202a]">{item.fullName || 'Chưa có tên'}</p>
                        <p className="mt-1 text-xs font-semibold text-[#667085]">
                          {[item.svpId, item.phone, item.email].filter(Boolean).join(' · ') || 'Chưa có liên hệ'}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-black text-emerald-700">
                        F1
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
