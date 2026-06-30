import { svpAxios as api } from '../services/svpAxios';

export type AdminExportType = 'users' | 'properties' | 'customers' | 'role_applications';

const fileNames: Record<AdminExportType, string> = {
  users: 'so-do-van-phuc-nguoi-dung.csv',
  properties: 'so-do-van-phuc-nguon-nha.csv',
  customers: 'so-do-van-phuc-khach-hang.csv',
  role_applications: 'so-do-van-phuc-duyet-vai-tro.csv',
};

export async function downloadAdminExport(type: AdminExportType) {
  const response = await api.get('/admin/export', {
    params: { type },
    responseType: 'blob',
  });
  const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileNames[type];
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
