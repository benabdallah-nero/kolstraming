import React from 'react';
import { Link } from 'react-router-dom';
import { Tv, Shield, FileText, Copyright, Heart, Radio } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-16 border-t border-stone-850 bg-[#08090a] text-stone-400 text-xs select-none" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Tv className="w-3.5 h-3.5" />
              </div>
              <span className="font-mono-num text-base font-bold text-stone-100 tracking-tight">
                kolstream
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-1.5 py-0.2 rounded">
                live
              </span>
            </div>
            <p className="text-stone-400 text-xs leading-relaxed">
              منصة البث الرياضي التفاعلية ودليل القنوات المباشرة مع جدول مباريات اليوم وخيارات جودة متعددة لتفادي التقطيع.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-stone-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>خوادم البث متصلة 24/7</span>
            </div>
          </div>

          {/* Quick Navigation Links */}
          <div className="space-y-3">
            <h4 className="font-bold text-stone-200 text-xs">أقسام المنصة</h4>
            <ul className="space-y-2 text-stone-400 text-xs">
              <li>
                <Link to="/home" className="hover:text-emerald-400 transition flex items-center gap-1.5">
                  <Radio className="w-3 h-3 text-emerald-400" />
                  <span>دليل القنوات الرياضية</span>
                </Link>
              </li>
              <li>
                <Link to="/watchroom" className="hover:text-emerald-400 transition">
                  غرفة المشاهدة (Watch Theater)
                </Link>
              </li>
              <li>
                <Link to="/schedual" className="hover:text-emerald-400 transition">
                  جدول المباريات الحية
                </Link>
              </li>
              <li>
                <Link to="/favorit" className="hover:text-emerald-400 transition">
                  قنواتي المفضلة
                </Link>
              </li>
            </ul>
          </div>

          {/* Network Categories */}
          <div className="space-y-3">
            <h4 className="font-bold text-stone-200 text-xs">الشبكات المدعومة</h4>
            <div className="flex flex-wrap gap-1.5">
              <span className="px-2 py-0.5 rounded-md bg-stone-900 border border-stone-800 text-[11px] text-stone-300">
                beIN Sports العربية
              </span>
              <span className="px-2 py-0.5 rounded-md bg-stone-900 border border-stone-800 text-[11px] text-stone-300">
                beIN Sports Global
              </span>
              <span className="px-2 py-0.5 rounded-md bg-stone-900 border border-stone-800 text-[11px] text-stone-300">
                Eurosport Europe
              </span>
              <span className="px-2 py-0.5 rounded-md bg-stone-900 border border-stone-800 text-[11px] text-stone-300">
                Arena Sport Premium
              </span>
            </div>
          </div>

          {/* Policies & Legal */}
          <div className="space-y-3">
            <h4 className="font-bold text-stone-200 text-xs">السياسات والشروط</h4>
            <ul className="space-y-2 text-stone-400 text-xs">
              <li>
                <Link to="/privacy" className="hover:text-emerald-400 transition flex items-center gap-1.5">
                  <Shield className="w-3 h-3 text-stone-400" />
                  <span>سياسة الخصوصية</span>
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-emerald-400 transition flex items-center gap-1.5">
                  <FileText className="w-3 h-3 text-stone-400" />
                  <span>شروط الاستخدام</span>
                </Link>
              </li>
              <li>
                <Link to="/dmca" className="hover:text-emerald-400 transition flex items-center gap-1.5">
                  <Copyright className="w-3 h-3 text-stone-400" />
                  <span>إخلاء المسؤولية و DMCA</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Disclaimer Bar */}
        <div className="pt-6 border-t border-stone-850/60 text-[11px] text-stone-500 leading-relaxed space-y-1">
          <p>
            <strong>إخلاء مسؤولية قانوني:</strong> منصة kolstream هي دليل فهرسة إلكتروني لمتابعة مواعيد المباريات وجداول البث العامة. المنصة لا تستضيف أو تخزن أي تدفقات فيديو أو ملفات وسائط محمية على خوادمها الخاصة، وتقتصر على تنظيم الروابط المتاحة للعامة على الويب.
          </p>
        </div>

        {/* Bottom Bar */}
        <div className="pt-4 border-t border-stone-850/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-stone-500 text-[11px]">
          <div>
            © {new Date().getFullYear()} kolstream. جميع الحقوق محفوظة.
          </div>
          <div className="flex items-center gap-1 text-stone-500">
            <span>صُنع بشغف لعشاق الرياضة</span>
            <Heart className="w-3 h-3 text-rose-500 fill-current inline" />
          </div>
        </div>
      </div>
    </footer>
  );
};
