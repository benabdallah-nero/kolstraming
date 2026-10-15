import React from 'react';
import { Copyright, Scale, AlertOctagon, Mail, ChevronLeft } from 'lucide-react';
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
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <Copyright className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-stone-100">إشعار حقوق الملكية الفكرية وDMCA (Copyright Notice)</h1>
            <p className="text-xs sm:text-sm text-stone-400">بيان إخلاء المسؤولية وحماية حقوق النشر</p>
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-6 text-sm text-stone-300 leading-relaxed">
        <section className="bg-[#121316] border border-stone-800/80 rounded-2xl p-5 sm:p-6 space-y-3">
          <div className="flex items-center gap-2 text-stone-100 font-bold text-base">
            <AlertOctagon className="w-4 h-4 text-rose-400" />
            <h2>1. إخلاء المسؤولية عن البث ومحتوى الفيديو</h2>
          </div>
          <p>
            تؤكد منصة <strong>kolstream</strong> التزامها الكامل بالقوانين واللوائح الدولية لحقوق الملكية الفكرية، بما في ذلك قانون الألفية الرقمية (DMCA).
          </p>
          <div className="bg-stone-900/90 border border-stone-800 p-4 rounded-xl text-xs space-y-2 text-stone-300">
            <p className="font-semibold text-rose-400">
              ملاحظة قانونية هامة:
            </p>
            <p>
              منصة <strong>kolstream</strong> لا تقوم باستضافة، رفع، تخزين أو بث أي ملفات وسائط مرئية أو تدفقات فيديو محمية بحقوق الطبع والنشر على خوادمها الخاصة. جميع تدفقات ومشغلات البث المتاحة هي روابط خارجية متاحة للعامة على شبكة الإنترنت المفتوحة عبر بروتوكولات وتضمينات الطرف الثالث.
            </p>
          </div>
        </section>

        <section className="bg-[#121316] border border-stone-800/80 rounded-2xl p-5 sm:p-6 space-y-3">
          <div className="flex items-center gap-2 text-stone-100 font-bold text-base">
            <Scale className="w-4 h-4 text-emerald-400" />
            <h2>2. إجراءات إشعار الانتهاك وإزالة الروابط (DMCA Takedown)</h2>
          </div>
          <p>
            إذا كنت مالكاً شرعياً لحقوق ملكية فكرية أو ممثلاً رسمياً مفوضاً، وتعتقد أن هناك رابطاً مدرجاً في المنصة يشير إلى محتوى ينتهك حقوقكم، فإننا نحترم ذلك ونتعامل مع كافة الإخطارات بجدية وسرعة فائقة.
          </p>
          <p className="text-xs text-stone-400">
            يرجى إرسال إشعار كتابي يحتوي على المتطلبات التالية:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-xs text-stone-400 pr-2">
            <li>وصف واضح للعمل المحمي بحقوق الطبع والنشر المعني بالإشعار.</li>
            <li>رابط الـ URL المحدد على منصة kolstream الذي ترغب في إزالته أو حظره.</li>
            <li>معلومات الاتصال الخاصة بك (الاسم الكامل، العنوان، رقم الهاتف، والبريد الإلكتروني الرسمي).</li>
            <li>بيان يفيد بأن لديك اعتقاداً حسن النية بأن استخدام المادة غير مصرح به من قِبل مالك الحقوق.</li>
          </ul>
        </section>

        <section className="bg-[#121316] border border-stone-800/80 rounded-2xl p-5 sm:p-6 space-y-3">
          <div className="flex items-center gap-2 text-stone-100 font-bold text-base">
            <Mail className="w-4 h-4 text-emerald-400" />
            <h2>3. التواصل القانوني</h2>
          </div>
          <p>
            يمكن إرسال جميع إشعارات وطلبات حقوق الملكية الفكرية مباشرة إلى العنوان البريدي القانوني المخصص:
          </p>
          <div className="inline-block bg-stone-900 border border-stone-800 px-4 py-2 rounded-xl font-mono text-emerald-400 text-xs">
            dmca@kolstream.live
          </div>
          <p className="text-xs text-stone-400 pt-2">
            يتم فحص البريد واتخاذ الإجراءات اللازمة خلال 24 إلى 48 ساعة عمل كحد أقصى.
          </p>
        </section>
      </div>
    </div>
  );
};
