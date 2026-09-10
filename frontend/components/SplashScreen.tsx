import React from 'react';
import { Sparkles } from 'lucide-react';
import logo from 'figma:asset/612f7289b99c44abc1363d55b6e8ffe9274868e3.png';

export default function SplashScreen() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 animate-fade-in">
      <div className="flex flex-col items-center space-y-6">
        <div className="w-24 h-24 rounded-full flex items-center justify-center">
          <img src={logo} alt="SWA Logo" className="w-24 h-24 object-contain" />
        </div>
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-blue-700">SWA</h1>
          <p className="text-sm text-gray-500">Nurturing New Believers</p>
        </div>
      </div>
      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }
      `}</style>
    </div>
  );
}