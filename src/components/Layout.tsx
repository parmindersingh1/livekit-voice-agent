// src/components/Layout.tsx
import { type ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Navigation Bar */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link to="/" className="text-xl font-bold text-gray-900">
                  AuthApp
                </Link>
              </div>
              {isAuthenticated && (
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                  <Link
                    to="/dashboard"
                    className="border-blue-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    Dashboard
                  </Link>
                  {/* <Link
                    to="/profile"
                    className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    Profile
                  </Link> */}
                </div>
              )}
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:items-center">
              {isAuthenticated ? (
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-gray-700">
                    Welcome, {user?.username}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="px-3 py-1 rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="px-3 py-1 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white shadow mt-auto">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Voice Agent. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}