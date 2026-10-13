'use client';

import React, { useState } from 'react';
import { Camera, ArrowRight, FileText, UserCheck, Smartphone, Users } from 'lucide-react';
import './globals.css';

export default function SplitCheck() {
  const [permissionGranted, setPermissionGranted] = useState(false);

  const handleCameraClick = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        setPermissionGranted(true);
        alert('Камера успешно активирована!');
        stream.getTracks().forEach(track => track.stop());
      } else {
        alert('Доступ к камере не поддерживается этим устройством или браузером.');
      }
    } catch (error) {
      console.error('Ошибка доступа к камере:', error);
      alert('Пожалуйста, разрешите доступ к камере в настройках браузера.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f12] text-white flex flex-col justify-between p-6 font-sans selection:bg-[#34d399]/30">
      {/* Шапка */}
      <header className="flex justify-between items-center w-full max-w-md mx-auto pt-4">
        <div className="flex items-center gap-2">
          <div className="bg-[#162220] p-2.5 rounded-xl border border-[#233531]">
            <FileText className="w-6 h-6 text-[#34d399]" />
          </div>
          <span className="font-bold text-xl tracking-tight">Сплит-Чек</span>
        </div>
        <div className="flex items-center gap-1.5 bg-[#141b1f] px-3 py-1.5 rounded-full border border-[#1e2930]">
          <span className="w-2 h-2 rounded-full bg-[#34d399] animate-pulse"></span>
          <span className="text-xs text-gray-400 font-medium">всё по-честному</span>
        </div>
      </header>

      {/* Центральный блок */}
      <main className="flex-1 flex flex-col justify-center items-center w-full max-w-md mx-auto my-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-[#141b1f] px-4 py-2 rounded-xl border border-[#1e2930] mb-6">
            <Users className="w-4 h-4 text-[#34d399]" />
            <span className="text-xs uppercase tracking-widest font-semibold text-gray-400">МЕНЬШЕ СЧЁТОВ – БОЛЬШЕ ВСТРЕЧ</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight leading-tight mb-4">
            Делим чек.<br />
            <span className="text-[#34d399]">Сохраняем дружбу.</span>
          </h1>
          <p className="text-gray-400 text-base max-w-xs mx-auto">
            Справедливо распределим расходы за пару касаний.
          </p>
        </div>

        {/* Главная мятная кнопка */}
        <button 
          onClick={handleCameraClick}
          className="w-full bg-[#9bf0cb] text-[#0b0f12] rounded-[32px] p-8 flex flex-col items-center justify-center gap-4 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-[#9bf0cb]/10 relative group mb-4"
        >
          <div className="absolute top-6 right-6 bg-[#0b0f12]/5 p-2 rounded-full group-hover:translate-x-1 transition-transform">
            <ArrowRight className="w-5 h-5 text-[#0b0f12]" />
          </div>
          <div className="bg-[#0b0f12] text-[#9bf0cb] p-5 rounded-2xl shadow-inner mt-4">
            <Camera className="w-8 h-8" />
          </div>
          <div className="text-center mt-2">
            <span className="block text-2xl font-bold tracking-tight mb-1">Сфотографировать чек</span>
            <span className="block text-sm text-[#0b0f12]/60 font-medium">Камера распознает позиции автоматически</span>
          </div>
        </button>

        {/* Вторая кнопка */}
        <button className="w-full bg-[#141b1f] border border-[#1e2930] rounded-2xl py-5 px-6 flex items-center justify-center gap-3 transition-colors hover:bg-[#1a2329] active:scale-[0.98] mb-6">
          <FileText className="w-5 h-5 text-gray-400" />
          <span className="font-semibold text-gray-200">Ввести данные вручную</span>
        </button>

        {/* Подпись */}
        <div className="flex items-center gap-2 text-gray-500 text-sm">
          <UserCheck className="w-4 h-4 text-[#34d399]/70" />
          <span>Без регистрации и лишних хлопот</span>
        </div>
      </main>

      {/* Подвал */}
      <footer className="w-full max-w-md mx-auto text-center text-xs text-gray-600 pb-2 border-t border-[#141b1f] pt-4">
        <p className="max-w-xs mx-auto leading-relaxed">
          Быстрый способ разделить расходы с друзьями без лишних споров
        </p>
      </footer>
    </div>
  );
}
