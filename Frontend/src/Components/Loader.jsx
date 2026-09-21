import React from 'react';

const Loader = () => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#F8F9FA]/80 backdrop-blur-md transition-all duration-700">
      {/* Container للدوائر النابضة (إيحاء الـ AI Neural Processing) */}
      <div className="relative flex items-center justify-center">
        {/* الدايرة الخارجية الكبيرة (نبض بطيء) */}
        <div className="absolute w-24 h-24 rounded-full border border-gray-300/60 animate-ping opacity-30"></div>
        
        {/* الدايرة المتوسطة (بتلف عكس الاتجاه) */}
        <div className="w-16 h-16 rounded-full border-2 border-transparent border-t-gray-900 border-l-gray-400 animate-spin"></div>
        
        {/* النواة (نقطةAI مركزية بتنبض) */}
        <div className="absolute w-4 h-4 bg-gray-900 rounded-full animate-pulse shadow-[0_0_15px_rgba(0,0,0,0.2)]"></div>
      </div>

      {/* الـ Text / Slogan تحت اللودر */}
      <div className="mt-8 flex flex-col items-center">
        <span className="text-sm font-medium tracking-[0.2em] text-gray-700 uppercase animate-pulse">
          SPECTRA<span className="text-gray-400">.AI</span>
        </span>
        <div className="w-12 h-[2px] bg-gray-300 mt-2 rounded-full overflow-hidden">
          <div className="w-full h-full bg-gray-900 animate-[shimmer_1.5s_infinite]"></div>
        </div>
      </div>
    </div>
  );
};

export default Loader;   // oops, export default Loader;