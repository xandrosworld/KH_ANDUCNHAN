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

const publicNewsSeeds: Array<Pick<PublicNewsPost, 'id' | 'title' | 'body'>> = [
  {
    id: 'public_news_v1',
    title: 'Kết nối nhu cầu mua bán nhà rõ ràng hơn',
    body: 'Với nhà thổ cư, thông tin ban đầu càng rõ thì việc kết nối càng nhanh. Khách mua nên ghi cụ thể khu vực, tầm tài chính, mục đích mua, thời gian dự kiến và những tiêu chí bắt buộc.\n\nChủ nhà cũng nên cung cấp địa chỉ, hiện trạng, pháp lý, giá kỳ vọng và lịch xem nhà phù hợp. Đội ngũ Sổ Đỏ Vạn Phúc tiếp nhận dữ liệu theo từng nhu cầu để giảm nhầm lẫn và phản hồi đúng người phụ trách.',
  },
  {
    id: 'public_news_expert',
    title: 'Nguồn nhà được kiểm tra và lưu trữ tập trung',
    body: 'Một nguồn nhà tốt không chỉ có địa chỉ và giá bán. Thông tin cần được ghi lại theo mã nguồn, khu vực, diện tích, mặt tiền, hướng, hiện trạng, pháp lý và người phụ trách.\n\nKhi dữ liệu được lưu tập trung, đội ngũ tư vấn dễ kiểm tra lịch sử xử lý, tránh hỏi lại nhiều lần và giúp khách mua nhận được thông tin nhất quán hơn.',
  },
  {
    id: 'public_news_referral',
    title: 'Thông tin liên hệ được chuyển đúng người phụ trách',
    body: 'Trong giao dịch thổ cư, cùng một khách hàng có thể trao đổi với nhiều người ở các thời điểm khác nhau. Nếu thông tin không được ghi nhận rõ, đội ngũ rất dễ trùng việc hoặc bỏ sót lịch hẹn.\n\nSổ Đỏ Vạn Phúc ghi nhận nhu cầu, thông tin giới thiệu và người phụ trách để việc chăm sóc khách hàng có mạch theo dõi rõ ràng hơn.',
  },
  {
    id: 'public_news_phap_ly_so_do',
    title: 'Kiểm tra sổ đỏ trước khi đi xem nhà',
    body: 'Sổ đỏ là một trong những thông tin quan trọng nhất khi đánh giá nhà thổ cư. Người mua nên hỏi trước về loại giấy tờ, tên chủ sở hữu, diện tích trên sổ, diện tích sử dụng thực tế và tình trạng thế chấp nếu có.\n\nViệc kiểm tra sớm không thay thế bước rà soát pháp lý chuyên sâu, nhưng giúp hai bên tiết kiệm thời gian và tránh những căn nhà chưa phù hợp với nhu cầu giao dịch.',
  },
  {
    id: 'public_news_kiem_tra_quy_hoach',
    title: 'Quy hoạch và hiện trạng: hai bước không nên bỏ qua',
    body: 'Một căn nhà có thể đẹp về vị trí nhưng vẫn cần kiểm tra thêm thông tin quy hoạch, lộ giới, hiện trạng xây dựng và khả năng sử dụng lâu dài. Đây là những yếu tố ảnh hưởng trực tiếp đến quyết định mua bán.\n\nNgười mua nên ghi lại câu hỏi trước khi xem nhà, còn chủ nhà nên chuẩn bị sẵn thông tin liên quan để quá trình trao đổi minh bạch và nhanh hơn.',
  },
  {
    id: 'public_news_dinh_gia_tho_cu',
    title: 'Định giá nhà thổ cư cần nhìn đủ nhiều góc',
    body: 'Giá nhà thổ cư không chỉ phụ thuộc vào diện tích. Vị trí, độ rộng ngõ, mặt tiền, hình dáng thửa đất, chất lượng xây dựng, pháp lý và thanh khoản khu vực đều có thể tạo khác biệt lớn.\n\nKhi tư vấn giá, nên so sánh với các căn tương đồng và ghi rõ lý do điều chỉnh. Cách làm này giúp chủ nhà đặt kỳ vọng hợp lý hơn và giúp khách mua hiểu vì sao căn nhà có mức giá đó.',
  },
  {
    id: 'public_news_xem_nha_lan_dau',
    title: 'Đi xem nhà lần đầu nên chuẩn bị gì',
    body: 'Trước khi đi xem nhà, khách mua nên xác định rõ ngân sách, nguồn tiền, khu vực ưu tiên và các điểm không thể thỏa hiệp như số phòng ngủ, chỗ để xe hoặc khoảng cách đi làm.\n\nTrong buổi xem, nên chú ý ánh sáng, thông gió, kết cấu, lối vào, tiếng ồn, hàng xóm và khả năng sửa chữa. Ghi chú ngay sau khi xem sẽ giúp việc so sánh giữa các căn chính xác hơn.',
  },
  {
    id: 'public_news_chu_nha_chuan_bi_ban',
    title: 'Chủ nhà chuẩn bị hồ sơ bán nhà thế nào cho gọn',
    body: 'Chủ nhà nên chuẩn bị trước bản chụp sổ đỏ, thông tin diện tích, hiện trạng nhà, ảnh chụp thực tế, lịch xem nhà và mức giá mong muốn. Những thông tin này giúp đội ngũ tư vấn tiếp cận khách mua phù hợp hơn.\n\nNếu căn nhà có điểm cần giải thích như ngõ vào, phần sửa chữa hoặc lịch sử cho thuê, chủ nhà nên nói rõ từ đầu. Minh bạch sớm thường giúp quá trình thương lượng nhẹ nhàng hơn.',
  },
  {
    id: 'public_news_khach_mua_lap_nhu_cau',
    title: 'Khách mua mô tả nhu cầu càng rõ càng dễ tìm đúng nhà',
    body: 'Một yêu cầu mua nhà tốt nên có khu vực, khoảng giá, diện tích mong muốn, mục đích mua, thời gian chốt và các tiêu chí ưu tiên. Nếu có thể, khách mua nên nói rõ tiêu chí nào bắt buộc và tiêu chí nào có thể linh hoạt.\n\nKhi nhu cầu được mô tả rõ, đội ngũ tư vấn không phải gửi quá nhiều căn không phù hợp. Khách mua cũng tiết kiệm thời gian và dễ ra quyết định hơn.',
  },
  {
    id: 'public_news_thuong_luong_gia',
    title: 'Thương lượng giá nhà cần dữ liệu và thiện chí',
    body: 'Thương lượng hiệu quả không chỉ là trả thấp hay giữ giá cao. Hai bên nên dựa trên dữ liệu về căn nhà, mặt bằng khu vực, tình trạng pháp lý, chi phí sửa chữa và mức độ sẵn sàng giao dịch.\n\nMột đề xuất rõ lý do thường dễ được lắng nghe hơn. Khi người mua và chủ nhà cùng hiểu cơ sở của mức giá, cuộc trao đổi sẽ bớt căng thẳng và có khả năng đi đến kết quả hơn.',
  },
  {
    id: 'public_news_dat_coc_an_toan',
    title: 'Đặt cọc mua bán nhà: rõ điều kiện trước khi ký',
    body: 'Trước khi đặt cọc, hai bên nên thống nhất rõ giá bán, thời hạn công chứng, trách nhiệm thuế phí, tình trạng bàn giao, giấy tờ cần chuẩn bị và điều kiện hoàn cọc nếu có.\n\nNội dung đặt cọc nên được đọc kỹ và lưu lại đầy đủ. Với giao dịch giá trị lớn, việc hỏi ý kiến chuyên môn khi cần thiết sẽ giúp các bên yên tâm hơn trước khi ký.',
  },
  {
    id: 'public_news_hem_ngo_mat_tien',
    title: 'Nhà trong ngõ và nhà mặt phố khác nhau ở điểm nào',
    body: 'Nhà mặt phố thường có lợi thế nhận diện, kinh doanh và thanh khoản, nhưng giá cao và có thể ồn hơn. Nhà trong ngõ lại phù hợp với nhu cầu ở yên tĩnh, ngân sách mềm hơn, nhưng cần xem kỹ độ rộng ngõ và khả năng tiếp cận.\n\nKhông có lựa chọn nào đúng cho tất cả mọi người. Điều quan trọng là xác định mục đích mua để ở, cho thuê hay đầu tư trước khi so sánh.',
  },
  {
    id: 'public_news_nha_co_dong_tien',
    title: 'Cách nhìn tiềm năng của một căn nhà thổ cư',
    body: 'Tiềm năng của nhà thổ cư có thể đến từ vị trí, hạ tầng xung quanh, khả năng cải tạo, nhu cầu thuê, hoặc sự khan hiếm nguồn hàng trong khu vực. Tuy vậy, tiềm năng cần được nhìn cùng rủi ro và thời gian nắm giữ.\n\nNgười mua nên tách cảm xúc yêu thích căn nhà khỏi các con số cơ bản. Khi ghi rõ kỳ vọng, chi phí và phương án sử dụng, quyết định mua sẽ chắc tay hơn.',
  },
  {
    id: 'public_news_mua_o_va_dau_tu',
    title: 'Mua để ở và mua đầu tư nên tách tiêu chí',
    body: 'Mua để ở thường ưu tiên sự tiện lợi hằng ngày, môi trường sống, trường học, chỗ để xe và cảm giác phù hợp của gia đình. Mua đầu tư lại cần quan tâm nhiều hơn đến thanh khoản, khả năng cho thuê và biên an toàn về giá.\n\nKhi hai mục tiêu bị trộn lẫn, người mua dễ phân vân. Việc xác định mục tiêu chính ngay từ đầu giúp đội ngũ tư vấn chọn nguồn nhà sát hơn.',
  },
  {
    id: 'public_news_anh_video_nha',
    title: 'Ảnh và video nhà giúp tiết kiệm thời gian cho cả hai bên',
    body: 'Ảnh rõ sáng, đủ góc và video ngắn đi từ ngoài vào trong giúp khách mua hình dung nhanh hiện trạng căn nhà. Chủ nhà nên ưu tiên ảnh thật, không chỉnh sửa quá mức và thể hiện đúng không gian.\n\nVới đội ngũ tư vấn, hình ảnh đầy đủ giúp sàng lọc nhu cầu trước khi hẹn xem. Điều này giảm lịch xem không phù hợp và giúp buổi gặp trực tiếp chất lượng hơn.',
  },
  {
    id: 'public_news_tranh_trung_nguon',
    title: 'Tránh trùng nguồn khi làm việc với cộng tác viên',
    body: 'Nguồn nhà cần được ghi nhận rõ người giới thiệu, thời điểm tiếp nhận, thông tin chủ nhà và trạng thái xử lý. Đây là cách giảm tranh chấp nội bộ và giữ sự công bằng cho cộng tác viên.\n\nKhi mọi nguồn được lưu theo mã và lịch sử xử lý, đội ngũ phụ trách dễ biết ai đang theo việc, nguồn nào cần gọi lại và nguồn nào đã có kết quả.',
  },
  {
    id: 'public_news_cham_soc_khach_mua',
    title: 'Chăm sóc khách mua sau lần tư vấn đầu tiên',
    body: 'Sau buổi tư vấn đầu tiên, điều quan trọng là ghi lại phản hồi của khách mua: thích điểm nào, chưa phù hợp điểm nào, ngân sách có thay đổi không và thời gian ra quyết định ra sao.\n\nNhững ghi chú này giúp lần tư vấn sau sát nhu cầu hơn. Khách mua cũng cảm nhận được sự chuyên nghiệp khi không phải nhắc lại toàn bộ câu chuyện từ đầu.',
  },
  {
    id: 'public_news_hop_dong_trich_thuong',
    title: 'Ghi nhận thỏa thuận phí môi giới cho rõ ràng',
    body: 'Trong một giao dịch có nhiều người tham gia, thỏa thuận phí môi giới và nguyên tắc chia sẻ nên được ghi nhận sớm. Điều này giúp các bên hiểu quyền lợi, trách nhiệm và cách phối hợp.\n\nSự rõ ràng về thỏa thuận không chỉ bảo vệ đội ngũ làm việc mà còn giúp chủ nhà, khách mua yên tâm hơn khi giao dịch qua một hệ thống có quy trình.',
  },
  {
    id: 'public_news_vai_tro_cong_tac_vien',
    title: 'Vai trò cộng tác viên trong hệ thống nguồn nhà',
    body: 'Cộng tác viên có thể hỗ trợ phát hiện nguồn nhà, giới thiệu khách mua hoặc kết nối thông tin tại khu vực quen thuộc. Vai trò này rất hữu ích nếu thông tin được gửi đúng chuẩn và cập nhật thường xuyên.\n\nKhi cộng tác viên làm việc trên cùng một hệ thống, đội ngũ phụ trách dễ phản hồi trạng thái nguồn, tránh bỏ sót công sức và giữ nhịp phối hợp lâu dài.',
  },
  {
    id: 'public_news_du_lieu_minh_bach',
    title: 'Dữ liệu minh bạch giúp giao dịch bớt rủi ro',
    body: 'Giao dịch bất động sản cần sự tin cậy. Dữ liệu càng minh bạch về nguồn nhà, pháp lý, trạng thái chăm sóc và lịch sử trao đổi thì các bên càng dễ kiểm tra lại khi cần.\n\nSổ Đỏ Vạn Phúc hướng tới cách làm rõ người, rõ việc, rõ trạng thái. Khi dữ liệu được chuẩn hóa, đội ngũ tư vấn phục vụ khách hàng nhanh hơn và chuyên nghiệp hơn.',
  },
];

