import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const DEFAULT_IMAGE = '/og-sodovanphuc-20260630.png';

const routeMetadata: Record<string, { title: string; description: string }> = {
  '/': {
    title: 'Sổ Đỏ Vạn Phúc | Hệ thống quản lý nhà đất',
    description: 'Hệ thống quản lý nguồn nhà, khách hàng, timeline, version và cấu hình nội bộ cho Sổ Đỏ Vạn Phúc.',
  },
  '/nha': {
    title: 'Danh sách nhà | Sổ Đỏ Vạn Phúc',
    description: 'Danh sách nguồn nhà với tag, trạng thái, quyền xem và dữ liệu cấu trúc.',
  },
  '/dashboard': {
    title: 'Tổng quan KPI | Sổ Đỏ Vạn Phúc',
    description: 'Tổng quan nguồn nhà, khách hàng, nhu cầu mua, lịch xem và trạng thái điều hành.',
  },
  '/post-property': {
    title: 'Đăng nhà | Sổ Đỏ Vạn Phúc',
    description: 'Thông tin cơ bản cho nguồn nhà Sổ Đỏ Vạn Phúc.',
  },
  '/admin/config': {
    title: 'Cấu hình nội bộ | Sổ Đỏ Vạn Phúc',
    description: 'Quản trị công ty thành viên, tag, trạng thái, quyền xem và tiêu chí điểm ký nhà.',
  },
  '/khach-hang': {
    title: 'Khách hàng | Sổ Đỏ Vạn Phúc',
    description: 'Quản lý khách hàng, nguồn đến, trạng thái chăm sóc và ghi chú nhu cầu.',
  },
  '/referral': {
    title: 'Referral SVP ID QR | Sổ Đỏ Vạn Phúc',
    description: 'Tạo mã giới thiệu, link và QR cho hệ thống referral Sổ Đỏ Vạn Phúc.',
  },
  '/ai': {
    title: 'Trợ lý AI | Sổ Đỏ Vạn Phúc',
    description: 'Trợ lý hỗ trợ viết mô tả, gợi ý nội dung và tra cứu thông tin bất động sản nội bộ.',
  },
  '/admin': {
    title: 'Admin | Sổ Đỏ Vạn Phúc',
    description: 'Khu vực quản trị hệ thống Sổ Đỏ Vạn Phúc.',
  },
  '/sign-in': {
    title: 'Đăng nhập | Sổ Đỏ Vạn Phúc',
    description: 'Đăng nhập hệ thống Sổ Đỏ Vạn Phúc.',
  },
};

function setMeta(attr: 'name' | 'property', key: string, content: string) {
  let element = document.querySelector(`meta[${attr}="${key}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attr, key);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

function setCanonical(href: string) {
  let element = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', 'canonical');
    document.head.appendChild(element);
  }
  element.setAttribute('href', href);
}

const SEOManager = () => {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);

    const pathname = location.pathname;
    const metadata = pathname.startsWith('/nha/')
      ? {
          title: 'Chi tiết nhà | Sổ Đỏ Vạn Phúc',
          description: 'Hồ sơ nhà với timeline, version, tag và quyền xem.',
        }
      : routeMetadata[pathname] || routeMetadata['/'];

    const absoluteImage = `${window.location.origin}${DEFAULT_IMAGE}`;
    const currentUrl = `${window.location.origin}${pathname}`;

    document.title = metadata.title;
    setCanonical(currentUrl);
    setMeta('name', 'description', metadata.description);
    setMeta('property', 'og:title', metadata.title);
    setMeta('property', 'og:description', metadata.description);
    setMeta('property', 'og:image', absoluteImage);
    setMeta('property', 'og:image:secure_url', absoluteImage);
    setMeta('property', 'og:image:type', 'image/png');
    setMeta('property', 'og:image:width', '1200');
    setMeta('property', 'og:image:height', '630');
    setMeta('property', 'og:image:alt', 'Sổ Đỏ Vạn Phúc - Hệ điều hành nghề môi giới thổ cư Việt Nam');
    setMeta('property', 'og:url', currentUrl);
    setMeta('property', 'og:type', 'website');
    setMeta('property', 'og:site_name', 'Sổ Đỏ Vạn Phúc');
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', metadata.title);
    setMeta('name', 'twitter:description', metadata.description);
    setMeta('name', 'twitter:image', absoluteImage);
  }, [location.pathname]);

  return null;
};

export default SEOManager;
