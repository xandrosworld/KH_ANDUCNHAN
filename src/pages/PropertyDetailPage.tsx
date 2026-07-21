import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Bath, BedDouble, Compass, Home, MapPin, MessageCircle, Phone, Ruler, Search, Send, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { svpAxios as api } from '../services/svpAxios';
import { areaText, formatVndShort } from '../utils/svpFormat';

interface PropertyComment {
  id: string;
  propertyId: string;
  body: string;
  createdBy?: string;
  authorName?: string;
  authorSvpId?: string;
  createdAt?: string;
}

export default function PropertyDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [prop, setProp] = useState<any>(null);
  const [comments, setComments] = useState<PropertyComment[]>([]);
  const [commentBody, setCommentBody] = useState('');
  const [commentBusy, setCommentBusy] = useState(false);
  const [commentMessage, setCommentMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api.get(`/properties/${id}`).then(r => setProp(r.data?.item)).catch(() => {}).finally(() => setLoading(false));
    api.get(`/properties/${id}/comments`).then(r => setComments(r.data?.items || [])).catch(() => setComments([]));
  }, [id]);

  const submitComment = async () => {
    const body = commentBody.trim();
    if (!id || !body || commentBusy) return;
    setCommentBusy(true);
    setCommentMessage('');
    try {
      const response = await api.post(`/properties/${id}/comments`, { body });
      const item = response.data?.item as PropertyComment | undefined;
      if (item) setComments((current) => [...current, item]);
      setCommentBody('');
      setCommentMessage('Đã gửi bình luận.');
    } catch (error: any) {
      setCommentMessage(error?.response?.data?.message || 'Chưa gửi được bình luận.');
    } finally {
      setCommentBusy(false);
    }
  };

  const deleteComment = async (comment: PropertyComment) => {
    if (!id || !comment.id || commentBusy) return;
    setCommentBusy(true);
    setCommentMessage('');
    try {
      await api.delete(`/properties/${id}/comments/${comment.id}`);
      setComments((current) => current.filter((item) => item.id !== comment.id));
      setCommentMessage('Đã xóa bình luận.');
    } catch (error: any) {
      setCommentMessage(error?.response?.data?.message || 'Chưa xóa được bình luận.');
    } finally {
      setCommentBusy(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-white flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-2 border-[#D32F2F] border-t-transparent" /></div>;
  if (!prop) return <PublicPropertyNotFound onBack={() => navigate(-1)} />;

  const extra = prop.extra || {};
  const contactPhoneRaw = String(prop.ownerPhone || prop.owner_phone || prop.contactPhone || prop.contact_phone || '0912886794');
  const contactPhoneDigits = contactPhoneRaw.replace(/\D/g, '') || '0912886794';
  const zaloMessage = encodeURIComponent(`Chào Sổ Đỏ Vạn Phúc, tôi cần tư vấn nguồn nhà ${prop.code || prop.title || id || ''}.`);
  const canManageComment = (comment: PropertyComment) => {
    if (!user) return false;
    const isAdmin = user.roles?.some((role) => ['admin_tong', 'admin'].includes(role.slug) && role.status === 'approved');
    return Boolean(isAdmin || comment.createdBy === user.id || prop.createdBy === user.id || prop.expertId === user.id);
  };

  return (
    <div className="pb-20 bg-white min-h-screen">
      {/* Image Gallery */}
      <div className="h-56 md:h-80 bg-gradient-to-br from-[#FFCDD2] to-[#FFEBEE] flex items-center justify-center relative">
        <Home className="w-20 h-20 text-[#D32F2F]/15" />
      </div>

      <div className="p-4 max-w-2xl mx-auto">
        {/* Price */}
        <p className="text-[#D32F2F] text-3xl font-bold mb-2">{formatVndShort(prop.price)}</p>

        {/* Title */}
        <h1 className="text-xl font-semibold text-[#212121] mb-3">{prop.title || 'Chi tiết nhà'}</h1>

        {/* Location - only district for public */}
        <p className="text-[#757575] flex items-center gap-1.5 mb-6">
          <MapPin className="w-4 h-4" /> {prop.district || prop.ward || '—'}
        </p>

        {/* Quick Info Grid */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { icon: Ruler, label: areaText(prop), sub: 'Diện tích' },
            { icon: BedDouble, label: `${extra.bedrooms || '—'}`, sub: 'Phòng ngủ' },
            { icon: Bath, label: `${extra.bathrooms || '—'}`, sub: 'WC' },
            { icon: Compass, label: extra.direction || '—', sub: 'Hướng' },
          ].map((item, i) => (
            <div key={i} className="bg-surface rounded-xl p-3 text-center">
              <item.icon className="w-5 h-5 mx-auto text-[#757575] mb-1" />
              <p className="font-semibold text-sm">{item.label}</p>
              <p className="text-xs text-[#757575]">{item.sub}</p>
            </div>
          ))}
        </div>

        {/* Description */}
        {prop.description && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Mô tả</h2>
            <p className="text-[#757575] text-sm leading-relaxed">{prop.description}</p>
          </div>
        )}

        {/* Property Type */}
        <div className="bg-white rounded-xl border p-4 mb-6">
          <h2 className="font-semibold mb-3">Thông tin cơ bản</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-[#757575]">Loại BĐS</span><span>{extra.propertyType || '—'}</span></div>
            <div className="flex justify-between"><span className="text-[#757575]">Diện tích</span><span>{areaText(prop)}</span></div>
            <div className="flex justify-between"><span className="text-[#757575]">Số tầng</span><span>{extra.floors || '—'}</span></div>
            <div className="flex justify-between"><span className="text-[#757575]">Hướng</span><span>{extra.direction || '—'}</span></div>
          </div>
        </div>

        <section className="mb-24 rounded-xl border bg-white p-4">
          <h2 className="mb-3 font-semibold">Bình luận nội bộ</h2>
          <div className="space-y-3">
            {comments.length ? comments.map((comment) => (
              <article key={comment.id} className="rounded-xl bg-[#fff8f2] px-3 py-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#25202a]">{comment.authorName || 'Thành viên'}</p>
                    <p className="mt-0.5 text-[11px] font-semibold text-[#9aa1ad]">{formatCommentDate(comment.createdAt)}</p>
                  </div>
                  {canManageComment(comment) ? (
                    <button type="button" onClick={() => deleteComment(comment)} disabled={commentBusy} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white text-[#c40012] ring-1 ring-red-100 disabled:opacity-60" aria-label="Xóa bình luận">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm font-medium leading-6 text-[#555b66]">{comment.body}</p>
              </article>
            )) : (
              <p className="rounded-xl bg-[#fff8f2] px-3 py-3 text-sm font-semibold text-[#747b88]">Chưa có bình luận.</p>
            )}
          </div>

          {isAuthenticated ? (
            <div className="mt-3">
              <textarea
                value={commentBody}
                onChange={(event) => setCommentBody(event.target.value)}
                rows={3}
                maxLength={1000}
                placeholder="Nhập bình luận ngắn về nguồn nhà..."
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold outline-none focus:border-[#c40012]"
              />
              <button type="button" onClick={submitComment} disabled={commentBusy || !commentBody.trim()} className="mt-2 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#c40012] px-3 text-sm font-black text-white disabled:opacity-60">
                <Send className="h-4 w-4" />
                Gửi bình luận
              </button>
              {commentMessage ? <p className="mt-2 text-xs font-bold text-[#c40012]">{commentMessage}</p> : null}
            </div>
          ) : (
            <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm font-bold text-[#c40012]">Đăng nhập để bình luận nội bộ về nguồn nhà.</p>
          )}
        </section>

        {/* CTA */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 flex gap-3 max-w-2xl mx-auto">
          <a href={`tel:${contactPhoneDigits}`} className="flex-1 bg-[#D32F2F] text-white rounded-xl py-3 font-semibold flex items-center justify-center gap-2">
            <Phone className="w-5 h-5" /> Liên hệ tư vấn
          </a>
          <a
            href={`https://zalo.me/${contactPhoneDigits}?text=${zaloMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Nhắn Zalo tư vấn"
            className="w-12 h-12 border-2 border-[#D32F2F] text-[#D32F2F] rounded-xl flex items-center justify-center"
          >
            <MessageCircle className="w-5 h-5" />
          </a>
        </div>
      </div>
    </div>
  );
}

function PublicPropertyNotFound({ onBack }: { onBack: () => void }) {
  return (
    <main className="min-h-screen bg-[#fff8f2] px-4 py-10">
      <section className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center rounded-[28px] border border-red-100 bg-white p-6 text-center shadow-sm sm:p-8">
        <div className="grid h-16 w-16 place-items-center rounded-3xl bg-red-50 text-[#c40012]">
          <Home className="h-8 w-8" />
        </div>
        <p className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-[#c40012]">Nguồn nhà</p>
        <h1 className="mt-2 text-2xl font-black text-[#25202a]">Không tìm thấy nguồn nhà</h1>
        <p className="mt-3 max-w-md text-sm font-medium leading-6 text-[#667085]">
          Nguồn nhà này có thể đã được ẩn, đã đổi trạng thái hoặc không còn trong hệ thống công khai. Anh/chị có thể quay lại trang trước hoặc mở danh sách tìm nhà phù hợp.
        </p>
        <div className="mt-6 grid w-full gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-red-100 bg-white px-4 text-sm font-black text-[#c40012]"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </button>
          <Link
            to="/khach-mua/tim-nha"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-[#c40012] px-4 text-sm font-black text-white"
          >
            <Search className="h-4 w-4" />
            Tìm nhà phù hợp
          </Link>
        </div>
      </section>
    </main>
  );
}

function formatCommentDate(value?: string) {
  if (!value) return 'Vừa gửi';
  const date = new Date(value.replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return value.slice(0, 16);
  return date.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
}
