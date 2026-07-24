export interface RecruitmentSection {
  key?: string;
  title: string;
  body?: string;
  items?: string[];
  imageUrl?: string;
}

export interface RecruitmentPost {
  id: string;
  slug: string;
  title: string;
  eyebrow: string;
  summary: string;
  recruiterName: string;
  recruiterTitle: string;
  ctaLabel: string;
  bannerUrl: string;
  sections: RecruitmentSection[];
  disclaimer: string;
  status: 'draft' | 'published' | 'hidden' | 'archived';
  applicationStatus: 'open' | 'closed';
  candidateCount?: number;
  publishedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface RecruitmentCandidate {
  id: string;
  postId: string;
  postTitle: string;
  postSlug: string;
  userId: string;
  fullName: string;
  phone: string;
  email: string;
  svpId: string;
  positionSlug: RecruitmentPositionSlug;
  positionLabel: string;
  pipelineStatus: RecruitmentPipelineStatus;
  referralCode?: string | null;
  utmSource?: string | null;
  utmCampaign?: string | null;
  note?: string | null;
  createdAt: string;
}

export type RecruitmentPositionSlug = 'chuyen_vien' | 'chuyen_gia' | 'truong_phong';
export type RecruitmentPipelineStatus = 'registered' | 'contacted' | 'interview' | 'training' | 'activated' | 'active' | 'rejected';

export const RECRUITMENT_POSITIONS: Array<{ slug: RecruitmentPositionSlug; label: string; description: string }> = [
  { slug: 'chuyen_vien', label: 'Chuyên viên / Cộng tác viên / Đầu khách', description: 'Tìm kiếm, tư vấn và chăm sóc khách mua.' },
  { slug: 'chuyen_gia', label: 'Chuyên gia / Đầu chủ', description: 'Phát triển nguồn nhà và làm việc cùng chủ nhà.' },
  { slug: 'truong_phong', label: 'Trưởng phòng / Leader', description: 'Xây dựng, đào tạo và quản lý đội nhóm.' },
];
