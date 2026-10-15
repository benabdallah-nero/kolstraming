import React from 'react';
import { FileText, CheckCircle2, AlertTriangle, ShieldCheck, ChevronLeft } from 'lucide-react';
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
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-stone-100">شروط الخدمة والاستخدام (Terms of Service)</h1>
            <p className="text-xs sm:text-sm text-stone-400">آخر تحديث: 2026</p>
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-6 text-sm text-stone-300 leading-relaxed">
        <section className="bg-[#121316] border border-stone-800/80 rounded-2xl p-5 sm:p-6 space-y-3">
          <div className="flex items-center gap-2 text-stone-100 font-bold text-base">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <h2>1. قبول الشروط</h2>
          </div>
          <p>
            باستخدامك لمنصة <strong>kolstream</strong>، فإنك توافق التام وغير المشروط على الالتزام بجميع بنود وشروط هذه الاتفاقية وسياسة الخصوصية المرتبطة بها. إذا كنت لا توافق على هذه الشروط، يُرجى التوقف عن استخدام المنصة فوراً.
          </p>
        </section>

        <section className="bg-[#121316] border border-stone-800/80 rounded-2xl p-5 sm:p-6 space-y-3">
          <div className="flex items-center gap-2 text-stone-100 font-bold text-base">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h2>2. طبيعة الخدمة ودور المنصة</h2>
          </div>
          <p>
            منصة <strong>kolstream</strong> هي منصة استعراض وفهرسة برمجية تهدف إلى تنظيم وتسهيل الوصول إلى جداول البث الرياضي ومعلومات المباريات والقنوات المتاحة علناً عبر شبكة الإنترنت. المنصة لا تقدم خدمات استضافة ملفات فيديو أو بثاً مباشراً تجارياً على خوادمها الخاصة.
          </p>
        </section>

        <section className="bg-[#121316] border border-stone-800/80 rounded-2xl p-5 sm:p-6 space-y-3">
          <div className="flex items-center gap-2 text-stone-100 font-bold text-base">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <h2>3. الاستخدام العادل والمحظورات</h2>
          </div>
          <p>يلتزم المستخدم بما يلي:</p>
          <ul className="list-disc list-inside space-y-1.5 text-xs text-stone-400 pr-2">
            <li>عدم محاولة إلحاق الضرر بالبنية التحتية للمنصة أو تنفيذ هجمات حرمان من الخدمة (DDoS).</li>
            <li>استخدام المنصة للأغراض الشخصية وغير التجارية فقط.</li>
            <li>عدم إعادة بث أو تضمين محتوى المنصة في تطبيقات تجارية دون إذن كتابي مسبق.</li>
          </ul>
        </section>

        <section className="bg-[#121316] border border-stone-800/80 rounded-2xl p-5 sm:p-6 space-y-3">
          <div className="flex items-center gap-2 text-stone-100 font-bold text-base">
            <AlertTriangle className="w-4 h-4 text-stone-400" />
            <h2>4. حدود المسؤولية (Limitation of Liability)</h2>
          </div>
          <p className="text-xs text-stone-400">
            تُقدَّم الخدمة "كما هي" دون أي ضمانات صريحة أو ضمنية بخصوص استمرارية البث، خلوه من الانقطاعات المؤقتة، أو توافر القنوات في جميع المناطق الجغرافية. لا تتحمل المنصة أي مسؤولية عن انقطاع الاتصال أو جودة الشبكة لدى مزودي خدمات الإنترنت.
          </p>
        </section>
      </div>
    </div>
  );
};
