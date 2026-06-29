import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Bath, BedDouble, Compass, FileText, Home, MapPin, Ruler } from 'lucide-react';
import { svpAxios as api } from '../../services/svpAxios';
import { areaText, formatVndShort } from '../../utils/svpFormat';

export default function ExpertPropertyDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [prop, setProp] = useState<any>(null);

  useEffect(() => {
    if (id) api.get(`/properties/${id}`).then((response) => setProp(response.data?.item)).catch(() => {});
  }, [id]);

  if (!prop) return <div className="p-4"><p className="text-[#757575]">Đang tải...</p></div>;

  const isOwn = prop.createdBy === user?.id || prop.expertId === user?.id;
  const extra = prop.extra || {};
  const legalLine = [
    extra.legalStatus,
    extra.bookSheet ? `Số tờ: ${extra.bookSheet}` : '',
    extra.bookParcel ? `Số thửa: ${extra.bookParcel}` : '',
    prop.bookSerial ? `Sổ: ${prop.bookSerial}` : '',
  ].filter(Boolean).join(' · ');

  return (
    <div className="pb-20">
      <div className="flex h-48 items-center justify-center bg-gradient-to-br from-[#FFCDD2] to-[#FFEBEE]">
        <Home className="h-16 w-16 text-[#D32F2F]/20" />
      </div>
      <div className="space-y-4 p-4">
        <p className="mb-1 text-2xl font-black text-[#D32F2F]">{formatVndShort(prop.price)}</p>
        <h1 className="text-lg font-black text-[#25202a]">{prop.title || 'Chi tiết nhà'}</h1>
        <p className="flex items-center gap-1 text-sm font-semibold text-[#757575]">
          <MapPin className="h-4 w-4" />{prop.address || `${prop.ward || ''} ${prop.district || ''}`}
        </p>

        <div className="grid grid-cols-4 gap-2">
          {[
            { icon: Ruler, label: areaText(prop) },
            { icon: BedDouble, label: `${extra.bedrooms || '—'} PN` },
            { icon: Bath, label: `${extra.bathrooms || '—'} WC` },
            { icon: Compass, label: extra.direction || '—' },
          ].map((item, index) => (
            <div key={index} className="rounded-2xl bg-white p-2 text-center shadow-sm ring-1 ring-gray-100">
              <item.icon className="mx-auto mb-1 h-5 w-5 text-[#757575]" />
              <p className="text-xs font-black text-[#25202a]">{item.label}</p>
            </div>
          ))}
        </div>

        {isOwn && (
          <Info title="Chủ nhà" lines={[
            `${prop.ownerName || 'Chưa nhập'} - ${prop.ownerPhone || 'Chưa nhập SĐT'}`,
            extra.ownerCccd ? `CCCD/CMND: ${extra.ownerCccd}` : '',
            extra.ownerNote || '',
          ]} />
        )}

        <Info title="Pháp lý" icon={<FileText className="h-4 w-4" />} lines={[
          legalLine || 'Chưa nhập pháp lý',
          extra.planningStatus ? `Quy hoạch: ${extra.planningStatus}` : '',
          extra.gpsCoordinates ? `GPS: ${extra.gpsCoordinates}` : '',
        ]} />

        {isOwn && extra.commission && (
          <Info title="Hoa hồng" lines={[`${extra.commission}${String(extra.commission).includes('%') ? '' : '%'}`, extra.commissionNote || '']} />
        )}

        {prop.description && <Info title="Mô tả" lines={[prop.description]} muted />}
        {isOwn && prop.hiddenAddress && <Info title="Địa chỉ bảo mật" lines={[prop.hiddenAddress]} muted />}
        {isOwn && extra.internalNote && <Info title="Ghi chú nội bộ" lines={[extra.internalNote]} muted />}
      </div>
    </div>
  );
}

function Info({ title, lines, icon, muted = false }: { title: string; lines: string[]; icon?: ReactNode; muted?: boolean }) {
  const visibleLines = lines.filter(Boolean);
  return (
    <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
      <h3 className="mb-2 flex items-center gap-2 font-black text-[#25202a]">{icon}{title}</h3>
      <div className="space-y-1">
        {visibleLines.length ? visibleLines.map((line) => (
          <p key={line} className={`text-sm leading-6 ${muted ? 'text-[#757575]' : 'text-[#25202a]'}`}>{line}</p>
        )) : <p className="text-sm text-[#757575]">Chưa có thông tin.</p>}
      </div>
    </div>
  );
}
