// src/components/Navbar.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/logo/Fisto_logo.png';
import { User, Share2, Save, Download, Eye } from 'lucide-react';
import ProfileModal from './ProfileModal';

const Navbar = ({ onExport, isDoublePage, setIsDoublePage, onPreview }) => {
  const [autoSaveTime, setAutoSaveTime] = useState('00:32');
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Auto-save timer
  const updateTime = useCallback(() => {
    const now = new Date();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    setAutoSaveTime(`${minutes}:${seconds}`);
  }, []);

  useEffect(() => {
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [updateTime]);

  return (
    <>
      <nav
        className="bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-lg z-50 relative"
        style={{ height: '8vh', minHeight: '60px' }}
      >
        {/* Left Section - Logo and Saved Status */}
        <div className="flex items-center gap-8 min-w-[200px]">
          <Link to="/" className="shrink-0">
            <img
              className="h-10 w-auto object-contain"
              src={logo}
              alt="FIST-O"
            />
          </Link>

          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="text-gray-900 font-medium text-sm">
              Saved
            </span>
            <span className="text-blue-600 text-sm">
              {autoSaveTime} ago
            </span>
          </div>
        </div>

        {/* Center Section - Navigation Links */}
        <div className="flex items-center gap-10">
          {[
            { name: 'Home', path: '/home' },
            { name: 'Help', path: '#' },
            { name: 'Contact Us', path: '#' },
            { name: 'Settings', path: '/settings' }
          ].map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className="text-gray-700 hover:text-black font-medium text-sm transition-colors"
            >
              {item.name}
            </Link>
          ))}
        </div>

        {/* Right Section - Actions */}
        <div className="flex items-center gap-3 min-w-[200px] justify-end">
          {/* Double Page Toggle */}
          <div className="flex items-center gap-2 mr-2">
            <button
              onClick={() => setIsDoublePage && setIsDoublePage(!isDoublePage)}
              className={`
                        relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent 
                        transition-colors duration-200 ease-in-out
                        ${isDoublePage ? 'bg-indigo-600' : 'bg-gray-200'}
                    `}
            >
              <span className="sr-only">Double Page</span>
              <span
                aria-hidden="true"
                className={`
                            pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 
                            transition duration-200 ease-in-out
                            ${isDoublePage ? 'translate-x-4' : 'translate-x-0'}
                        `}
              />
            </button>
            <span className="text-gray-600 font-medium text-xs whitespace-nowrap">Double Page</span>
          </div>

          {/* Preview Button */}
          <button
            onClick={onPreview}
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center justify-center transition-colors px-4 py-2 font-medium text-sm gap-2"
          >
            <Eye size={18} />
            <span>Preview</span>
          </button>

          <div className="h-8 w-px bg-gray-200 mx-2"></div>

          {/* Profile */}
          <button
            onClick={() => setIsProfileOpen(true)}
            className="p-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-gray-700"
            title="Profile"
          >
            <User size={20} />
          </button>

          {/* Share */}
          <button
            className="p-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-gray-700"
            title="Share"
          >
            <Share2 size={20} />
          </button>

          {/* Save */}
          <button
            className="p-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-gray-700"
            title="Save Project"
          >
            <Save size={20} />
          </button>

          {/* Export */}
          <button
            onClick={onExport}
            className="bg-black hover:bg-gray-800 text-white rounded-lg flex items-center justify-center transition-colors px-5 py-2.5 ml-1"
            style={{ gap: '0.5rem' }}
          >
            <Download size={18} />
            <span className="font-medium text-sm">Export</span>
          </button>
        </div>
      </nav>

      {/* Render Profile Modal */}
      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </>
  );
};

export default Navbar;