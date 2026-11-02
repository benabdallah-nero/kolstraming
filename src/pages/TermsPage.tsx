import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePageSeo } from '../hooks/usePageSeo';

export const TermsPage: React.FC = () => {
  usePageSeo({
    title: 'شروط الخدمة والاستخدام العادل – kolstream',
    description: 'شروط وأحكام استخدام منصة kolstream للبث الرياضي ودليل القنوات التلفزيونية.',
    canonicalPath: '/terms'
  });
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-10 space-y-6" dir="rtl">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-[2px] p-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="w-1.5 h-8 bg-[var(--accent-primary)] shrink-0" />
          <div>
            <h1 className="font-display-ar text-xl sm:text-2xl font-extrabold text-[var(--text-primary)]">
              شروط الخدمة والاستخدام (Terms of Service)
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
            01. قبول الشروط
          </h2>
          <p>
            باستخدامك لمنصة <strong className="text-[var(--text-primary)]">kolstream</strong>، فإنك توافق على الالتزام بجميع بنود وشروط هذه الاتفاقية وسياسة الخصوصية المرتبطة بها.
          </p>
        </section>

        <section className="p-5 space-y-2">
          <h2 className="font-display-ar text-base font-extrabold text-[var(--text-primary)]">
            02. طبيعة الخدمة ودور المنصة
          </h2>
          <p>
            منصة <strong className="text-[var(--text-primary)]">kolstream</strong> هي منصة استعراض وفهرسة برمجية تهدف إلى تنظيم وتسهيل الوصول إلى جداول البث الرياضي ومعلومات المباريات والقنوات المتاحة علناً عبر شبكة الإنترنت.
          </p>
        </section>

        <section className="p-5 space-y-2">
          <h2 className="font-display-ar text-base font-extrabold text-[var(--text-primary)]">
            03. الاستخدام العادل والمحظورات
          </h2>
          <ul className="list-disc list-inside space-y-1 text-xs text-[var(--text-muted)] pr-2">
            <li>عدم محاولة إلحاق الضرر بالبنية التحتية للمنصة أو تنفيذ هجمات حرمان من الخدمة.</li>
            <li>استخدام المنصة للأغراض الشخصية وغير التجارية فقط.</li>
            <li>عدم إعادة بث أو تضمين محتوى المنصة في تطبيقات تجارية دون إذن مسبق.</li>
          </ul>
        </section>

        <section className="p-5 space-y-2">
          <h2 className="font-display-ar text-base font-extrabold text-[var(--text-primary)]">
            04. حدود المسؤولية
          </h2>
          <p className="text-xs text-[var(--text-muted)]">
            تُقدَّم الخدمة "كما هي" دون أي ضمانات بخصوص استمرارية البث أو خلوه من الانقطاعات المؤقتة لدى مزودي خدمات الإنترنت.
          </p>
        </section>
      </div>
    </div>
  );
};
