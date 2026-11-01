import React from 'react';
import { Link } from 'react-router-dom';
import { Tv, Shield, FileText, Copyright } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-16 border-t border-stone-800/80 bg-[#08090c] text-stone-400 text-xs select-none" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* Brand */}
          <div className="space-y-2 max-w-md">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
                <Tv className="w-3.5 h-3.5" />
              </div>
              <span className="font-mono-num text-base font-extrabold text-white tracking-tight">
                kolstream
              </span>
            </div>
            <p className="text-stone-400 text-xs leading-relaxed">
              دليل القنوات الرياضية المباشرة وجدول مباريات اليوم في البطولات العربية والأوروبية.
            </p>
          </div>

          {/* Navigation Links */}
          <div className="flex flex-wrap items-center gap-6 text-xs">
            <Link to="/home" className="text-stone-300 hover:text-white transition font-medium">
              الرئيسية والقنوات
            </Link>
            <Link to="/schedual" className="text-stone-300 hover:text-white transition font-medium">
              المباريات والنتائج
            </Link>
            <Link to="/leagues" className="text-stone-300 hover:text-white transition font-medium">
              البطولات والترتيب
            </Link>
            <Link to="/watchroom" className="text-stone-300 hover:text-white transition font-medium">
              غرفة المشاهدة
            </Link>
            <Link to="/privacy" className="text-stone-400 hover:text-stone-200 transition flex items-center gap-1">
              <Shield className="w-3 h-3" />
              <span>سياسة الخصوصية</span>
            </Link>
            <Link to="/terms" className="text-stone-400 hover:text-stone-200 transition flex items-center gap-1">
              <FileText className="w-3 h-3" />
              <span>شروط الاستخدام</span>
            </Link>
            <Link to="/dmca" className="text-stone-400 hover:text-stone-200 transition flex items-center gap-1">
              <Copyright className="w-3 h-3" />
              <span>DMCA</span>
            </Link>
          </div>
        </div>

        <div className="pt-4 border-t border-stone-800/50 flex flex-col sm:flex-row items-center justify-between gap-2 text-stone-500 text-[11px]">
          <span>© {new Date().getFullYear()} kolstream. جميع الحقوق محفوظة.</span>
          <span>البث المباشر للقنوات الرياضية ومواعيد المباريات</span>
        </div>
      </div>
    </footer>
  );
};
