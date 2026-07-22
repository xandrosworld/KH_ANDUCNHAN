import { svpAxios as api } from '../services/svpAxios';

export type AdminExportType = 'users' | 'properties' | 'customers' | 'role_applications' | 'viewing_schedules' | 'referrals' | 'user_referrals';

const fileNames: Record<AdminExportType, string> = {
  users: 'so-do-van-phuc-nguoi-dung.xls',
  properties: 'so-do-van-phuc-nguon-nha.xls',
  customers: 'so-do-van-phuc-khach-hang.xls',
  role_applications: 'so-do-van-phuc-duyet-vai-tro.xls',
  viewing_schedules: 'so-do-van-phuc-lich-xem.xls',
  referrals: 'so-do-van-phuc-gioi-thieu.xls',
  user_referrals: 'so-do-van-phuc-tuyen-f1.xls',
};

export async function downloadAdminExport(type: AdminExportType, params: Record<string, string> = {}) {
  const response = await api.get('/admin/export', {
    params: { type, ...params },
    responseType: 'blob',
  });
  const blob = new Blob([response.data], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileNames[type];
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
