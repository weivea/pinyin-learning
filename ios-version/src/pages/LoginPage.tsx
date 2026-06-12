import { useNavigate } from 'react-router-dom';
import { NicknameLogin } from '../components/NicknameLogin';
import { useUser } from '../hooks/useUser';

export function LoginPage() {
  const { login } = useUser();
  const navigate = useNavigate();
  return (
    <NicknameLogin onLogin={(u) => { login(u); navigate('/'); }} />
  );
}
