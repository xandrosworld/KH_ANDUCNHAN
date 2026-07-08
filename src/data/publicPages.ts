import type { SvpConfigOption } from '../types/svp';

export interface PublicAboutContent {
  title: string;
  subtitle: string;
  body: string;
  imageUrl: string;
  videoUrl: string;
  linkUrl: string;
}

export interface PublicNewsPost {
  id: string;
  title: string;
  body: string;
  imageUrl: string;
  videoUrl: string;
  linkUrl: string;
}

export const defaultPublicAbout: PublicAboutContent = {
  title: 'Sổ Đỏ Vạn Phúc',
  subtitle: 'Hệ thống kết nối nguồn nhà, khách mua và đội ngũ môi giới Sổ Đỏ Vạn Phúc.',
  body: 'Sổ Đỏ Vạn Phúc giúp chủ nhà gửi thông tin bán nhà, khách mua để lại nhu cầu và đội ngũ phụ trách xử lý dữ liệu tập trung, rõ trạng thái, đúng phân quyền.',
  imageUrl: '/logo11.png',
  videoUrl: '',
  linkUrl: '',
};

export const defaultPublicNewsPosts: PublicNewsPost[] = [
  {
    id: 'public_news_v1',
    title: 'Kết nối nhu cầu mua bán nhà rõ ràng hơn',
    body: 'Khách mua và chủ nhà có thể để lại thông tin ngay trên website. Đội ngũ Sổ Đỏ Vạn Phúc tiếp nhận, kiểm tra và phản hồi theo từng nhu cầu cụ thể.',
    imageUrl: '',
    videoUrl: '',
    linkUrl: '',
  },
  {
    id: 'public_news_expert',
    title: 'Nguồn nhà được kiểm tra và lưu trữ tập trung',
    body: 'Thông tin nhà bán được ghi nhận theo mã nguồn, khu vực, mức giá và trạng thái xử lý để việc tư vấn diễn ra nhanh và thống nhất hơn.',
    imageUrl: '',
    videoUrl: '',
    linkUrl: '',
  },
  {
    id: 'public_news_referral',
    title: 'Thông tin liên hệ được chuyển đúng người phụ trách',
    body: 'Các yêu cầu hỗ trợ, nhu cầu mua bán và thông tin giới thiệu được ghi nhận để đội ngũ phụ trách dễ theo dõi và chăm sóc khách hàng.',
    imageUrl: '',
    videoUrl: '',
    linkUrl: '',
  },
];

export const publicPagesConfigOptions: SvpConfigOption[] = [
  {
    id: 'public_page_about',
    groupId: 'public_pages',
    label: 'Giới thiệu',
    value: 'about',
    metadata: {
      type: 'about',
      subtitle: defaultPublicAbout.subtitle,
      body: defaultPublicAbout.body,
      imageUrl: defaultPublicAbout.imageUrl,
      videoUrl: defaultPublicAbout.videoUrl,
      linkUrl: defaultPublicAbout.linkUrl,
    },
    sortOrder: 10,
    isActive: true,
  },
  ...defaultPublicNewsPosts.map((post, index) => ({
    id: post.id,
    groupId: 'public_pages',
    label: post.title,
    value: post.id.replace(/^public_/, ''),
    metadata: {
      type: 'news',
      body: post.body,
      imageUrl: post.imageUrl,
      videoUrl: post.videoUrl,
      linkUrl: post.linkUrl,
    },
    sortOrder: 110 + index * 10,
    isActive: true,
  })),
];
