import { useEffect, useState } from 'react';
import { Heart, Home, MapPin, Search, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { svpAxios as api } from '../../services/svpAxios';
import { areaText, formatVndShort } from '../../utils/svpFormat';

export default function BuyerFavoritesPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState('');

  useEffect(() => {
    api.get('/favorites')
      .then((response) => setItems(response.data?.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const removeFav = async (id: string) => {
    setRemovingId(id);
    try {
      await api.delete(`/favorites/${id}`);
      setItems((current) => current.filter((item) => item.id !== id));
    } catch {
      setItems((current) => current.filter((item) => item.id !== id));
    } finally {
      setRemovingId('');
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 pb-24 pt-3 sm:px-6 lg:px-8">
      <section className="mb-5 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-gray-100 sm:p-5">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#c40012]">Khách mua</p>
        <h1 className="mt-1 text-2xl font-black text-[#25202a]">Nhà đã lưu</h1>
        <p className="mt-1 text-sm font-medium leading-6 text-[#747b88]">
          Lưu lại các nguồn đang quan tâm để so sánh và trao đổi với chuyên viên.
        </p>
      </section>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => <FavoriteSkeleton key={index} />)}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-100">
          <Heart className="mx-auto h-12 w-12 text-red-200" />
          <p className="mt-3 font-black text-[#25202a]">Bạn chưa lưu nhà nào</p>
          <p className="mt-1 text-sm font-medium leading-6 text-[#747b88]">Khi thấy nguồn phù hợp, hãy bấm lưu để xem lại nhanh tại đây.</p>
          <button onClick={() => navigate('/khach-mua/tim-nha')} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-2xl bg-[#c40012] px-5 text-sm font-black text-white">
            <Search className="h-4 w-4" />
            Tìm nhà ngay
          </button>
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {items.map((item) => (
            <div key={item.id} className="flex gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-gray-100">
              <button onClick={() => navigate(`/nha/${item.propertyId || item.id}`)} className="grid h-24 w-24 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-red-50 to-rose-100 text-[#c40012] sm:h-28 sm:w-28">
                <Home className="h-7 w-7 opacity-45" />
              </button>
              <button onClick={() => navigate(`/nha/${item.propertyId || item.id}`)} className="min-w-0 flex-1 py-1 text-left">
                <p className="font-black text-[#c40012]">{formatVndShort(item.price)}</p>
                <p className="mt-1 line-clamp-2 text-sm font-black leading-5 text-[#25202a]">{item.title || 'Nguồn nhà đã lưu'}</p>
                <p className="mt-2 flex items-center gap-1 text-xs font-semibold text-[#747b88]">
                  <MapPin className="h-3.5 w-3.5" />
                  <span className="truncate">{item.district || item.ward || 'Khu vực đang cập nhật'}</span>
                </p>
                <p className="mt-1 text-xs font-semibold text-[#747b88]">{areaText(item)}</p>
              </button>
              <button
                onClick={() => removeFav(item.id)}
                disabled={removingId === item.id}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-red-50 text-[#c40012] disabled:opacity-50"
                aria-label="Bỏ lưu nhà"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FavoriteSkeleton() {
  return (
    <div className="flex gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-gray-100">
      <div className="h-24 w-24 shrink-0 animate-pulse rounded-2xl bg-gray-100" />
      <div className="flex-1 space-y-2 py-2">
        <div className="h-4 w-24 animate-pulse rounded bg-gray-100" />
        <div className="h-4 w-full animate-pulse rounded bg-gray-100" />
        <div className="h-3 w-32 animate-pulse rounded bg-gray-100" />
      </div>
    </div>
  );
}
