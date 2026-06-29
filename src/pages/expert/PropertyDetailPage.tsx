import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Home, MapPin, Ruler, BedDouble, Bath, Compass } from 'lucide-react';
import { svpAxios as api } from '../../services/svpAxios';
import { areaText, formatVndShort } from '../../utils/svpFormat';

export default function ExpertPropertyDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [prop, setProp] = useState<any>(null);
  useEffect(() => { if (id) api.get(`/properties/${id}`).then(r => setProp(r.data?.item)).catch(() => {}); }, [id]);
  if (!prop) return <div className="p-4"><p className="text-[#757575]">Đang tải...</p></div>;
  const isOwn = prop.createdBy === user?.id;
  const extra = prop.extra || {};

  return (
    <div className="pb-20">
      <div className="h-48 bg-gradient-to-br from-[#FFCDD2] to-[#FFEBEE] flex items-center justify-center"><Home className="w-16 h-16 text-[#D32F2F]/20" /></div>
      <div className="p-4">
        <p className="text-[#D32F2F] text-2xl font-bold mb-1">{formatVndShort(prop.price)}</p>
        <h1 className="text-lg font-semibold mb-2">{prop.title || 'Chi tiết nhà'}</h1>
        <p className="text-sm text-[#757575] flex items-center gap-1 mb-4"><MapPin className="w-4 h-4" />{prop.address || `${prop.street || ''} ${prop.ward || ''} ${prop.district || ''}`}</p>
        <div className="grid grid-cols-4 gap-2 mb-6">
          {[{ icon: Ruler, label: areaText(prop) }, { icon: BedDouble, label: `${extra.bedrooms || '—'} PN` }, { icon: Bath, label: `${extra.bathrooms || '—'} WC` }, { icon: Compass, label: extra.direction || '—' }].map((item, i) => (
            <div key={i} className="bg-surface rounded-lg p-2 text-center"><item.icon className="w-5 h-5 mx-auto text-[#757575] mb-1" /><p className="text-xs">{item.label}</p></div>
          ))}
        </div>
        {isOwn && (<div className="bg-white rounded-xl shadow-sm p-4 mb-4"><h3 className="font-semibold mb-2">Chủ nhà</h3><p className="text-sm">{prop.ownerName} - {prop.ownerPhone}</p></div>)}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4"><h3 className="font-semibold mb-2">Pháp lý</h3><p className="text-sm">{extra.legalStatus || '—'} · Số tờ: {prop.bookSerial || '—'}</p></div>
        {isOwn && extra.commission && (<div className="bg-white rounded-xl shadow-sm p-4 mb-4"><h3 className="font-semibold mb-2">Hoa hồng</h3><p className="text-sm">{extra.commission}% {extra.commissionNote ? ` · ${extra.commissionNote}` : ''}</p></div>)}
        {prop.description && (<div className="bg-white rounded-xl shadow-sm p-4 mb-4"><h3 className="font-semibold mb-2">Mô tả</h3><p className="text-sm text-[#757575]">{prop.description}</p></div>)}
        {isOwn && extra.internalNote && (<div className="bg-white rounded-xl shadow-sm p-4 mb-4"><h3 className="font-semibold mb-2">Ghi chú nội bộ</h3><p className="text-sm text-[#757575]">{extra.internalNote}</p></div>)}
      </div>
    </div>
  );
}
