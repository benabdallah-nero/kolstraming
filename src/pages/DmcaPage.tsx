import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePageSeo } from '../hooks/usePageSeo';

export const DmcaPage: React.FC = () => {
  usePageSeo({
    title: 'حقوق الملكية الفكرية وإخلاء المسؤولية DMCA – kolstream',
    description: 'إشعار حقوق الملكية الفكرية وإخلاء المسؤولية القانونية لمنصة kolstream.',
    canonicalPath: '/dmca'
  });
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-10 space-y-6" dir="rtl">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-[2px] p-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="w-1.5 h-8 bg-[var(--signal-live)] shrink-0" />
          <div>
            <h1 className="font-display-ar text-xl sm:text-2xl font-extrabold text-[var(--text-primary)]">
              إشعار حقوق الملكية الفكرية (DMCA)
            </h1>
            <p className="text-xs text-[var(--text-muted)]">
              بيان إخلاء المسؤولية وحماية حقوق النشر
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
        <section className="p-5 space-y-3">
          <h2 className="font-display-ar text-base font-extrabold text-[var(--text-primary)]">
            01. إخلاء المسؤولية عن البث ومحتوى الفيديو
          </h2>
          <p>
            تؤكد منصة <strong className="text-[var(--text-primary)]">kolstream</strong> التزامها الكامل بالقوانين واللوائح الدولية لحقوق الملكية الفكرية، بما في ذلك قانون الألفية الرقمية (DMCA).
          </p>
          <div className="bg-[var(--bg-canvas)] border border-[var(--border-hairline)] p-4 rounded-[2px] text-xs space-y-1.5 text-[var(--text-secondary)]">
            <p className="font-bold text-[var(--accent-primary)]">
              ملاحظة قانونية:
            </p>
            <p>
              منصة kolstream لا تقوم باستضافة، رفع، تخزين أو بث أي ملفات وسائط مرئية أو تدفقات فيديو محمية بحقوق الطبع والنشر على خوادمها الخاصة. جميع تدفقات ومشغلات البث المتاحة هي روابط خارجية متاحة للعامة على شبكة الإنترنت عبر تضمينات الطرف الثالث.
            </p>
          </div>
        </section>

        <section className="p-5 space-y-2">
          <h2 className="font-display-ar text-base font-extrabold text-[var(--text-primary)]">
            02. إجراءات إشعار الانتهاك وإزالة الروابط
          </h2>
          <p>
            إذا كنت مالكاً شرعياً لحقوق ملكية فكرية أو ممثلاً رسمياً مفوضاً، وتعتقد أن هناك رابطاً مدرجاً في المنصة يشير إلى محتوى ينتهك حقوقكم، يرجى إرسال إشعار كتابي يتضمن:
          </p>
          <ul className="list-disc list-inside space-y-1 text-xs text-[var(--text-muted)] pr-2">
            <li>وصف واضح للعمل المحمي بحقوق الطبع والنشر المعني بالإشعار.</li>
            <li>رابط الـ URL المحدد على منصة kolstream المطلوب إزالته.</li>
            <li>معلومات الاتصال الرسمية وبيان حسن النية القانوني.</li>
          </ul>
        </section>

        <section className="p-5 space-y-2">
          <h2 className="font-display-ar text-base font-extrabold text-[var(--text-primary)]">
            03. التواصل القانوني
          </h2>
          <p>
            تُرسل جميع الإشعارات القانونية مباشرة إلى البريد المخصص:
          </p>
          <div className="inline-block bg-[var(--bg-canvas)] border border-[var(--border-hairline)] px-3 py-1.5 rounded-[2px] font-display-num text-sm font-bold text-[var(--accent-primary)]">
            dmca@kolstream.live
          </div>
        </section>
      </div>
    </div>
  );
};
