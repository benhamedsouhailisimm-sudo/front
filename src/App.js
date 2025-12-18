import { Route, Routes } from 'react-router-dom';
import Admin from './Admin';
import GenerateAllQR from './GenerateQRPage';
import GetQRByEmail from './GetQrByemail';
import Home from './Home';
import FetchAll from './FetchAll.js';
import Login from './Login';
import ProtectedRoute from './ProtectedRoute';
import Responsable from './Responsable';
import Scanner from './Scanner';
import ProtectedLayout from './ProtectedLayout';
import './App.css'

function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Login />} />
      <Route path="/getall" element={<FetchAll/>}/>


      {/* Home (any logged user) */}
      <Route
        path="/home"
        element={
          <ProtectedRoute>
            <ProtectedLayout>
              <Home />
            </ProtectedLayout>
          </ProtectedRoute>
        }
      />

      {/* Admin */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <ProtectedLayout>
              <Admin />
            </ProtectedLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/generate-all-qr"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <ProtectedLayout>
              <GenerateAllQR />
            </ProtectedLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/get-qr"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <ProtectedLayout>
              <GetQRByEmail />
            </ProtectedLayout>
          </ProtectedRoute>
        }
      />

      {/* Responsable */}
      <Route
        path="/responsable"
        element={
          <ProtectedRoute allowedRoles={['group_responsible']}>
            <ProtectedLayout>
              <Responsable />
            </ProtectedLayout>
          </ProtectedRoute>
        }
      />

      {/* Scanner */}
      <Route
        path="/scanner"
        element={
          <ProtectedRoute allowedRoles={['scanner']}>
            <ProtectedLayout>
              <Scanner />
            </ProtectedLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
