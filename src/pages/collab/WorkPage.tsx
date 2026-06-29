import { useAuth } from '../../contexts/AuthContext';
import { Users, Home } from 'lucide-react';

export default function CollabWorkPage() {
  const { user } = useAuth();
  const isKhach = user?.activeRole === 'ctv_khach';

  return (
    <div className="p-4 pb-20">
      <h1 className="text-xl font-bold mb-4">Công việc</h1>

      <div className="flex gap-2 mb-4">
        {isKhach ? (
          <span className="px-4 py-1.5 rounded-full text-sm bg-[#D32F2F] text-white">Khách của tôi</span>
        ) : (
          <span className="px-4 py-1.5 rounded-full text-sm bg-[#D32F2F] text-white">Nguồn của tôi</span>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-8 text-center">
        {isKhach ? (
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        ) : (
          <Home className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        )}
        <p className="text-[#757575]">{isKhach ? 'Chưa có khách nào' : 'Chưa có nguồn nào'}</p>
      </div>
    </div>
  );
}
