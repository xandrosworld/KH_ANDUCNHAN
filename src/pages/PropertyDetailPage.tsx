import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Home, MapPin, Ruler, BedDouble, Bath, Compass, Phone, MessageCircle } from 'lucide-react';
import { svpAxios as api } from '../services/svpAxios';
import { areaText, formatVndShort } from '../utils/svpFormat';

export default function PropertyDetailPage() {
  const { id } = useParams();
  const [prop, setProp] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api.get(`/properties/${id}`).then(r => setProp(r.data?.item)).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="min-h-screen bg-white flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-2 border-[#D32F2F] border-t-transparent" /></div>;
  if (!prop) return <div className="p-4 text-center"><p className="text-[#757575]">Không tìm thấy nhà</p></div>;

  const extra = prop.extra || {};
  const contactPhoneRaw = String(prop.ownerPhone || prop.owner_phone || prop.contactPhone || prop.contact_phone || '0912886794');
  const contactPhoneDigits = contactPhoneRaw.replace(/\D/g, '') || '0912886794';
  const zaloMessage = encodeURIComponent(`Chào Sổ Đỏ Vạn Phúc, tôi cần tư vấn nguồn nhà ${prop.code || prop.title || id || ''}.`);

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
