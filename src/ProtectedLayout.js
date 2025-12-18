import MobileNavbar from './MobileNavbar';

export default function ProtectedLayout({ children }) {
  return (
    <>
      <MobileNavbar />
      <div style={{ paddingTop: 70 }}>
        {children}
      </div>
    </>
  );
}
    