import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ShieldCheck, Bell, X, Settings2, ExternalLink, Eye, Info } from 'lucide-react';

// Monetag Storage Keys
const MONETAG_VIGNETTE_STORAGE = 'kolstream_monetag_vignette_zone';
const MONETAG_IPP_STORAGE = 'kolstream_monetag_ipp_zone';
const MONETAG_ENABLED_STORAGE = 'kolstream_monetag_enabled';
const MONETAG_PREVIEW_STORAGE = 'kolstream_monetag_preview_mode';

interface MonetagConfig {
  vignetteZoneId: string;
  ippZoneId: string;
  enabled: boolean;
  previewMode: boolean;
}

export const MonetagAdManager: React.FC = () => {
  const location = useLocation();

  // Load config from localStorage or env vars
  const [config, setConfig] = useState<MonetagConfig>(() => {
    const envVignette = import.meta.env.VITE_MONETAG_VIGNETTE_ZONE_ID || '';
    const envIpp = import.meta.env.VITE_MONETAG_IPP_ZONE_ID || '';

    const storedVignette = localStorage.getItem(MONETAG_VIGNETTE_STORAGE) || envVignette;
    const storedIpp = localStorage.getItem(MONETAG_IPP_STORAGE) || envIpp;
    const storedEnabled = localStorage.getItem(MONETAG_ENABLED_STORAGE) !== 'false';
    const storedPreview = localStorage.getItem(MONETAG_PREVIEW_STORAGE) === 'true';

    return {
      vignetteZoneId: storedVignette,
      ippZoneId: storedIpp,
      enabled: storedEnabled,
      previewMode: storedPreview || (!storedVignette && !storedIpp) // default preview if no IDs set yet
    };
  });

  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [editVignette, setEditVignette] = useState(config.vignetteZoneId);
  const [editIpp, setEditIpp] = useState(config.ippZoneId);
  const [editEnabled, setEditEnabled] = useState(config.enabled);
  const [editPreview, setEditPreview] = useState(config.previewMode);

  // Simulated visual states for preview/testing
  const [showSimulatedIpp, setShowSimulatedIpp] = useState(false);
  const [showSimulatedVignette, setShowSimulatedVignette] = useState(false);

  // Trigger simulated in-page push after delay on page load if preview mode is active
  useEffect(() => {
    if (config.previewMode && config.enabled) {
      const timer = setTimeout(() => {
        setShowSimulatedIpp(true);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [location.pathname, config.previewMode, config.enabled]);

  // Inject real Monetag scripts when real Zone IDs are present
  useEffect(() => {
    if (!config.enabled) return;

    // 1. In-Page Push (IPP) Injection
    // Official Monetag specification:
    // <script src="https://kulroby.com/tag.min.js" data-zone="ZONE_ID" async data-cfasync="false"></script>
    if (config.ippZoneId && config.ippZoneId.trim() !== '') {
      const existingIpp = document.querySelector(`script[data-zone="${config.ippZoneId.trim()}"]`);
      if (!existingIpp) {
        const ippScript = document.createElement('script');
        ippScript.src = 'https://kulroby.com/tag.min.js';
        ippScript.dataset.zone = config.ippZoneId.trim();
        ippScript.async = true;
        ippScript.setAttribute('data-cfasync', 'false');
        document.head.appendChild(ippScript);
      }
    }

    // 2. Vignette Banner Injection
    // Official Monetag specification:
    // (function(s){s.dataset.zone='ZONE_ID';s.src='https://n6wxm.com/vignette.min.js'})(document.documentElement.appendChild(document.createElement('script')))
    if (config.vignetteZoneId && config.vignetteZoneId.trim() !== '') {
      const existingVignette = document.querySelector(`script[data-vignette-zone="${config.vignetteZoneId.trim()}"]`);
      if (!existingVignette) {
        const vignetteScript = document.createElement('script');
        vignetteScript.src = 'https://n6wxm.com/vignette.min.js';
        vignetteScript.dataset.zone = config.vignetteZoneId.trim();
        vignetteScript.dataset.vignetteZone = config.vignetteZoneId.trim();
        vignetteScript.async = true;
        document.documentElement.appendChild(vignetteScript);
      }
    }
  }, [config.enabled, config.ippZoneId, config.vignetteZoneId]);

  const saveConfig = () => {
    localStorage.setItem(MONETAG_VIGNETTE_STORAGE, editVignette.trim());
    localStorage.setItem(MONETAG_IPP_STORAGE, editIpp.trim());
    localStorage.setItem(MONETAG_ENABLED_STORAGE, String(editEnabled));
    localStorage.setItem(MONETAG_PREVIEW_STORAGE, String(editPreview));

    setConfig({
      vignetteZoneId: editVignette.trim(),
      ippZoneId: editIpp.trim(),
      enabled: editEnabled,
      previewMode: editPreview
    });

    setIsConfigOpen(false);
  };

  return (
    <>
      {/* Discreet Monetag Status & Control Trigger in Bottom Left */}
      <div className="fixed bottom-20 md:bottom-4 left-4 z-40">
        <button
          onClick={() => {
            setEditVignette(config.vignetteZoneId);
            setEditIpp(config.ippZoneId);
            setEditEnabled(config.enabled);
            setEditPreview(config.previewMode);
            setIsConfigOpen(true);
          }}
          title="إعدادات إعلانات Monetag (Visual Only)"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-stone-900/90 hover:bg-stone-800 text-stone-300 hover:text-emerald-400 border border-stone-800 text-xs shadow-lg backdrop-blur-md transition-all group"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
          <span className="font-mono text-[11px] font-semibold">Monetag Ads</span>
          {config.enabled ? (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          ) : (
            <span className="w-1.5 h-1.5 rounded-full bg-stone-600"></span>
          )}
        </button>
      </div>

      {/* Simulated In-Page Push (IPP) Preview (when in Preview Mode or Testing) */}
      {config.previewMode && config.enabled && showSimulatedIpp && (
        <div
          dir="rtl"
          className="fixed top-16 md:top-20 left-4 md:left-6 z-50 max-w-sm w-[calc(100vw-32px)] sm:w-88 rounded-xl bg-gradient-to-b from-stone-900 to-stone-950 border border-stone-700/70 p-3.5 shadow-2xl shadow-black/80 animate-in fade-in slide-in-from-top-4 duration-300 text-right"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                <Bell className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/70 px-1.5 py-0.5 rounded border border-emerald-800/40">
                    In-Page Push (Monetag)
                  </span>
                  <span className="text-[10px] text-stone-500 font-mono">تجربة مرئية</span>
                </div>
                <h5 className="font-bold text-sm text-stone-100 mt-0.5">
                  تحديث البث المباشر لأهم مباريات الليلة
                </h5>
              </div>
            </div>
            <button
              onClick={() => setShowSimulatedIpp(false)}
              className="text-stone-400 hover:text-white p-1 rounded-md hover:bg-stone-800 transition"
              title="إغلاق الإعلان"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-stone-400 mt-2 leading-relaxed">
            هذا نموذج مباشر لشكل إعلان In-Page Push البصري. لا يطلب إذن متصفح، لا يفتح نوافذ منبثقة، ويعمل بسلاسة على الهاتف والكمبيوتر.
          </p>
          <div className="mt-3 pt-2.5 border-t border-stone-800 flex items-center justify-between text-xs">
            <span className="text-[11px] text-stone-500">Visual Banner Ad • Safe Mode</span>
            <button
              onClick={() => setShowSimulatedIpp(false)}
              className="px-3 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-md font-medium text-xs border border-emerald-500/30 transition"
            >
              متابعة البث
            </button>
          </div>
        </div>
      )}

      {/* Simulated Vignette Banner Preview Modal */}
      {config.previewMode && config.enabled && showSimulatedVignette && (
        <div
          dir="rtl"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200"
        >
          <div className="relative max-w-lg w-full rounded-2xl bg-gradient-to-b from-stone-900 to-[#0e1013] border border-stone-700/80 p-6 shadow-2xl text-center">
            <button
              onClick={() => setShowSimulatedVignette(false)}
              className="absolute top-4 left-4 p-1.5 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition"
              title="تخطي الإعلان (X)"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4">
              <Eye className="w-6 h-6" />
            </div>

            <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded-full">
              Monetag Vignette Banner
            </span>

            <h3 className="text-lg font-bold text-stone-100 mt-3">
              إعلان فاصل بصري نظيف (Vignette Interstitial)
            </h3>
            <p className="text-stone-400 text-xs mt-2 max-w-md mx-auto leading-relaxed">
              يظهر هذا الفاصل البصري عند الانتقال بين الصفحات أو فتح القنوات مع زر إغلاق واضح (X)، بدون فتح صفحات سبام منبثقة أو تحويلات قسرية تضر تجربة المستخدم.
            </p>

            <div className="my-5 p-4 rounded-xl bg-stone-950/70 border border-stone-800 text-xs text-stone-400">
              <div className="aspect-[16/9] max-w-sm mx-auto rounded-lg bg-gradient-to-br from-stone-800 to-stone-900 border border-stone-700/50 flex flex-col items-center justify-center text-stone-400">
                <span className="font-mono text-sm text-stone-300 font-bold">Responsive 300x250 / Banner</span>
                <span className="text-[11px] text-stone-500 mt-1">مساحة إعلانية بصرية معتمدة</span>
              </div>
            </div>

            <button
              onClick={() => setShowSimulatedVignette(false)}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition shadow-lg shadow-emerald-900/40"
            >
              متابعة المشاهدة (إغلاق)
            </button>
          </div>
        </div>
      )}

      {/* Monetag Configuration & Docs Modal */}
      {isConfigOpen && (
        <div
          dir="rtl"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
        >
          <div className="relative max-w-xl w-full rounded-2xl bg-stone-900 border border-stone-750 p-6 shadow-2xl text-right my-8 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-stone-800 pb-4 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Settings2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-stone-100">
                    إدارة إعلانات Monetag (Visual Only)
                  </h3>
                  <p className="text-stone-400 text-xs">
                    دعم حصري لصيغ الإعلانات البصرية فقط (Vignette + In-Page Push)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsConfigOpen(false)}
                className="text-stone-400 hover:text-white p-1 rounded-md hover:bg-stone-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Visual Discipline Guarantee */}
            <div className="mb-5 p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/40 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs text-stone-300 leading-relaxed">
                <strong className="text-emerald-300 font-bold block mb-0.5">ضمان المشغل النظيف:</strong>
                تم حظر ومنع صيغ Popunder (OnClick) وروابط Smartlink نهائياً. يتم تحميل الإعلانات البصرية فقط التي تحتوي على زر إغلاق صريح ولا تفتح نوافذ خبيثة جديدة.
              </div>
            </div>

            {/* Inputs Form */}
            <div className="space-y-4">
              {/* Active Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-stone-950 border border-stone-800">
                <div>
                  <label className="text-sm font-bold text-stone-200 block">
                    تفعيل نظام الإعلانات
                  </label>
                  <span className="text-xs text-stone-400">
                    تشغيل أو إيقاف كافة نصوص Monetag بنقرة واحدة
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={editEnabled}
                  onChange={(e) => setEditEnabled(e.target.checked)}
                  className="w-5 h-5 accent-emerald-500 cursor-pointer rounded"
                />
              </div>

              {/* Preview Mode Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-stone-950 border border-stone-800">
                <div>
                  <label className="text-sm font-bold text-stone-200 block">
                    وضع المعاينة البصرية (Demo Preview)
                  </label>
                  <span className="text-xs text-stone-400">
                    عرض محاكاة الإعلانات للتأكد من مظهرها قبل تفعيل حساب Monetag
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={editPreview}
                  onChange={(e) => setEditPreview(e.target.checked)}
                  className="w-5 h-5 accent-emerald-500 cursor-pointer rounded"
                />
              </div>

              {/* In-Page Push Zone ID */}
              <div>
                <label className="text-xs font-bold text-stone-300 block mb-1.5 flex items-center justify-between">
                  <span>معرّف منطقة In-Page Push (Zone ID)</span>
                  <span className="text-[11px] font-mono text-stone-500">tag.min.js</span>
                </label>
                <input
                  type="text"
                  value={editIpp}
                  onChange={(e) => setEditIpp(e.target.value)}
                  placeholder="مثال: 8492041 أو اتركها فارغة للاختبار"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-stone-200 placeholder-stone-600 font-mono text-xs focus:outline-none focus:border-emerald-500 transition"
                  dir="ltr"
                />
                <span className="text-[11px] text-stone-500 mt-1 block">
                  كود السكربت الرسمي: <code className="text-stone-400">https://kulroby.com/tag.min.js</code> مع معرّف المنطقة.
                </span>
              </div>

              {/* Vignette Banner Zone ID */}
              <div>
                <label className="text-xs font-bold text-stone-300 block mb-1.5 flex items-center justify-between">
                  <span>معرّف منطقة Vignette Banner (Zone ID)</span>
                  <span className="text-[11px] font-mono text-stone-500">vignette.min.js</span>
                </label>
                <input
                  type="text"
                  value={editVignette}
                  onChange={(e) => setEditVignette(e.target.value)}
                  placeholder="مثال: 8492042 أو اتركها فارغة للاختبار"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-stone-200 placeholder-stone-600 font-mono text-xs focus:outline-none focus:border-emerald-500 transition"
                  dir="ltr"
                />
                <span className="text-[11px] text-stone-500 mt-1 block">
                  كود السكربت الرسمي: <code className="text-stone-400">https://n6wxm.com/vignette.min.js</code> مع معرّف المنطقة.
                </span>
              </div>
            </div>

            {/* Quick Test Actions */}
            <div className="mt-5 p-3 rounded-xl bg-stone-950/70 border border-stone-800/80">
              <span className="text-xs font-bold text-stone-300 block mb-2">
                اختبار فوري للمظهر البصري:
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setShowSimulatedIpp(true)}
                  className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium flex items-center gap-1.5 transition"
                >
                  <Bell className="w-3.5 h-3.5 text-emerald-400" />
                  <span>معاينة In-Page Push</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowSimulatedVignette(true)}
                  className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium flex items-center gap-1.5 transition"
                >
                  <Eye className="w-3.5 h-3.5 text-emerald-400" />
                  <span>معاينة Vignette Interstitial</span>
                </button>
              </div>
            </div>

            {/* Official Monetag Documentation Guide */}
            <div className="mt-5 p-3.5 rounded-xl bg-stone-950 border border-stone-800/60 text-xs text-stone-400 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-stone-300">
                <Info className="w-4 h-4 text-emerald-400" />
                <span>كيفية استخراج الـ Zone IDs من لوحة Monetag:</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-stone-400 text-[11px] leading-relaxed">
                <li>سجل دخولك إلى لوحة <strong className="text-stone-200">Monetag Dashboard</strong> واذهب لقسم <strong className="text-stone-200">Sites</strong>.</li>
                <li>اختر موقعك ثم اضغط <strong className="text-stone-200">Add Zone</strong>.</li>
                <li>اختر صيغة <strong className="text-stone-200">In-Page Push (IPP)</strong> وانسخ الرقم (Zone ID).</li>
                <li>اختر صيغة <strong className="text-stone-200">Vignette Banner</strong> وانسخ الرقم (Zone ID).</li>
                <li>ألصق الأرقام هنا أو في ملف <code className="text-stone-300">.env</code> عبر المتغيرات <code className="text-emerald-400">VITE_MONETAG_IPP_ZONE_ID</code>.</li>
              </ol>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-stone-800">
              <button
                type="button"
                onClick={() => setIsConfigOpen(false)}
                className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-750 text-stone-300 text-xs font-medium transition"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={saveConfig}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-900/30 transition"
              >
                حفظ الإعدادات وتطبيق
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
