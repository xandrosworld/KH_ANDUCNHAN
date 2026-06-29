import AuthLanding from '../components/AuthLanding';
import { usePageTitle } from '../hooks/usePageTitle';

export default function HomePage() {
  usePageTitle('Đăng nhập | Sổ Đỏ Vạn Phúc');
  return <AuthLanding initialPanel="login" />;
}
