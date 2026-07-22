import AuthLanding from '../components/AuthLanding';
import { usePageTitle } from '../hooks/usePageTitle';

export default function RegisterPage() {
  usePageTitle('Đăng ký tài khoản | Sổ Đỏ Vạn Phúc');
  return <AuthLanding initialPanel="register" registrationOnly />;
}
