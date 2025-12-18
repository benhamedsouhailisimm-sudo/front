import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/', { replace: true }); // redirect to login if not logged in
      return;
    }

    const userData = JSON.parse(storedUser);

    // Redirect based on role
    switch (userData.role) {
      case 'admin':
        navigate('/admin', { replace: true });
        break;
      case 'responsable_group':
        navigate('/responsable', { replace: true });
        break;
      case 'scanner':
        navigate('/scanner', { replace: true });
        break;
      default:
        navigate('/', { replace: true }); // fallback to login if unknown role
        break;
    }
  }, [navigate]);

  return null; // no content, just redirect
}
