import React from 'react';
import { ChevronLeft } from 'lucide-react';
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
    <div className="max-w-4xl mx-auto py-6 sm:py-10 space-y-6" dir="rtl">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-[2px] p-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="w-1.5 h-8 bg-[var(--accent-primary)] shrink-0" />
          <div>
            <h1 className="font-display-ar text-xl sm:text-2xl font-extrabold text-[var(--text-primary)]">
              سياسة الخصوصية (Privacy Policy)
            </h1>
            <p className="text-xs text-[var(--text-muted)] font-display-num">
              UPDATED · 2026
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="px-3 py-1.5 rounded-[2px] bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1.5 cursor-pointer"
        >
          <span>رجوع</span>
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="border border-[var(--border-hairline)] divide-y divide-[var(--border-hairline)] bg-[var(--bg-surface)] rounded-[2px] text-sm text-[var(--text-secondary)] leading-relaxed">
        <section className="p-5 space-y-2">
          <h2 className="font-display-ar text-base font-extrabold text-[var(--text-primary)]">
            01. جمع البيانات والخصوصية
          </h2>
          <p>
            في منصة <strong className="text-[var(--text-primary)]">kolstream</strong>، نضع خصوصية المستخدم على رأس أولوياتنا. المنصة مصممة للعمل دون الحاجة لإنشاء حساب، إدخال بريد إلكتروني، أو تقديم أي معلومات شخصية حساسة.
          </p>
          <p className="text-xs text-[var(--text-muted)]">
            تتم معالجة تصفحك بشكل مجهول تماماً دون أي محاولة لربط هويتك الشخصية بالقنوات أو المباريات التي تتابعها.
          </p>
        </section>

        <section className="p-5 space-y-2">
          <h2 className="font-display-ar text-base font-extrabold text-[var(--text-primary)]">
            02. التخزين المحلي (Local Storage)
          </h2>
          <p>
            نستخدم ميزة التخزين المحلي في متصفحك (Browser LocalStorage) حصراً للأغراض التقنية التالية:
          </p>
          <ul className="list-disc list-inside space-y-1 text-xs text-[var(--text-muted)] pr-2">
            <li>حفظ قائمة القنوات والتنبيهات التي تختارها حتى تظل متوفرة في زياراتك القادمة.</li>
            <li>تذكر تفضيلات دقة البث وحجم الشاشة لتوفير تجربة تشغيل سلسة.</li>
          </ul>
        </section>

        <section className="p-5 space-y-2">
          <h2 className="font-display-ar text-base font-extrabold text-[var(--text-primary)]">
            03. ملفات تعريف الارتباط وخوادم البث
          </h2>
          <p>
            موقعنا لا يعتمد ملفات تعريف ارتباط تتبعية أو إعلانية موجهة. عند تشغيل بعض مشغلات الفيديو التضمينية، قد تضع خوادم البث المستضيفة ملفات تعريف ارتباط مؤقتة لتنظيم تدفق البث والتحقق من صلاحية الجلسة.
          </p>
        </section>

        <section className="p-5 space-y-2">
          <h2 className="font-display-ar text-base font-extrabold text-[var(--text-primary)]">
            04. التحديثات والتعديلات
          </h2>
          <p>
            قد نقوم بتحديث سياسة الخصوصية من وقت لآخر لتعكس التحسينات التقنية والتنظيمية في المنصة. سيتم نشر أي تغيير على هذه الصفحة مباشرة.
          </p>
        </section>
      </div>
    </div>
  );
};
