import { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import { Loader2, Plus, QrCode, RefreshCcw, Share2, UsersRound } from 'lucide-react';
import PageShell from '../components/PageShell';
import { usePageTitle } from '../hooks/usePageTitle';
import { svpApi } from '../services/svpApi';
import type { SvpReferral } from '../types/svp';
import { formatDateTime } from '../utils/svpDisplay';

const referralTypes: SvpReferral['referralType'][] = ['staff', 'owner', 'buyer', 'partner', 'other'];
const referralTypeLabels: Record<SvpReferral['referralType'], string> = {
  staff: 'Nhân sự',
  owner: 'Chủ nhà',
  buyer: 'Khách mua',
  partner: 'Đối tác',
  other: 'Khác',
};

function makeReferralCode(prefix = 'SVP') {
  const chunk = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `${prefix}-${new Date().getFullYear()}-${chunk}`;
}

const SvpReferralPage = () => {
  usePageTitle('Referral');
  const [referrals, setReferrals] = useState<SvpReferral[]>([]);
  const [referrerUserId, setReferrerUserId] = useState('');
  const [referralType, setReferralType] = useState<SvpReferral['referralType']>('staff');
  const [referralCode, setReferralCode] = useState(makeReferralCode());
  const [qrUrls, setQrUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await svpApi.listReferrals();
      setReferrals(result.items);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Không tải được mã giới thiệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const referralLinks = useMemo(() => {
    const origin = window.location.origin;
    return Object.fromEntries(referrals.map((item) => [
      item.id,
      `${origin}/register?ref=${encodeURIComponent(item.referralCode)}`,
    ]));
  }, [referrals]);

  useEffect(() => {
    let active = true;
    async function generateQr() {
      const entries = await Promise.all(referrals.map(async (item) => {
        const url = referralLinks[item.id] || item.referralCode;
        const dataUrl = await QRCode.toDataURL(url, { margin: 1, width: 220 });
        return [item.id, dataUrl] as const;
      }));
      if (active) setQrUrls(Object.fromEntries(entries));
    }
    void generateQr();
    return () => {
      active = false;
    };
  }, [referralLinks, referrals]);

  const handleCreate = async () => {
    if (!referralCode.trim()) {
      setError('Nhập mã referral');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const created = await svpApi.createReferral({
        referrerUserId: referrerUserId.trim(),
        referredUserId: '',
        referralCode: referralCode.trim().toUpperCase(),
        referralType,
        status: 'new',
      });
      setReferrals((current) => [created, ...current]);
      setReferralCode(makeReferralCode());
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Không tạo được referral');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageShell maxWidth="max-w-[1320px]">
      <div className="space-y-6">
        <section className="flex flex-col gap-4 rounded-lg border border-white/10 bg-white/[0.035] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.18em] text-[#F6D37A]">
              <QrCode className="h-4 w-4" />
              SVP ID / QR
            </div>
            <h1 className="mt-3 text-2xl font-bold text-[#F5F0E6] sm:text-3xl">Mã giới thiệu và QR</h1>
            <p className="mt-2 max-w-3xl text-[14px] leading-6 text-[#A7ABB6]">
              Tạo mã giới thiệu, link và QR để dùng cho tuyển dụng, mời khách, đối tác và cây hệ thống sau này.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadData()}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-white/10 px-4 text-[14px] font-bold text-[#D7DAE3] transition-colors hover:border-[#F6D37A]/50 hover:text-[#F6D37A]"
          >
            <RefreshCcw className="h-4 w-4" />
            Tải lại
          </button>
        </section>

        {error && (
          <div className="rounded-md border border-red-400/30 bg-red-500/10 px-4 py-3 text-[14px] text-red-100">
            {error}
          </div>
        )}

        <section className="grid gap-4 rounded-lg border border-white/10 bg-[#08090C] p-5 lg:grid-cols-[1fr_220px_220px_auto]">
          <input
            value={referrerUserId}
            onChange={(event) => setReferrerUserId(event.target.value)}
            placeholder="SVP ID / user ID người giới thiệu"
            className="min-h-11 rounded-md border border-white/10 bg-black/30 px-3 text-[14px] text-[#F5F0E6] outline-none placeholder:text-[#666B76] focus:border-[#F6D37A]/60"
          />
          <select
            value={referralType}
            onChange={(event) => setReferralType(event.target.value as SvpReferral['referralType'])}
            className="min-h-11 rounded-md border border-white/10 bg-black/30 px-3 text-[14px] text-[#F5F0E6] outline-none focus:border-[#F6D37A]/60"
          >
            {referralTypes.map((type) => <option key={type} value={type}>{referralTypeLabels[type]}</option>)}
          </select>
          <input
            value={referralCode}
            onChange={(event) => setReferralCode(event.target.value.toUpperCase())}
            className="min-h-11 rounded-md border border-white/10 bg-black/30 px-3 text-[14px] font-bold text-[#F6D37A] outline-none focus:border-[#F6D37A]/60"
          />
          <button
            type="button"
            onClick={() => void handleCreate()}
            disabled={saving}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#F6D37A] px-4 text-[14px] font-black text-[#101114] transition-colors hover:bg-[#FFE8A3] disabled:cursor-wait disabled:opacity-70"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Tạo mã
          </button>
        </section>

        {loading ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center rounded-lg border border-white/10 bg-[#08090C] text-[#A7ABB6]">
            <Loader2 className="mb-3 h-7 w-7 animate-spin text-[#F6D37A]" />
            Đang tải mã giới thiệu...
          </div>
        ) : (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {referrals.length === 0 ? (
              <div className="rounded-lg border border-white/10 bg-[#08090C] p-6 text-[14px] text-[#A7ABB6]">Chưa có mã referral nào.</div>
            ) : referrals.map((item) => (
              <article key={item.id} className="rounded-lg border border-white/10 bg-[#08090C] p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#8A8F98]">{referralTypeLabels[item.referralType] || item.referralType}</div>
                    <div className="mt-2 text-xl font-black text-[#F6D37A]">{item.referralCode}</div>
                    <div className="mt-2 text-[12px] text-[#8A8F98]">{formatDateTime(item.createdAt)}</div>
                  </div>
                  <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[11px] font-bold text-[#D7DAE3]">{item.status}</span>
                </div>
                <div className="mt-4 flex items-center gap-4">
                  <div className="rounded-md bg-white p-2">
                    {qrUrls[item.id] ? <img src={qrUrls[item.id]} alt={item.referralCode} className="h-28 w-28" /> : <div className="h-28 w-28" />}
                  </div>
                  <div className="min-w-0 text-[13px] text-[#A7ABB6]">
                    <div className="flex items-center gap-2 text-[#D7DAE3]">
                      <UsersRound className="h-4 w-4 text-[#F6D37A]" />
                      {item.referrerUserId || 'Chưa gắn SVP ID'}
                    </div>
                    <div className="mt-3 break-all rounded-md bg-white/[0.035] p-2 text-[12px]">{referralLinks[item.id]}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => void navigator.clipboard?.writeText(referralLinks[item.id] || item.referralCode)}
                  className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md border border-white/10 text-[13px] font-semibold text-[#D7DAE3] hover:border-[#F6D37A]/50 hover:text-[#F6D37A]"
                >
                  <Share2 className="h-4 w-4" />
                  Copy link
                </button>
              </article>
            ))}
          </section>
        )}
      </div>
    </PageShell>
  );
};

export default SvpReferralPage;
