import React, { useState, useEffect } from "react";
import ScrollExpand from "./ScrollExpand";

export default function Landing({ onLaunchDashboard }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#F8F9FA]">
        <div className="w-10 h-10 rounded-full border-2 border-gray-300 border-t-gray-900 animate-spin"></div>
        <span className="mt-4 text-xs font-mono tracking-widest text-gray-500 uppercase">
          Initializing SPECTRA...
        </span>
      </div>
    );
  }

  return (
    <main >
     

    </main>
  );
}