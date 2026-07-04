import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Bath, BedDouble, Compass, FileText, Home, MapPin, Ruler } from 'lucide-react';
import { svpAxios as api } from '../../services/svpAxios';
import { areaText, formatVndShort } from '../../utils/svpFormat';

const STATUS_LABELS: Record<string, string> = {
  st_pending: 'Chờ xử lý',
  st_active: 'Đang hiển thị',
  st_hidden: 'Đang ẩn',
  st_stopped: 'Dừng bán',
  st_deposited: 'Đã cọc',
  st_sold: 'Đã bán',
  pending: 'Chờ xử lý',
  active: 'Đang hiển thị',
  hidden: 'Đang ẩn',
  stopped: 'Dừng bán',
  deposited: 'Đã cọc',
  sold: 'Đã bán',
};

export default function ExpertPropertyDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [prop, setProp] = useState<any>(null);

  useEffect(() => {
    if (id) api.get(`/properties/${id}`).then((response) => setProp(response.data?.item)).catch(() => {});
  }, [id]);

  if (!prop) return <div className="p-4"><p className="text-[#757575]">Đang tải...</p></div>;

  const isAdmin = user?.roles?.some((role) => role.slug === 'admin' && role.status === 'approved');
  const isOwn = prop.createdBy === user?.id || prop.expertId === user?.id;
  const canSeeInternal = Boolean(isOwn || isAdmin);
  const extra = prop.extra || {};
  const legalLine = [
    extra.legalStatus,
    extra.bookSheet ? `Số tờ: ${extra.bookSheet}` : '',
    extra.bookParcel ? `Số thửa: ${extra.bookParcel}` : '',
    prop.bookSerial ? `Sổ: ${prop.bookSerial}` : '',
  ].filter(Boolean).join(' · ');
  const statusKey = String(prop.statusLabel || prop.statusId || prop.status || '').trim();
  const statusText = STATUS_LABELS[statusKey] || statusKey || 'Đang cập nhật';

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

        {canSeeInternal && (
          <Info title="Chủ nhà" lines={[
            `${prop.ownerName || 'Chưa nhập'} - ${prop.ownerPhone || 'Chưa nhập SĐT'}`,
            extra.ownerEmail ? `Email: ${extra.ownerEmail}` : '',
            extra.ownerCccd ? `CCCD/CMND: ${extra.ownerCccd}` : '',
            extra.ownerNote || '',
          ]} />
        )}

        <Info title="Pháp lý" icon={<FileText className="h-4 w-4" />} lines={[
          legalLine || 'Chưa nhập pháp lý',
          extra.planningStatus ? `Quy hoạch: ${extra.planningStatus}` : '',
          extra.gpsCoordinates ? `GPS: ${extra.gpsCoordinates}` : '',
        ]} />

        {canSeeInternal && (
          <Info title="Dữ liệu xử lý" lines={[
            `Trạng thái: ${statusText}`,
            `Điểm ký: ${prop.signingScore !== undefined ? `${Number(prop.signingScore) > 0 ? '+' : ''}${prop.signingScore}` : '0'}`,
            `Nguồn: ${extra.source || 'Chưa ghi'}`,
            `Phân khúc: ${extra.priceSegment || 'Tự tính theo giá'}`,
            extra.duplicateRule?.hasDuplicates || extra.duplicateMatches?.length ? `Cảnh báo trùng: ${duplicateLine(extra)}` : 'Kiểm trùng: chưa có cảnh báo trùng',
          ]} />
        )}

        {canSeeInternal && extra.commission && (
          <Info title="Hoa hồng" lines={[`${extra.commission}${String(extra.commission).includes('%') ? '' : '%'}`, extra.commissionNote || '', extra.contractStatus ? `Hợp đồng: ${extra.contractStatus}` : '']} />
        )}

        {prop.description && <Info title="Mô tả" lines={[prop.description]} muted />}
        {extra.videoUrl && <Info title="Video" lines={[extra.videoUrl]} muted />}
        {canSeeInternal && prop.hiddenAddress && <Info title="Địa chỉ bảo mật" lines={[prop.hiddenAddress]} muted />}
        {canSeeInternal && extra.internalNote && <Info title="Ghi chú nội bộ" lines={[extra.internalNote]} muted />}
        {canSeeInternal && extra.verificationChecklist && (
          <Info title="Checklist xác minh" lines={verificationLines(extra.verificationChecklist)} muted />
        )}
      </div>
    </div>
  );
}

function verificationLines(checklist: Record<string, boolean>) {
  const labels: Record<string, string> = {
    ownerIdentity: 'Đã xác minh chủ nhà/người được ủy quyền',
    duplicateChecked: 'Đã kiểm tra trùng nguồn nhà',
    legalDocs: 'Đã kiểm tra tình trạng giấy tờ/sổ',
    planningChecked: 'Đã ghi nhận tình trạng quy hoạch',
    commissionAgreed: 'Đã thống nhất hoa hồng/thỏa thuận trích thưởng',
    readyToDistribute: 'Đủ điều kiện gửi duyệt/phân phối bán',
  };
  return Object.entries(labels).map(([key, label]) => `${checklist[key] ? '✓' : '•'} ${label}`);
}

function duplicateLine(extra: any) {
  const first = extra?.duplicateMatches?.[0];
  if (!first) return extra?.duplicateRule?.message || 'Cần rà soát trước khi xử lý.';
  return [
    first.matchTypes?.length ? first.matchTypes.join(', ') : 'Dữ liệu nguồn',
    first.code || first.id,
    first.expertName ? `ký bởi ${first.expertName}` : '',
    first.signingScore !== undefined ? `${first.signingScore} điểm` : '',
  ].filter(Boolean).join(' - ');
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
