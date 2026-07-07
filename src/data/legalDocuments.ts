export type LegalDocumentType = 'terms' | 'privacy';

export interface LegalSection {
  title: string;
  body?: string;
  bullets?: string[];
}

export interface LegalDocument {
  type: LegalDocumentType;
  title: string;
  subtitle: string;
  effectiveDate: string;
  summary: string;
  sections: LegalSection[];
}

export const legalDocuments: Record<LegalDocumentType, LegalDocument> = {
  terms: {
    type: 'terms',
    title: 'Điều khoản sử dụng',
    subtitle: 'Quy định sử dụng hệ thống Sổ Đỏ Vạn Phúc',
    effectiveDate: '30/06/2026',
    summary:
      'Tài liệu này quy định nguyên tắc đăng ký tài khoản, sử dụng dữ liệu, đăng nguồn nhà, quản lý khách hàng và vận hành nội bộ trên hệ thống Sổ Đỏ Vạn Phúc.',
    sections: [
      {
        title: '1. Phạm vi áp dụng',
        body:
          'Điều khoản này áp dụng cho mọi cá nhân, cộng tác viên, chuyên viên, chuyên gia, quản lý, đối tác và quản trị viên truy cập hoặc sử dụng hệ thống Sổ Đỏ Vạn Phúc.',
      },
      {
        title: '2. Tài khoản và thông tin đăng ký',
        bullets: [
          'Người dùng cần cung cấp thông tin trung thực, chính xác và cập nhật khi đăng ký hoặc sử dụng hệ thống.',
          'Một số vai trò có thể được sử dụng ngay sau đăng ký; các vai trò từ cấp Chuyên viên trở lên có thể cần phê duyệt trước khi mở đầy đủ tính năng.',
          'Người dùng chịu trách nhiệm bảo mật tài khoản, mật khẩu và các thao tác phát sinh từ tài khoản của mình.',
        ],
      },
      {
        title: '3. Sử dụng hệ thống đúng mục đích',
        bullets: [
          'Hệ thống phục vụ quản lý nguồn nhà, khách hàng, lịch xem, giới thiệu, vận hành nội bộ và các nghiệp vụ liên quan đến môi giới bất động sản.',
          'Không sử dụng hệ thống để đăng thông tin sai sự thật, xâm phạm quyền của người khác, phát tán nội dung vi phạm pháp luật hoặc gây rối hoạt động hệ thống.',
          'Không tự ý truy cập, khai thác, sao chép hoặc chia sẻ dữ liệu ngoài phạm vi được phân quyền.',
        ],
      },
      {
        title: '4. Dữ liệu nguồn nhà, khách hàng và giao dịch',
        bullets: [
          'Người nhập dữ liệu có trách nhiệm kiểm tra tính chính xác của thông tin trước khi lưu hoặc gửi duyệt.',
          'Thông tin nguồn nhà, khách hàng, lịch xem và ghi chú nghiệp vụ chỉ được sử dụng cho mục đích vận hành, chăm sóc, đối soát và xử lý giao dịch trong hệ thống.',
          'Các thao tác quan trọng có thể được ghi nhận vào nhật ký hệ thống để phục vụ kiểm tra, phân quyền, bảo mật và đối soát khi cần.',
        ],
      },
      {
        title: '5. Phân quyền và phê duyệt',
        bullets: [
          'Quyền sử dụng được cấp theo vai trò, trạng thái tài khoản và phạm vi dữ liệu do quản trị hệ thống cấu hình.',
          'Quản trị viên có thể tạm khóa, thu hồi quyền, yêu cầu bổ sung thông tin hoặc từ chối tài khoản nếu phát hiện vi phạm hoặc thông tin không phù hợp.',
          'Người dùng không được lợi dụng quyền được cấp để truy cập dữ liệu không thuộc phạm vi công việc.',
        ],
      },
      {
        title: '6. Nội dung, tài liệu và tệp đính kèm',
        bullets: [
          'Người dùng chỉ tải lên nội dung, hình ảnh, tài liệu hoặc tệp đính kèm có quyền sử dụng hợp pháp.',
          'Không tải lên giấy tờ, dữ liệu cá nhân hoặc tài liệu nhạy cảm của người khác nếu chưa có căn cứ phù hợp hoặc chưa được cho phép.',
          'Hệ thống có thể từ chối, ẩn hoặc xóa nội dung vi phạm quy định vận hành hoặc quy định pháp luật.',
        ],
      },
      {
        title: '7. Tính năng AI và tự động hóa',
        body:
          'Các tính năng AI, nếu được bật, chỉ có vai trò hỗ trợ gợi ý, kiểm tra, phân loại, tìm kiếm hoặc tạo nội dung. Người dùng vẫn cần tự kiểm tra trước khi sử dụng kết quả AI cho giao dịch, tư vấn hoặc quyết định nghiệp vụ.',
      },
      {
        title: '8. Tạm ngừng, thay đổi hoặc bảo trì dịch vụ',
        body:
          'Sổ Đỏ Vạn Phúc có thể bảo trì, nâng cấp, thay đổi giao diện, điều chỉnh tính năng hoặc tạm ngừng một phần dịch vụ để bảo đảm an toàn, hiệu năng và khả năng vận hành.',
      },
      {
        title: '9. Luật áp dụng và xử lý tranh chấp',
        body:
          'Việc sử dụng hệ thống được hiểu và áp dụng theo quy định pháp luật Việt Nam. Các bên ưu tiên trao đổi, đối soát và giải quyết thiện chí trước khi sử dụng các phương thức xử lý tranh chấp khác theo quy định pháp luật.',
      },
      {
        title: '10. Liên hệ',
        body:
          'Nếu cần hỗ trợ về tài khoản, dữ liệu hoặc điều khoản sử dụng, vui lòng liên hệ đội vận hành Sổ Đỏ Vạn Phúc qua email info@hocvienvanphuc.edu.vn hoặc hotline được công bố trên hệ thống.',
      },
    ],
  },
  privacy: {
    type: 'privacy',
    title: 'Chính sách bảo mật',
    subtitle: 'Cách Sổ Đỏ Vạn Phúc thu thập, sử dụng và bảo vệ dữ liệu',
    effectiveDate: '30/06/2026',
    summary:
      'Chính sách này giải thích loại dữ liệu được xử lý, mục đích sử dụng, phạm vi chia sẻ, thời gian lưu trữ và quyền của người dùng khi sử dụng hệ thống.',
    sections: [
      {
        title: '1. Loại dữ liệu có thể được thu thập',
        bullets: [
          'Thông tin tài khoản: họ tên, số điện thoại, email, mật khẩu đã mã hóa, mã giới thiệu, vai trò và trạng thái phê duyệt.',
          'Thông tin nghiệp vụ: nguồn nhà, nhu cầu mua, khách hàng, lịch xem, ghi chú, trạng thái xử lý, tệp đính kèm và lịch sử thao tác.',
          'Thông tin kỹ thuật: thời gian đăng nhập, thiết bị, địa chỉ IP, trình duyệt, nhật ký hệ thống và dữ liệu cần thiết để bảo mật, vận hành.',
        ],
      },
      {
        title: '2. Mục đích sử dụng dữ liệu',
        bullets: [
          'Tạo và quản lý tài khoản, xác thực người dùng, phân quyền và phê duyệt vai trò.',
          'Vận hành các nghiệp vụ quản lý nguồn nhà, khách hàng, lịch xem, giới thiệu, báo cáo và chăm sóc người dùng.',
          'Bảo mật hệ thống, phát hiện hành vi bất thường, đối soát thao tác và xử lý yêu cầu hỗ trợ.',
          'Cải thiện sản phẩm, tối ưu trải nghiệm và phát triển các tính năng hỗ trợ như tìm kiếm, gợi ý hoặc AI theo phạm vi được cấu hình.',
        ],
      },
      {
        title: '3. Căn cứ xử lý và sự đồng ý',
        body:
          'Khi đăng ký, đăng nhập hoặc tiếp tục sử dụng hệ thống, người dùng xác nhận đã đọc và đồng ý để Sổ Đỏ Vạn Phúc xử lý dữ liệu cần thiết cho mục đích vận hành hệ thống. Việc xử lý dữ liệu được thực hiện theo nguyên tắc đúng mục đích, giới hạn phạm vi cần thiết, bảo mật và phù hợp quy định pháp luật Việt Nam về bảo vệ dữ liệu cá nhân, an toàn thông tin mạng và giao dịch điện tử.',
      },
      {
        title: '4. Chia sẻ dữ liệu',
        bullets: [
          'Dữ liệu chỉ được hiển thị cho người dùng nội bộ hoặc đối tác được phân quyền theo vai trò và phạm vi dữ liệu phù hợp.',
          'Sổ Đỏ Vạn Phúc không bán dữ liệu cá nhân của người dùng.',
          'Dữ liệu có thể được xử lý bởi đơn vị cung cấp hạ tầng, lưu trữ, email, bảo mật hoặc công cụ kỹ thuật cần thiết cho việc vận hành hệ thống.',
          'Trong trường hợp pháp luật yêu cầu, dữ liệu có thể được cung cấp cho cơ quan có thẩm quyền theo đúng trình tự, phạm vi và căn cứ hợp pháp.',
        ],
      },
      {
        title: '5. Bảo mật dữ liệu',
        bullets: [
          'Hệ thống áp dụng phân quyền tài khoản, nhật ký thao tác, cơ chế xác thực và các biện pháp kỹ thuật phù hợp để hạn chế truy cập trái phép.',
          'Mật khẩu được lưu ở dạng đã mã hóa hoặc băm, không hiển thị lại dưới dạng văn bản gốc.',
          'Người dùng cần tự bảo vệ thiết bị, mật khẩu, mã truy cập và thông báo ngay khi nghi ngờ tài khoản bị lộ hoặc bị sử dụng trái phép.',
        ],
      },
      {
        title: '6. Lưu trữ và xóa dữ liệu',
        bullets: [
          'Dữ liệu được lưu trong thời gian cần thiết để cung cấp dịch vụ, phục vụ đối soát, bảo mật, giải quyết khiếu nại hoặc đáp ứng yêu cầu pháp luật.',
          'Một số nhật ký hệ thống, dữ liệu giao dịch hoặc thông tin đã phát sinh nghiệp vụ có thể không được xóa ngay nếu cần giữ để đối soát, bảo vệ quyền lợi hợp pháp hoặc tuân thủ quy định.',
          'Khi không còn cần thiết, dữ liệu có thể được xóa, ẩn, ẩn danh hoặc lưu trữ hạn chế theo chính sách vận hành.',
        ],
      },
      {
        title: '7. Quyền của người dùng',
        bullets: [
          'Người dùng có thể yêu cầu xem, cập nhật, chỉnh sửa hoặc bổ sung thông tin tài khoản khi phát hiện sai lệch.',
          'Người dùng có thể yêu cầu hỗ trợ khóa tài khoản, hạn chế xử lý hoặc xem xét xóa dữ liệu trong phạm vi phù hợp với quy định pháp luật và yêu cầu vận hành.',
          'Các yêu cầu liên quan đến dữ liệu sẽ được tiếp nhận, kiểm tra quyền yêu cầu và xử lý trong thời gian hợp lý.',
        ],
      },
      {
        title: '8. Dữ liệu của bên thứ ba',
        body:
          'Nếu người dùng nhập thông tin chủ nhà, khách mua, đối tác hoặc người được giới thiệu, người dùng cần bảo đảm có căn cứ phù hợp để cung cấp thông tin đó cho hệ thống và chỉ nhập dữ liệu cần thiết cho mục đích nghiệp vụ.',
      },
      {
        title: '9. Thay đổi chính sách',
        body:
          'Chính sách bảo mật có thể được cập nhật khi hệ thống thay đổi tính năng, quy trình vận hành hoặc khi quy định pháp luật có thay đổi. Phiên bản mới sẽ được công bố trên hệ thống.',
      },
      {
        title: '10. Liên hệ về dữ liệu cá nhân',
        body:
          'Mọi yêu cầu liên quan đến dữ liệu cá nhân hoặc bảo mật vui lòng gửi về info@hocvienvanphuc.edu.vn hoặc kênh hỗ trợ được công bố trên hệ thống.',
      },
    ],
  },
};
