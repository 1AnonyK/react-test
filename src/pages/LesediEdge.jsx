// pages/LesediEdge.jsx
//
// This component provides a minimal home dashboard for the Lesedi Edge
// application. It lays out the primary modules around a circular ring and
// includes a center orb which navigates to the chat page. Additional
// navigation links are provided via the sidebar. Your team should build upon
// this skeleton to implement the full dark/light mode toggle, file uploads,
// voice support and other advanced features.

import React from 'react';
import { Link } from 'react-router-dom';

const MODULES = [
  { name: 'Ancestry', path: '/Ancestry' },
  { name: 'Ubuntu Self', path: '/UbuntuSelf' },
  { name: 'Career', path: '/Career' },
  { name: 'Research', path: '/ResearchDevelopment' },
  { name: 'Culinary', path: '/Culinary' },
  { name: 'Business', path: '/Business' },
  { name: 'Doctor AI', path: '/DoctorAI' },
];

export default function LesediEdge() {
  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <nav className="w-60 border-r p-4 space-y-4">
        <h1 className="text-xl font-bold">Lesedi Edge</h1>
        <Link to="/" className="block py-2 hover:underline">Dashboard</Link>
        <Link to="/MyPaths" className="block py-2 hover:underline">My Paths</Link>
        <Link to="/Archives" className="block py-2 hover:underline">Archives</Link>
        <Link to="/Timeline" className="block py-2 hover:underline">Timeline</Link>
        <Link to="/LesediVault" className="block py-2 hover:underline">Lesedi Vault</Link>
      </nav>
      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center relative">
        {/* Circular ring of modules */}
        <div className="relative w-96 h-96 flex items-center justify-center">
          {MODULES.map((module, index) => {
            const angle = (index / MODULES.length) * Math.PI * 2;
            const x = 40 * Math.cos(angle);
            const y = 40 * Math.sin(angle);
            return (
              <Link
                key={module.name}
                to={module.path}
                className="absolute w-24 h-24 flex items-center justify-center bg-blue-200 dark:bg-blue-700 rounded-full text-center p-2 hover:bg-blue-300 dark:hover:bg-blue-600"
                style={{ transform: `translate(${x}px, ${y}px)` }}
              >
                {module.name}
              </Link>
            );
          })}
          {/* Center orb linking to chat */}
          <Link to="/Chat" className="absolute w-28 h-28 flex items-center justify-center bg-green-500 text-white rounded-full hover:bg-green-600">
            Chat
          </Link>
        </div>
        {/* Placeholder for additional dashboard content */}
        <p className="mt-8 text-gray-600 dark:text-gray-400 max-w-prose text-center">
          Welcome to Lesedi Edge. Select a module from the ring or use the center orb to start chatting with the AI assistant.
        </p>
      </main>
    </div>
  );
}
