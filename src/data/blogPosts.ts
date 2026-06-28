import type { Language } from '../types/types';

export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  category: string;
  excerpt: string;
  content: string;
  image: string;
  author: string;
  titleVi?: string;
  dateVi?: string;
  categoryVi?: string;
  excerptVi?: string;
  contentVi?: string;
}

export const localizeBlogPost = (post: BlogPost, lang: Language): BlogPost => {
  if (lang !== 'vi') return post;
  return {
    ...post,
    title: post.titleVi ?? post.title,
    date: post.dateVi ?? post.date,
    category: post.categoryVi ?? post.category,
    excerpt: post.excerptVi ?? post.excerpt,
    content: post.contentVi ?? post.content,
  };
};

export const blogPosts: BlogPost[] = [
  {
    slug: 'us-real-estate-market-outlook-2026',
    title: 'U.S. Real Estate Market Outlook 2026',
    titleVi: 'Triển vọng thị trường bất động sản Hoa Kỳ 2026',
    date: 'May 15, 2026',
    dateVi: '15 tháng 5, 2026',
    category: 'Market Analysis',
    categoryVi: 'Phân tích thị trường',
    excerpt:
      'An in-depth look at where the U.S. housing market is headed in 2026, from interest rate trends to regional hotspots.',
    excerptVi:
      'Góc nhìn chuyên sâu về hướng đi của thị trường nhà ở Hoa Kỳ năm 2026, từ xu hướng lãi suất đến các khu vực tăng trưởng nổi bật.',
    content: `The U.S. real estate market in 2026 is shaped by a unique convergence of economic forces. After years of elevated mortgage rates, the Federal Reserve's gradual easing cycle has brought 30-year fixed rates closer to 5.5%, reigniting buyer demand in markets that had cooled significantly. Inventory remains tight in coastal metros like San Francisco and Boston, but Sun Belt cities-particularly Austin, Nashville, and Tampa-are seeing a healthier balance between supply and demand, giving buyers more negotiating power than they've had since 2019.

Nationally, home prices are projected to appreciate between 3% and 5% year-over-year, a return to more sustainable growth after the double-digit surges of the early 2020s. New construction has picked up thanks to easing material costs and streamlined permitting in several states, but single-family starts still lag behind household formation. This structural undersupply continues to put a floor under prices, particularly for starter homes in the $250,000-$400,000 range where demand far outpaces available listings.

For investors, the multifamily sector remains a bright spot. Rental demand is robust in metros with strong job growth, and cap rates have stabilized after compressing through much of the previous cycle. Markets like Raleigh, Phoenix, and Salt Lake City are attracting institutional capital due to favorable demographics and pro-business regulatory environments. Whether you're a first-time buyer or a seasoned investor, understanding these macro trends is essential to making informed decisions in 2026's evolving landscape.`,
    contentVi: `Thị trường bất động sản Hoa Kỳ năm 2026 được định hình bởi nhiều lực kéo kinh tế cùng lúc. Sau giai đoạn lãi vay mua nhà duy trì ở mức cao, chu kỳ nới lỏng dần của Cục Dự trữ Liên bang đã đưa lãi suất cố định 30 năm tiến gần 5,5%, giúp nhu cầu mua nhà quay lại tại những thị trường từng nguội đi rõ rệt. Nguồn cung vẫn hạn chế ở các đô thị ven biển như San Francisco và Boston, trong khi nhiều thành phố Sun Belt, đặc biệt Austin, Nashville và Tampa, đang cân bằng hơn giữa cung và cầu, tạo thêm lợi thế đàm phán cho người mua so với giai đoạn trước.

Trên toàn quốc, giá nhà được dự báo tăng khoảng 3% đến 5% so với cùng kỳ, trở lại nhịp tăng bền vững hơn sau các đợt tăng hai chữ số đầu thập niên 2020. Hoạt động xây mới cải thiện nhờ chi phí vật liệu hạ nhiệt và thủ tục cấp phép được đơn giản hóa tại một số bang, nhưng nguồn cung nhà riêng vẫn chưa theo kịp tốc độ hình thành hộ gia đình. Tình trạng thiếu cung mang tính cấu trúc này tiếp tục nâng đỡ mặt bằng giá, nhất là phân khúc nhà khởi điểm.

Với nhà đầu tư, phân khúc căn hộ cho thuê vẫn là điểm sáng. Nhu cầu thuê ổn định ở các đô thị có tăng trưởng việc làm tốt, trong khi tỷ suất vốn hóa đã bớt biến động sau thời gian dài bị nén. Các thị trường như Raleigh, Phoenix và Salt Lake City thu hút dòng vốn tổ chức nhờ nhân khẩu học thuận lợi và môi trường kinh doanh cởi mở. Dù bạn là người mua lần đầu hay nhà đầu tư giàu kinh nghiệm, nắm rõ các xu hướng vĩ mô sẽ giúp ra quyết định tốt hơn trong bối cảnh 2026.`,
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80',
    author: 'So Do Van Phuc Research',
  },
  {
    slug: 'buying-property-california',
    title: 'A Complete Guide to Buying Property in California',
    titleVi: 'Hướng dẫn đầy đủ khi mua bất động sản tại California',
    date: 'April 28, 2026',
    dateVi: '28 tháng 4, 2026',
    category: 'Buying Guide',
    categoryVi: 'Hướng dẫn mua',
    excerpt:
      'Everything you need to know about purchasing real estate in California, from disclosure laws to closing costs.',
    excerptVi:
      'Những điều cần biết khi mua bất động sản tại California, từ quy định công bố thông tin đến chi phí hoàn tất giao dịch.',
    content: `California remains one of the most desirable-and complex-real estate markets in the United States. Whether you're eyeing a beachfront condo in San Diego, a Victorian in San Francisco, or a sprawling ranch in the Central Valley, the Golden State demands that buyers come prepared. The median home price statewide hovers around $780,000, though prices vary dramatically by region. Coastal counties like Orange, Santa Barbara, and Marin routinely see median prices above $1 million, while inland areas like Fresno and Bakersfield offer entry points below $400,000.

One of the most important aspects of buying in California is the state's rigorous disclosure requirements. Sellers are required to complete a Transfer Disclosure Statement (TDS) and a Natural Hazard Disclosure (NHD), which covers earthquake fault zones, flood plains, fire hazard severity zones, and more. Buyers should also be aware of Mello-Roos taxes-special assessments common in newer developments that can add thousands of dollars to annual property tax bills. Working with a California-licensed real estate attorney or an experienced agent who understands these nuances is highly recommended.

Closing costs in California typically range from 1% to 3% of the purchase price for buyers, covering title insurance, escrow fees, and recording charges. Many buyers also opt for a home warranty, which costs $300 to $600 annually and covers major systems and appliances. With Proposition 13 capping property tax increases at 2% per year from the purchase price, long-term homeowners benefit from predictable tax bills. For those relocating from out of state, California's combination of lifestyle, economic opportunity, and long-term appreciation potential continues to make it a compelling place to invest in real estate.`,
    contentVi: `California vẫn là một trong những thị trường bất động sản hấp dẫn nhưng cũng phức tạp nhất tại Hoa Kỳ. Dù bạn đang tìm căn hộ ven biển ở San Diego, nhà cổ tại San Francisco hay trang trại rộng ở Central Valley, người mua cần chuẩn bị kỹ trước khi xuống tiền. Giá nhà trung vị toàn bang dao động quanh 780.000 USD, nhưng chênh lệch theo khu vực rất lớn. Các quận ven biển như Orange, Santa Barbara và Marin thường vượt mốc 1 triệu USD, trong khi Fresno hoặc Bakersfield có điểm vào dễ tiếp cận hơn.

Một điểm rất quan trọng khi mua nhà tại California là yêu cầu công bố thông tin nghiêm ngặt. Người bán phải hoàn thành các biểu mẫu như Transfer Disclosure Statement và Natural Hazard Disclosure, bao gồm thông tin về vùng đứt gãy động đất, ngập lụt, nguy cơ cháy rừng và nhiều yếu tố khác. Người mua cũng nên lưu ý thuế Mello-Roos, một khoản đánh giá đặc biệt thường gặp ở các dự án mới và có thể làm tăng đáng kể chi phí hằng năm.

Chi phí hoàn tất giao dịch tại California thường nằm trong khoảng 1% đến 3% giá mua đối với người mua, bao gồm bảo hiểm quyền sở hữu, phí escrow và phí ghi nhận. Nhiều người mua cũng chọn bảo hành nhà để bảo vệ các hệ thống và thiết bị chính. Nhờ Proposition 13 giới hạn mức tăng thuế bất động sản hằng năm, chủ nhà dài hạn có thể dự đoán chi phí thuế tốt hơn. Với người chuyển đến từ bang khác, California vẫn là thị trường đáng cân nhắc nhờ lối sống, cơ hội kinh tế và tiềm năng tăng giá dài hạn.`,
    image: 'https://images.unsplash.com/photo-1449844908441-8829872d2607?w=800&q=80',
    author: 'Sarah Mitchell',
  },
  {
    slug: 'renting-in-new-york',
    title: 'Renting in New York: What You Need to Know',
    titleVi: 'Thuê nhà tại New York: Những điều cần biết',
    date: 'April 10, 2026',
    dateVi: '10 tháng 4, 2026',
    category: 'Rental Guide',
    categoryVi: 'Hướng dẫn thuê',
    excerpt:
      'Navigating the New York rental market can be daunting. Here is your essential guide to finding and securing an apartment.',
    excerptVi:
      'Thị trường thuê nhà New York có thể rất cạnh tranh. Đây là hướng dẫn thiết yếu để tìm và giữ được căn hộ phù hợp.',
    content: `Renting in New York City is an experience unlike any other housing market in the country. With a vacancy rate that hovers around 3% in Manhattan and even lower in sought-after Brooklyn neighborhoods like Park Slope and Williamsburg, competition for quality apartments is fierce. Most listings move within days-sometimes hours-of hitting the market, so prospective tenants need to have their documentation ready before they start touring. This typically includes proof of income (40 times the monthly rent in annual salary), tax returns, bank statements, a credit report, and references from previous landlords.

The costs of renting in New York extend well beyond the monthly rent. Broker fees, while increasingly contested, remain common and can amount to one month's rent or 15% of the annual lease value. Security deposits are capped at one month's rent under the Housing Stability and Tenant Protection Act of 2019, and landlords can no longer charge last month's rent upfront. Rent-stabilized apartments-roughly one million units across the five boroughs-offer below-market rates and guaranteed lease renewals, but finding one often requires patience, persistence, and a bit of luck. Websites like StreetEasy, Apartments.com, and even direct outreach to building management companies can surface these opportunities.

Beyond Manhattan, renters are increasingly exploring neighborhoods in Queens (Astoria, Long Island City), the Bronx (Riverdale, Mott Haven), and even Jersey City and Hoboken across the Hudson for more space at lower price points. Transit access is the key variable-proximity to a subway line can mean the difference between a 20-minute commute and an hour-long journey. For newcomers, starting with a flexible short-term lease or a roommate situation can provide valuable time to learn the city's geography and find the neighborhood that truly fits your lifestyle.`,
    contentVi: `Thuê nhà tại New York City là trải nghiệm rất khác so với hầu hết thị trường nhà ở khác tại Hoa Kỳ. Tỷ lệ trống thấp ở Manhattan và nhiều khu vực được săn đón tại Brooklyn khiến cuộc cạnh tranh cho căn hộ tốt diễn ra rất nhanh. Nhiều tin đăng có thể biến mất chỉ sau vài ngày, thậm chí vài giờ, vì vậy người thuê nên chuẩn bị sẵn hồ sơ trước khi đi xem nhà. Hồ sơ thường gồm chứng minh thu nhập, báo cáo tín dụng, sao kê ngân hàng và thông tin tham chiếu từ chủ nhà cũ.

Chi phí thuê ở New York không chỉ dừng ở tiền thuê hằng tháng. Phí môi giới vẫn khá phổ biến và có thể bằng một tháng tiền thuê hoặc một tỷ lệ đáng kể của giá trị hợp đồng năm. Tiền đặt cọc được giới hạn ở một tháng tiền thuê theo luật hiện hành, và chủ nhà không còn được thu trước tháng thuê cuối cùng. Căn hộ rent-stabilized có mức giá dễ chịu hơn và quyền gia hạn thuê tốt hơn, nhưng để tìm được thường cần kiên nhẫn và theo dõi sát thị trường.

Ngoài Manhattan, người thuê ngày càng quan tâm đến Queens, Bronx, Jersey City và Hoboken để có thêm diện tích với mức giá hợp lý hơn. Khả năng kết nối giao thông là yếu tố then chốt, vì khoảng cách đến tuyến tàu có thể tạo khác biệt lớn trong thời gian đi làm. Với người mới đến, bắt đầu bằng hợp đồng linh hoạt hoặc ở cùng người khác có thể giúp bạn có thời gian hiểu thành phố và chọn đúng khu vực phù hợp với lối sống.`,
    image: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800&q=80',
    author: 'David Chen',
  },
  {
    slug: 'mortgage-basics-first-time-buyers',
    title: 'Mortgage Basics for First-Time Home Buyers',
    titleVi: 'Kiến thức vay mua nhà cho người mua lần đầu',
    date: 'March 22, 2026',
    dateVi: '22 tháng 3, 2026',
    category: 'Finance',
    categoryVi: 'Tài chính',
    excerpt:
      'Understanding mortgages does not have to be overwhelming. Learn about loan types, rates, and how to get pre-approved.',
    excerptVi:
      'Vay mua nhà không nhất thiết phải phức tạp. Tìm hiểu các loại khoản vay, lãi suất và cách xin chấp thuận trước.',
    content: `For first-time home buyers, understanding the mortgage landscape is one of the most critical steps in the purchasing journey. A mortgage is simply a loan secured by real property, and lenders evaluate your application based on three primary factors: credit score, debt-to-income ratio (DTI), and down payment. A credit score of 740 or above will qualify you for the best conventional rates, while FHA loans-backed by the Federal Housing Administration-allow scores as low as 580 with a 3.5% down payment. Conventional loans typically require 5% to 20% down, though programs like Fannie Mae's HomeReady and Freddie Mac's Home Possible offer 3% down options for qualified buyers.

The two most common loan structures are fixed-rate and adjustable-rate mortgages (ARMs). A 30-year fixed-rate mortgage locks in your interest rate for the life of the loan, providing predictable monthly payments. A 5/1 ARM offers a lower initial rate that adjusts annually after the first five years-this can be advantageous if you plan to sell or refinance before the adjustment period begins. In 2026, with rates in the mid-5% range, many buyers are opting for fixed-rate products to lock in certainty, though ARMs remain popular among buyers in high-cost markets who anticipate moving within five to seven years.

Getting pre-approved before you start house hunting is essential. Pre-approval involves a lender reviewing your financial documents and issuing a letter stating how much they're willing to lend. This not only clarifies your budget but also signals to sellers that you're a serious, qualified buyer-a significant advantage in competitive markets. Be sure to compare offers from at least three lenders, as even a quarter-point difference in interest rate can translate to tens of thousands of dollars over the life of a 30-year loan. Don't forget to factor in closing costs (typically 2% to 5% of the loan amount), property taxes, homeowner's insurance, and potential HOA fees when calculating your true monthly housing cost.`,
    contentVi: `Với người mua nhà lần đầu, hiểu cơ bản về vay mua nhà là một trong những bước quan trọng nhất. Khoản vay mua nhà là khoản vay được bảo đảm bằng bất động sản, và bên cho vay thường đánh giá hồ sơ dựa trên điểm tín dụng, tỷ lệ nợ trên thu nhập và khoản trả trước. Điểm tín dụng cao giúp bạn tiếp cận lãi suất tốt hơn, trong khi một số chương trình như FHA có thể linh hoạt hơn với người mua mới.

Hai cấu trúc phổ biến nhất là vay lãi suất cố định và vay lãi suất điều chỉnh. Khoản vay cố định 30 năm giúp khóa lãi suất trong suốt thời hạn vay, tạo sự ổn định cho khoản thanh toán hằng tháng. Khoản vay điều chỉnh có thể có lãi suất ban đầu thấp hơn nhưng sẽ thay đổi sau một giai đoạn nhất định, phù hợp hơn nếu bạn dự định bán hoặc tái cấp vốn trước khi lãi suất điều chỉnh.

Xin chấp thuận trước trước khi tìm nhà là bước rất nên làm. Chấp thuận trước giúp bạn biết ngân sách thực tế và cho người bán thấy bạn là người mua nghiêm túc. Hãy so sánh đề nghị từ nhiều bên cho vay, vì chỉ một chênh lệch nhỏ về lãi suất cũng có thể tạo ra khác biệt lớn trong tổng chi phí dài hạn. Đừng quên tính thêm chi phí hoàn tất giao dịch, thuế bất động sản, bảo hiểm nhà và phí HOA nếu có.`,
    image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80',
    author: 'Michael Torres',
  },
  {
    slug: 'sodovanphuc-investor-guide',
    title: 'So Do Van Phuc Investor Guide: Building Wealth Through Real Estate',
    titleVi: 'Hướng dẫn nhà đầu tư So Do Van Phuc: Xây dựng tài sản qua bất động sản',
    date: 'March 5, 2026',
    dateVi: '5 tháng 3, 2026',
    category: 'Investment',
    categoryVi: 'Đầu tư',
    excerpt:
      'How to leverage the So Do Van Phuc platform to identify high-value investment opportunities and build a diversified real estate portfolio.',
    excerptVi:
      'Cách tận dụng So Do Van Phuc để tìm cơ hội đầu tư giá trị cao và xây dựng danh mục bất động sản đa dạng.',
    content: `Real estate has long been one of the most reliable vehicles for building generational wealth, and the So Do Van Phuc platform is designed to give investors the tools and insights they need to capitalize on today's opportunities. Whether you're acquiring your first rental property or scaling a portfolio of multifamily assets, the fundamentals remain the same: buy in markets with strong job growth, favorable supply-demand dynamics, and landlord-friendly regulations. Cities like Charlotte, Indianapolis, and Columbus consistently rank among the best markets for cash-flow-positive rental investments, offering cap rates between 6% and 8% with strong tenant demand.

Diversification is key to a resilient real estate portfolio. Rather than concentrating all capital in a single market or property type, savvy investors spread risk across geographies and asset classes-combining single-family rentals with small multifamily buildings, or balancing long-term holds with value-add renovation projects. The So Do Van Phuc platform aggregates listing data, market analytics, and community insights to help investors compare opportunities across regions. Our verified agent network can connect you with local expertise in any market, ensuring you have boots-on-the-ground knowledge before committing capital.

Financing strategy is another critical component. Many investors use conventional investment property loans (typically requiring 20-25% down with rates about 0.5% higher than primary residence mortgages), while more experienced operators leverage commercial loans, DSCR (Debt Service Coverage Ratio) products, or even private capital for larger deals. The 1031 exchange remains one of the most powerful tools in an investor's arsenal, allowing you to defer capital gains taxes by reinvesting sale proceeds into a like-kind property within strict timelines. At So Do Van Phuc, we believe that informed investors make better decisions-explore our market reports, connect with our community, and start building your path to financial freedom through real estate.`,
    contentVi: `Bất động sản từ lâu là một trong những kênh đáng tin cậy để xây dựng tài sản qua nhiều thế hệ, và So Do Van Phuc được thiết kế để cung cấp cho nhà đầu tư công cụ cũng như góc nhìn cần thiết. Dù bạn đang mua bất động sản cho thuê đầu tiên hay mở rộng danh mục căn hộ nhiều hộ, nguyên tắc cốt lõi vẫn là chọn thị trường có tăng trưởng việc làm tốt, cung cầu lành mạnh và môi trường cho thuê thuận lợi.

Đa dạng hóa là yếu tố quan trọng của một danh mục bền vững. Thay vì dồn toàn bộ vốn vào một thị trường hoặc một loại tài sản, nhà đầu tư có kinh nghiệm phân bổ rủi ro theo khu vực và phân khúc, kết hợp nhà cho thuê đơn lẻ, tòa nhà nhỏ nhiều căn hoặc các dự án cải tạo tăng giá trị. So Do Van Phuc tổng hợp dữ liệu tin đăng, phân tích thị trường và hiểu biết cộng đồng để giúp nhà đầu tư so sánh cơ hội giữa nhiều khu vực.

Chiến lược tài chính cũng rất quan trọng. Nhiều nhà đầu tư dùng khoản vay bất động sản đầu tư truyền thống với tỷ lệ trả trước cao hơn, trong khi nhà đầu tư kinh nghiệm có thể dùng khoản vay thương mại, sản phẩm DSCR hoặc vốn tư nhân cho thương vụ lớn hơn. 1031 exchange vẫn là một công cụ mạnh tại Hoa Kỳ để hoãn thuế lãi vốn khi tái đầu tư đúng quy định. Tại So Do Van Phuc, chúng tôi tin rằng nhà đầu tư có thông tin tốt sẽ ra quyết định tốt hơn.`,
    image: 'https://images.unsplash.com/photo-1460472178825-e5240623afd5?w=800&q=80',
    author: 'So Do Van Phuc Editorial',
  },
];
