import { useState } from 'react';
import { usePageTitle } from '../hooks/usePageTitle';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  Globe,
  Sparkles,
  ShieldCheck,
  Users,
  ArrowRight,
  Landmark,
  Search,
  Heart,
  Check,
  Home,
  ChevronRight,
} from 'lucide-react';
import PageShell from '../components/PageShell';
import { useLanguage } from '../contexts/LanguageContext';

const AboutPage = () => {
  const { t, lang } = useLanguage();
  const isVi = lang === 'vi';
  usePageTitle(isVi ? 'Giới thiệu' : 'About Us');
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const foundationItems = isVi
    ? [
        'Thành viên cộng đồng tinh hoa được tuyển chọn kỹ lưỡng',
        'Tập trung vào chất lượng nội dung và giá trị thực',
        'Tầm nhìn dài hạn được bảo chứng bởi sự ổn định của Group Z',
        'Không gian cao cấp, bảo mật và tôn trọng',
      ]
    : [
        'Rigorously vetted elite community members',
        'Focus on content quality and genuine value creation',
        'Long-term perspective backed by Group Z stability',
        'Premium, secure, and respectful space',
      ];
  const statCards = isVi
    ? [
        { kicker: 'Phạm vi', title: 'Đối thoại toàn cầu', desc: 'Trao đổi góc nhìn kinh doanh cấp cao và tri thức xuyên biên giới trong một hệ thống được tuyển chọn, có cấu trúc.' },
        { kicker: 'Trọng tâm', title: 'Khám phá bất động sản cao cấp', desc: 'Tiếp cận các tin nhà ở cao cấp, dự án thương mại và bất động sản cho thuê minh bạch trên toàn cầu.' },
        { kicker: 'Nền tảng', title: 'Hệ sinh thái Group Z', desc: 'Được hỗ trợ bởi tầm nhìn dài hạn, nguồn lực vốn và năng lực công nghệ của thương hiệu mẹ Group Z.' },
      ]
    : [
        { kicker: 'Scope', title: 'Global Conversations', desc: 'Exchange high-level business insights and cross-border intelligence inside a curated, structured system.' },
        { kicker: 'Focus', title: 'Premium Real Estate Discovery', desc: 'Access curated high-end residential listings, commercial developments, and transparent rentals worldwide.' },
        { kicker: 'Foundation', title: 'Group Z Ecosystem', desc: 'Backed by the long-term vision, capital resources, and technical expertise of our parent brand Group Z.' },
      ];
  const reasonCards = isVi
    ? [
        { icon: Globe, title: 'Không gian thảo luận đa lĩnh vực', desc: 'Kinh doanh, đầu tư, công nghệ, tài chính, phát triển cá nhân và nhiều chủ đề toàn cầu khác.' },
        { icon: Sparkles, title: 'Chất lượng hơn số lượng', desc: 'Cộng đồng được tuyển chọn kỹ lưỡng, tập trung vào tương tác và nội dung cao cấp, chân thực.' },
        { icon: Users, title: 'Lãnh đạo, nhà đầu tư, chuyên gia', desc: 'Không gian cao cấp để lãnh đạo, doanh nhân, chuyên gia, nhà đầu tư và người có ảnh hưởng kết nối.' },
        { icon: ShieldCheck, title: 'Được xây dựng bởi Group Z', desc: 'Hệ sinh thái thuộc Group Z - biểu tượng của sự xuất sắc, đổi mới công nghệ và tầm nhìn dài hạn.' },
      ]
    : [
        { icon: Globe, title: 'Multi-disciplinary Discussion Space', desc: 'Business, Investment, Technology, Finance, Personal Development, and many other global topics.' },
        { icon: Sparkles, title: 'Quality Over Quantity', desc: 'A rigorously vetted community focused on premium, authentic interactions and content.' },
        { icon: Users, title: 'Leaders, Investors, Experts', desc: 'A premium space where leaders, entrepreneurs, experts, investors, and influential individuals connect.' },
        { icon: ShieldCheck, title: 'Built by Group Z', desc: 'The ecosystem belongs to Group Z - a symbol of excellence, technological innovation, and long-term vision.' },
      ];
  const propertyLinks = isVi
    ? [
        { label: 'Mua bất động sản', path: '/buy', icon: Search },
        { label: 'Thuê bất động sản', path: '/rent', icon: Heart },
        { label: 'Bán bất động sản', path: '/sell', icon: Globe },
        { label: 'Gói vay mua nhà', path: '/mortgage', icon: Landmark },
        { label: 'Tìm môi giới', path: '/agent', icon: Users },
      ]
    : [
        { label: 'Buy Properties', path: '/buy', icon: Search },
        { label: 'Rent Properties', path: '/rent', icon: Heart },
        { label: 'Sell Property', path: '/sell', icon: Globe },
        { label: 'Mortgage Plans', path: '/mortgage', icon: Landmark },
        { label: 'Find Agents', path: '/agent', icon: Users },
      ];
  const capabilities = isVi
    ? [
        { label: 'Trải nghiệm tìm kiếm thông minh', desc: 'Giúp người dùng đi từ khám phá rộng đến tìm kiếm bất động sản cụ thể qua luồng tìm kiếm và lọc rõ ràng.' },
        { label: 'Hành trình tin đăng được tuyển chọn', desc: 'Sắp xếp bất động sản cao cấp theo mua, thuê, loại nhà, khoảng giá và vị trí để việc so sánh dễ dàng hơn.' },
        { label: 'Nhà đã lưu và yêu cầu tư vấn', desc: 'Cho phép người dùng lưu bất động sản quan tâm và tiếp tục trao đổi qua trải nghiệm gửi yêu cầu đơn giản.' },
        { label: 'Hiện diện thương hiệu có cấu trúc', desc: 'Trình bày nội dung So Do Van Phuc, góc nhìn thị trường và thông tin bất động sản qua các trang sạch, dễ đọc và đáng tin cậy.' },
      ]
    : [
        { label: 'Intelligent search experience', desc: 'Helps visitors move from broad discovery to focused property exploration through clear search and filtering flows.' },
        { label: 'Curated listing journeys', desc: 'Organizes premium properties by buying, renting, home type, price range, and location so decisions feel easier to compare.' },
        { label: 'Saved homes and inquiries', desc: 'Lets users save properties they care about and continue conversations through a simple, direct inquiry experience.' },
        { label: 'Structured brand presence', desc: 'Presents So Do Van Phuc content, market insights, and property information through clean pages built for readability and trust.' },
      ];
  const values = isVi
    ? [
        { title: 'Thảo luận tôn trọng', desc: 'Khuyến khích trao đổi hợp tác, giàu giá trị và hỗ trợ lẫn nhau, không dung thứ cho nhiễu loạn.' },
        { title: 'Góc nhìn xây dựng', desc: 'Ưu tiên tri thức có thể hành động và nghiên cứu sâu thay vì giật tít hoặc thông tin thiếu cơ sở.' },
        { title: 'Thông tin đáng tin cậy', desc: 'Cam kết dữ liệu tin đăng được xác thực, chuyên môn từ môi giới thật và kiểm duyệt chất lượng cao.' },
        { title: 'Cơ hội toàn cầu', desc: 'Thúc đẩy kinh doanh xuyên biên giới, đầu tư bất động sản và kết nối đa phương.' },
        { title: 'Tầm nhìn dài hạn', desc: 'Xây dựng cộng đồng cao cấp và hệ sinh thái công nghệ bền vững được Group Z hậu thuẫn.' },
      ]
    : [
        { title: 'Respectful discussion', desc: 'Encouraging collaborative, high-value, and supportive exchange with zero tolerance for noise.' },
        { title: 'Constructive insight', desc: 'Promoting actionable intelligence and deep research over clickbait or unsubstantiated hype.' },
        { title: 'Trusted information', desc: 'Committed to verified listing data, real agent expertise, and high-quality moderation.' },
        { title: 'Global opportunity', desc: 'Fostering cross-border business, real estate investments, and multi-lateral networking.' },
        { title: 'Long-term vision', desc: 'Building a sustainable, premium community and technical ecosystem backed by Group Z.' },
      ];

  const handleSubscribe = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <PageShell raw>
      {/* Top Mini Nav */}
      <div className="bg-[#111118] border-b border-white/[0.085]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <Link
              to="/"
              className="text-[#A7ABB6] hover:text-[#F6D37A] transition-colors flex items-center gap-1 text-[13px] sm:text-[14px]"
            >
              <Home className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">{isVi ? 'Trang chủ' : 'Home'}</span>
            </Link>
            <ChevronRight className="h-3 w-3 text-white/30 hidden sm:inline" />
            <span className="text-[#F5F0E6] font-bold text-[13px] sm:text-[14px] truncate">
              So Do Van Phuc Journal
            </span>
          </div>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              to="/blog"
              className="text-[#A7ABB6] hover:text-[#F5F0E6] text-[13px] transition-colors"
            >
              {isVi ? 'Thông cáo báo chí' : 'Press Releases'}
            </Link>
            <Link
              to="/about"
              className="text-[#F6D37A] hover:text-[#F6D37A] text-[13px] transition-colors font-medium"
            >
              {isVi ? 'Giới thiệu' : 'About Us'}
            </Link>
            <Link
              to="/contact"
              className="text-[#A7ABB6] hover:text-[#F5F0E6] text-[13px] transition-colors"
            >
              {isVi ? 'Nhà đầu tư' : 'Investors'}
            </Link>
            <Link
              to="/contact"
              className="text-[#A7ABB6] hover:text-[#F5F0E6] text-[13px] transition-colors"
            >
              {isVi ? 'Liên hệ' : 'Contact'}
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/contact"
              className="px-3 sm:px-3.5 py-1.5 rounded-lg border border-[#B88717]/50 hover:border-[#B88717] text-[#F6D37A] hover:text-[#F5F0E6] hover:bg-[#B88717]/10 transition-all text-[12px] sm:text-[13px] font-semibold whitespace-nowrap"
            >
              {isVi ? 'Liên hệ' : 'Contact Us'}
            </Link>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#15151D] via-[#0E0F16] to-[#030405] border-b border-white/[0.05]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(184,135,23,0.08),transparent_50%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(82,64,180,0.05),transparent_40%)] pointer-events-none" />

        <div className="relative z-10 max-w-[900px] mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24 pb-16 sm:pb-20 text-center min-w-0">
          <span className="inline-block text-[11px] sm:text-[12px] font-bold tracking-widest text-[#F6D37A] uppercase mb-4 px-3 py-1 bg-[#B88717]/10 rounded-full border border-[#B88717]/25">
            {t('about.title')}
          </span>

          <h1
            className="hero-gold-text font-extrabold mb-6 leading-tight tracking-tight break-words"
            style={{ fontSize: 'clamp(28px, 5.5vw, 48px)' }}
          >
            {isVi ? 'Diễn đàn toàn cầu hàng đầu cho kết nối tinh hoa' : 'The world’s leading global forum for elite connection'}
          </h1>

          <div className="space-y-6 text-[#A7ABB6] text-[15px] sm:text-[17px] leading-relaxed max-w-[760px] mx-auto text-left sm:text-center break-words">
            <p>
              {isVi ? 'So Do Van Phuc - The World’s Leading Global Forum - là nền tảng diễn đàn toàn cầu được sáng lập và phát triển bởi ' : 'So Do Van Phuc - The World’s Leading Global Forum - is a global forum platform founded and developed by '}
              <span className="text-[#F6D37A] font-semibold">Group Z</span>.
            </p>
            <p>
              {isVi
                ? 'Được xây dựng với tầm nhìn trở thành nơi hội tụ của những bộ óc xuất sắc trên toàn thế giới, So Do Van Phuc không chỉ là một diễn đàn thông thường. Đây là không gian cao cấp nơi lãnh đạo, doanh nhân, chuyên gia, nhà đầu tư và những cá nhân có ảnh hưởng kết nối, trao đổi ý tưởng, chia sẻ cơ hội và cùng tạo giá trị trong kỷ nguyên toàn cầu hóa.'
                : 'Built with the vision of becoming a gathering place for the brightest minds from around the world, So Do Van Phuc is more than just an ordinary forum. It is a premium space where leaders, entrepreneurs, experts, investors, and influential individuals connect, exchange ideas, share opportunities, and create value together in the era of globalization.'}
            </p>
            <p>
              {isVi
                ? 'Với sứ mệnh kết nối tri thức toàn cầu, So Do Van Phuc mang đến môi trường thảo luận sâu sắc, tôn trọng và giàu tính xây dựng. Mỗi thành viên là một phần của cộng đồng tinh hoa, nơi chất lượng nội dung và giá trị thực luôn được đặt lên hàng đầu.'
                : 'With a mission to connect global intelligence, So Do Van Phuc provides a deep, respectful, and highly constructive discussion environment. Every member is part of an elite community where content quality and genuine value are paramount.'}
            </p>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/buy"
              className="px-6 py-3 rounded-xl bg-[#B88717] hover:bg-[#D4A020] text-[#030405] font-bold text-[14px] sm:text-[15px] transition-all shadow-[0_10px_28px_rgba(184,135,23,0.25)] flex items-center gap-2"
            >
              <span>{t('about.exploreHomes')}</span>
              <ArrowRight className="h-4 w-4 flex-shrink-0" />
            </Link>
            <Link
              to="/contact"
              className="px-6 py-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-[#F5F0E6] font-semibold text-[14px] sm:text-[15px] border border-white/[0.08] transition-all"
            >
              {t('info.contact')}
            </Link>
          </div>
        </div>
      </div>

      {/* Mission Section */}
      <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 min-w-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
          <div className="min-w-0">
            <h2 className="text-[#F6D37A] font-extrabold text-[28px] sm:text-[36px] leading-tight mb-6 break-words">
              {isVi ? 'Kết nối tri thức toàn cầu' : 'Connecting global intelligence'}
            </h2>
            <p className="text-[#A7ABB6] text-[15px] sm:text-[16px] leading-relaxed mb-6 break-words">
              {isVi
                ? 'Tại So Do Van Phuc, sứ mệnh của chúng tôi là xây dựng môi trường thảo luận tối ưu cho tri thức tinh hoa toàn cầu. Chúng tôi tổng hợp góc nhìn xuyên biên giới, giúp các nhà lãnh đạo hợp tác, phân tích chiến lược kinh doanh mới nổi và khám phá hướng đầu tư cao cấp.'
                : 'At So Do Van Phuc, our mission is to build the ultimate discussion environment for elite global intelligence. We synthesize insights across borders, helping leaders collaborate, analyze emerging business strategies, and discover premium investment paths.'}
            </p>
            <p className="text-[#A7ABB6] text-[15px] sm:text-[16px] leading-relaxed break-words">
              {isVi
                ? 'Mạng lưới diễn đàn của chúng tôi là điểm kết nối kỹ thuật số cho lãnh đạo doanh nghiệp, doanh nhân công nghệ, nhà nghiên cứu uy tín và nhà đầu tư bất động sản muốn tối ưu quyết định xuyên biên giới.'
                : 'Our forum network acts as a digital nexus for corporate figures, tech entrepreneurs, acclaimed researchers, and property investors looking to optimize cross-border decisions.'}
            </p>
          </div>

          <div className="bg-[#15151D] border border-white/[0.085] rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#B88717]/10 rounded-full blur-3xl pointer-events-none" />
            <h3 className="text-[#F6D37A] font-bold text-[18px] mb-4">{isVi ? 'Nền tảng cốt lõi được tuyển chọn' : 'Core Vetted Foundations'}</h3>
            <div className="space-y-4">
              {foundationItems.map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 min-w-0">
                  <div className="mt-1 h-5 w-5 rounded-full bg-[#B88717]/15 flex items-center justify-center flex-shrink-0">
                    <Check className="h-3 w-3 text-[#F6D37A]" />
                  </div>
                  <p className="text-[#A7ABB6] text-[13px] sm:text-[14px] leading-snug break-words">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {statCards.map((card) => (
            <div key={card.title} className="bg-[#15151D] border border-white/[0.085] rounded-xl p-6 hover:border-[#B88717]/30 transition-all duration-300">
              <div className="text-[#F6D37A] text-[13px] font-bold tracking-widest uppercase mb-1">{card.kicker}</div>
              <div className="text-[#F5F0E6] text-[22px] sm:text-[26px] font-extrabold mb-2 break-words">{card.title}</div>
              <p className="text-[#7D8291] text-[13px] sm:text-[14px] leading-relaxed break-words">{card.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Why Choose Section */}
      <div className="bg-[#0A0B10] border-y border-white/[0.05] py-16 sm:py-24">
        <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 min-w-0">
          <div className="text-center max-w-[700px] mx-auto mb-16">
            <h2 className="text-[#F6D37A] font-extrabold text-[28px] sm:text-[36px] mb-4 break-words">
              {isVi ? 'Vì sao chọn So Do Van Phuc?' : 'Why choose So Do Van Phuc?'}
            </h2>
            <p className="text-[#A7ABB6] text-[14px] sm:text-[16px] leading-relaxed break-words">
              {isVi
                ? 'Chúng tôi tập trung vào chất lượng và giá trị cộng đồng mang lại thay vì số lượng thuần túy, từ đó thiết lập chuẩn mực xuất sắc.'
                : 'We focus on the quality and value the community brings rather than raw volume, establishing a benchmark of excellence.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {reasonCards.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="bg-[#15151D] border border-white/[0.085] rounded-xl p-6 hover:border-[#B88717]/40 transition-colors min-w-0"
                >
                  <div className="w-12 h-12 rounded-lg bg-[#B88717]/10 flex items-center justify-center mb-5 flex-shrink-0">
                    <Icon className="h-6 w-6 text-[#F6D37A]" />
                  </div>
                  <h3 className="text-[#F6D37A] font-bold text-[16px] mb-3 break-words">
                    {item.title}
                  </h3>
                  <p className="text-[#7D8291] text-[13px] leading-relaxed break-words">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Real Estate Ecosystem Section */}
      <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 min-w-0">
        <div className="bg-[#15151D] border border-white/[0.085] rounded-2xl p-6 sm:p-10 relative overflow-hidden">
          <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-[#5240B4]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-[800px] min-w-0">
            <h2 className="text-[#F6D37A] font-extrabold text-[28px] sm:text-[36px] mb-4 break-words">
              {isVi ? 'Hệ sinh thái bất động sản' : 'Real Estate Ecosystem'}
            </h2>
            <p className="text-[#A7ABB6] text-[15px] sm:text-[16px] leading-relaxed mb-8 break-words">
              {isVi
                ? 'So Do Van Phuc kết nối thảo luận cấp cao với triển khai trong thực tế. Chúng tôi đang mở rộng thành nền tảng bất động sản toàn cầu toàn diện, cung cấp các cổng trải nghiệm liền mạch để mua bất động sản, thuê nhà ở cao cấp, tính toán khoản vay mua nhà và tìm môi giới địa phương hiệu quả.'
                : 'So Do Van Phuc bridges the gap between high-level discussions and real-world implementation. We are expanding into a comprehensive global real estate platform, offering streamlined portals for purchasing properties, renting luxury residences, calculating home financing, and sourcing top-performing local agents.'}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {propertyLinks.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={idx}
                    to={item.path}
                    className="flex flex-col items-center justify-center p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-[#B88717]/10 hover:border-[#B88717]/30 transition-all text-center min-w-0 group"
                  >
                    <Icon className="h-5 w-5 text-[#F6D37A] mb-2 group-hover:scale-110 transition-transform flex-shrink-0" />
                    <span className="text-[#F5F0E6] font-semibold text-[13px] sm:text-[14px] break-words max-w-full">
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Technology Section */}
      <div className="bg-[#0A0B10] border-y border-white/[0.05] py-16 sm:py-24">
        <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 min-w-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1 bg-[#15151D] border border-white/[0.085] rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                <span className="text-emerald-500 font-semibold text-[13px]">
                  {isVi ? 'Năng lực nền tảng' : 'Platform Capabilities'}
                </span>
              </div>
              <div className="space-y-4">
                {capabilities.map((srv, idx) => (
                  <div
                    key={idx}
                    className="border-b border-white/[0.05] last:border-0 pb-3 last:pb-0 min-w-0"
                  >
                    <h4 className="text-[#F6D37A] font-semibold text-[14px] mb-1 break-words">
                      {srv.label}
                    </h4>
                    <p className="text-[#7D8291] text-[12px] sm:text-[13px] leading-relaxed break-words">
                      {srv.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="order-1 lg:order-2 min-w-0">
              <h2 className="text-[#F6D37A] font-extrabold text-[28px] sm:text-[36px] leading-tight mb-6 break-words">
                {isVi ? 'Công nghệ giúp người dùng đi từ tìm kiếm đến quyết định' : 'Technology that helps people move from search to decision'}
              </h2>
              <p className="text-[#A7ABB6] text-[15px] sm:text-[16px] leading-relaxed mb-6 break-words">
                {isVi
                  ? 'Chúng tôi thiết kế trải nghiệm So Do Van Phuc để quá trình khám phá trở nên bình tĩnh, có cấu trúc và đáng tin cậy. Từ tìm kiếm đến lưu nhà, từ chi tiết bất động sản đến gửi yêu cầu, mỗi màn hình đều được xây dựng để giảm ma sát và giúp người dùng tự tin hơn.'
                  : 'We design the So Do Van Phuc experience to make discovery feel calm, structured, and trustworthy. From search to saved homes, from property details to inquiries, each screen is built to reduce friction and help users move with more confidence.'}
              </p>
              <p className="text-[#A7ABB6] text-[15px] sm:text-[16px] leading-relaxed break-words">
                {isVi
                  ? 'Khi nền tảng phát triển, nền móng này có thể hỗ trợ dữ liệu phong phú hơn, môi giới được xác thực, gợi ý thông minh hơn và quy trình bất động sản quốc tế, đồng thời vẫn giữ chất lượng biên tập cao cấp của hệ sinh thái Group Z.'
                  : 'As the platform grows, this foundation can support richer data, verified agents, smarter recommendations, and international real estate workflows while preserving the premium editorial quality expected from the Group Z ecosystem.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Values / Future Section */}
      <div className="w-full max-w-[900px] mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 min-w-0">
        <div className="text-center max-w-[700px] mx-auto mb-12">
          <h2 className="text-[#F6D37A] font-extrabold text-[28px] sm:text-[36px] mb-4 break-words">
            {isVi ? 'Xây dựng tương lai bằng chất lượng và giá trị' : 'Building the future with quality and value'}
          </h2>
          <p className="text-[#A7ABB6] text-[14px] sm:text-[16px] leading-relaxed break-words">
            {isVi
              ? 'Chúng tôi không chạy theo số lượng thành viên, mà tập trung vào chất lượng và giá trị cộng đồng mang lại. So Do Van Phuc không chỉ là nơi để đọc, mà là nơi tiếng nói của bạn được lắng nghe và cùng nhau xây dựng tương lai.'
              : 'We do not pursue growth in membership numbers, but focus on the quality and value the community brings. So Do Van Phuc is more than just a place to read - it is a place where you get heard and together we build the future.'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8">
          {values.map((val, idx) => (
            <div key={idx} className="flex gap-4 min-w-0">
              <div className="mt-1 h-6 w-6 rounded-full bg-[#B88717]/10 flex items-center justify-center flex-shrink-0">
                <span className="text-[#F6D37A] font-bold text-[12px]">{idx + 1}</span>
              </div>
              <div className="min-w-0">
                <h4 className="text-[#F6D37A] font-bold text-[15px] sm:text-[16px] mb-1 break-words">
                  {val.title}
                </h4>
                <p className="text-[#7D8291] text-[13px] leading-relaxed break-words">
                  {val.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Newsletter Section */}
      <div className="bg-[#0A0B10] border-t border-white/[0.05] py-16 sm:py-24">
        <div className="w-full max-w-[800px] mx-auto px-4 sm:px-6 lg:px-8 text-center min-w-0">
          <div className="bg-[#15151D] border border-white/[0.085] rounded-2xl p-8 sm:p-10 relative overflow-hidden">
            <div className="relative z-10 min-w-0">
              <h2 className="text-[#F6D37A] font-extrabold text-[24px] sm:text-[30px] mb-4 break-words">
                {isVi ? 'Luôn kết nối với So Do Van Phuc' : 'Stay connected with So Do Van Phuc'}
              </h2>
              <p className="text-[#A7ABB6] text-[14px] sm:text-[15px] leading-relaxed mb-8 max-w-[560px] mx-auto break-words">
                {isVi
                  ? 'Đăng ký So Do Van Phuc Journal để nhận thông cáo chính thức, báo cáo thị trường và cập nhật từ cộng đồng tinh hoa.'
                  : 'Subscribe to the So Do Van Phuc journal for official press releases, market reports, and elite community updates.'}
              </p>

              {subscribed ? (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl font-medium inline-flex items-center gap-2 max-w-[400px] mx-auto">
                  <Check className="h-5 w-5 flex-shrink-0" />
                  <span className="text-left text-[14px]">
                    {isVi ? 'Cảm ơn bạn! Bạn đã đăng ký nhận cập nhật thành công.' : 'Thank you! You have successfully subscribed to our updates.'}
                  </span>
                </div>
              ) : (
                <form
                  onSubmit={handleSubscribe}
                  className="flex flex-col sm:flex-row gap-3 max-w-[500px] mx-auto"
                >
                  <input
                    type="email"
                    required
                    placeholder={isVi ? 'Nhập email công việc của bạn' : 'Enter your professional email'}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-grow px-4 py-3 rounded-xl bg-[#030405] border border-white/10 text-[#F5F0E6] placeholder-gray-500 focus:outline-none focus:border-[#B88717] text-[14px] transition-colors min-w-0"
                  />
                  <button
                    type="submit"
                    className="px-6 py-3 rounded-xl bg-[#B88717] hover:bg-[#D4A020] text-[#030405] font-bold text-[14px] transition-colors whitespace-nowrap"
                  >
                    {isVi ? 'Đăng ký' : 'Subscribe'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Closing CTA Section */}
      <div className="w-full max-w-[800px] mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-28 lg:pb-16 text-center min-w-0">
        <h3 className="text-[#F6D37A] font-extrabold text-[22px] sm:text-[28px] mb-4 break-words">
          {isVi ? 'Tham gia cộng đồng tinh hoa toàn cầu ngay hôm nay' : 'Join our global elite community today'}
        </h3>
        <p className="text-[#A7ABB6] text-[14px] sm:text-[15px] leading-relaxed mb-8 max-w-[500px] mx-auto break-words">
          {isVi
            ? 'Bước vào môi trường xây dựng, nơi nội dung chất lượng, kết nối được tuyển chọn và tầm nhìn dài hạn cùng hội tụ.'
            : 'Step into a constructive environment where quality content, vetted connection, and long-term vision align.'}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/register"
            className="px-6 py-3 rounded-xl bg-[#B88717] hover:bg-[#D4A020] text-[#030405] font-bold text-[14px] transition-colors"
          >
            {isVi ? 'Tạo tài khoản' : 'Register Account'}
          </Link>
          <Link
            to="/contact"
            className="px-6 py-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-[#F5F0E6] font-semibold text-[14px] border border-white/[0.08] transition-colors"
          >
            {isVi ? 'Liên hệ hỗ trợ' : 'Contact Support'}
          </Link>
          <Link
            to="/buy"
            className="px-6 py-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-[#F5F0E6] font-semibold text-[14px] border border-white/[0.08] transition-colors"
          >
            {isVi ? 'Xem bất động sản' : 'Browse Properties'}
          </Link>
        </div>
      </div>
    </PageShell>
  );
};

export default AboutPage;
