import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const storedUser = localStorage.getItem('user');

  if (!storedUser) {
    // Not logged in
    return <Navigate to="/" replace />;
  }

  let userData;
  try {
    userData = JSON.parse(storedUser);
  } catch {
    // Invalid JSON
    localStorage.removeItem('user');
    return <Navigate to="/" replace />;
  }

  // Only check roles if allowedRoles is not empty
  if (allowedRoles.length > 0 && !allowedRoles.includes(userData.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
