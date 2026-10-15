import React from 'react';
import { Shield, Lock, Eye, Server, RefreshCw, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePageSeo } from '../hooks/usePageSeo';

export const PrivacyPage: React.FC = () => {
  usePageSeo({
    title: 'سياسة الخصوصية والاستخدام – kolstream',
    description: 'سياسة الخصوصية وحماية بيانات المستخدم في منصة kolstream للبث الرياضي ودليل القنوات.',
    canonicalPath: '/privacy'
  });
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-10 space-y-8 animate-in fade-in duration-200" dir="rtl">
      {/* Header */}
      <div className="space-y-3 border-b border-stone-800 pb-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-emerald-400 transition mb-2"
        >
          <ChevronLeft className="w-4 h-4 rotate-180" />
          <span>رجوع</span>
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-stone-100">سياسة الخصوصية (Privacy Policy)</h1>
            <p className="text-xs sm:text-sm text-stone-400">آخر تحديث: 2026</p>
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-6 text-sm text-stone-300 leading-relaxed">
        <section className="bg-[#121316] border border-stone-800/80 rounded-2xl p-5 sm:p-6 space-y-3">
          <div className="flex items-center gap-2 text-stone-100 font-bold text-base">
            <Lock className="w-4 h-4 text-emerald-400" />
            <h2>1. جمع البيانات والخصوصية</h2>
          </div>
          <p>
            في منصة <strong>kolstream</strong>، نضع خصوصية المستخدم على رأس أولوياتنا. المنصة مصممة للعمل دون الحاجة لإنشاء حساب، إدخال بريد إلكتروني، أو تقديم أي معلومات شخصية حساسة.
          </p>
          <p className="text-xs text-stone-400">
            تتم معالجة تصفحك بشكل مجهول تماماً دون أي محاولة لربط هويتك الشخصية بالقنوات أو المباريات التي تتابعها.
          </p>
        </section>

        <section className="bg-[#121316] border border-stone-800/80 rounded-2xl p-5 sm:p-6 space-y-3">
          <div className="flex items-center gap-2 text-stone-100 font-bold text-base">
            <Server className="w-4 h-4 text-emerald-400" />
            <h2>2. التخزين المحلي (Local Storage)</h2>
          </div>
          <p>
            نستخدم ميزة التخزين المحلي في متصفحك (Browser LocalStorage) حصراً للأغراض التقنية التالية:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-xs text-stone-400 pr-2">
            <li>حفظ قائمة <strong>القنوات المفضلة</strong> التي تختارها حتى تظل متوفرة في زياراتك القادمة.</li>
            <li>تذكر تفضيلات دقة البث وحجم الشاشة لتوفير تجربة تشغيل سلسة.</li>
          </ul>
          <p className="text-xs text-stone-400">
            هذه البيانات مخزنة محلياً على جهازك فقط ولا يتم نقلها أو مشاركتها مع أي خوادم خارجية.
          </p>
        </section>

        <section className="bg-[#121316] border border-stone-800/80 rounded-2xl p-5 sm:p-6 space-y-3">
          <div className="flex items-center gap-2 text-stone-100 font-bold text-base">
            <Eye className="w-4 h-4 text-emerald-400" />
            <h2>3. ملفات تعريف الارتباط (Cookies) وخوادم الطرف الثالث</h2>
          </div>
          <p>
            موقعنا لا يعتمد ملفات تعريف ارتباط تتبعية أو إعلانية موجهة. ومع ذلك، عند تشغيل بعض مشغلات الفيديو التضمينية، قد تضع خوادم البث المستضيفة ملفات تعريف ارتباط مؤقتة لتنظيم تدفق البث والتحقق من صلاحية الجلسة.
          </p>
        </section>

        <section className="bg-[#121316] border border-stone-800/80 rounded-2xl p-5 sm:p-6 space-y-3">
          <div className="flex items-center gap-2 text-stone-100 font-bold text-base">
            <RefreshCw className="w-4 h-4 text-emerald-400" />
            <h2>4. التحديثات والتعديلات</h2>
          </div>
          <p>
            قد نقوم بتحديث سياسة الخصوصية من وقت لآخر لتعكس التحسينات التقنية والتنظيمية في المنصة. سيتم نشر أي تغيير على هذه الصفحة مباشرة.
          </p>
        </section>
      </div>
    </div>
  );
};