const publicNewsImageById: Record<string, string> = {
  public_news_v1: '/assets/news/news-market-connect.png',
  public_news_expert: '/assets/news/news-source-database.png',
  public_news_referral: '/assets/news/news-team-crm.png',
  public_news_phap_ly_so_do: '/assets/news/news-legal-documents.png',
  public_news_kiem_tra_quy_hoach: '/assets/news/news-planning-map.png',
  public_news_dinh_gia_tho_cu: '/assets/news/news-pricing.png',
  public_news_xem_nha_lan_dau: '/assets/news/news-home-viewing.png',
  public_news_chu_nha_chuan_bi_ban: '/assets/news/news-legal-documents.png',
  public_news_khach_mua_lap_nhu_cau: '/assets/news/news-market-connect.png',
  public_news_thuong_luong_gia: '/assets/news/news-pricing.png',
  public_news_dat_coc_an_toan: '/assets/news/news-deposit-contract.png',
  public_news_hem_ngo_mat_tien: '/assets/news/news-home-viewing.png',
  public_news_nha_co_dong_tien: '/assets/news/news-pricing.png',
  public_news_mua_o_va_dau_tu: '/assets/news/news-planning-map.png',
  public_news_anh_video_nha: '/assets/news/news-home-viewing.png',
  public_news_tranh_trung_nguon: '/assets/news/news-source-database.png',
  public_news_cham_soc_khach_mua: '/assets/news/news-team-crm.png',
  public_news_hop_dong_trich_thuong: '/assets/news/news-deposit-contract.png',
  public_news_vai_tro_cong_tac_vien: '/assets/news/news-team-crm.png',
  public_news_du_lieu_minh_bach: '/assets/news/news-source-database.png',
};

export function getDefaultPublicNewsImage(postId: string) {
  return publicNewsImageById[postId] || '/assets/news/news-market-connect.png';
}

export const defaultPublicNewsPosts: PublicNewsPost[] = publicNewsSeeds.map((post) => ({
  ...post,
  imageUrl: getDefaultPublicNewsImage(post.id),
  videoUrl: '',
  linkUrl: '',
}));

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
