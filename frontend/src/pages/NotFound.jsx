import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="text-center max-w-md">
        <div className="text-8xl font-black text-primary-100 select-none">404</div>
        <h1 className="text-2xl font-bold text-gray-800 mt-2 mb-2">Page Not Found</h1>
        <p className="text-gray-500 mb-6">The page you're looking for doesn't exist or has been moved.</p>
        <Link to="/" className="btn-primary inline-flex items-center gap-2">
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
