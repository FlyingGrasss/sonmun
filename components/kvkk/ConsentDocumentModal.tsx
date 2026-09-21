"use client";

import { useEffect, useRef } from "react";

export type ConsentDocument = "explicit" | "disclosure";

type ConsentDocumentModalProps = {
  document: ConsentDocument;
  onClose: () => void;
};

const EXPLICIT_CONSENT = `6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında tarafıma gerekli bilgilendirme yapılmış olup bu doğrultuda "İzmir Summit of Next Model United Nations" konferansına katılım başvurusu yapmam durumunda Aydınlatma Metninde belirtilen kişisel verilerimin;

- Başvuruma geri dönüş yapılabilmesi,
- sonmun.com.tr sitesinin yönetilebilmesi ve kayıt tutulabilmesi,
- Konferans öncesinde, sırasında veya sonrasında beni ilgilendiren bir durum anında benimle iletişime geçebilmesi

amaçları ve Aydınlatma Metninde belirtilen diğer amaçlar dahilinde işlenmesine, işlenen verilerimin Aydınlatma Metninde belirtilen üçüncü kişiler ve kurumlar ile paylaşılmasına rıza gösterdiğimi kabul ve beyan ederim.`;

const DISCLOSURE_SECTIONS = [
  {
    heading: "Veri sorumlusu ve organizasyon",
    body: "sonmun.com.tr (İzmir Summit of Next Model United Nations Konferansı Organizasyon Ekibi), kişisel verilerinizi 6698 sayılı Kişisel Verilerin Korunması Kanunu'na (KVKK) uygun olarak işler ve muhafaza eder.",
  },
  {
    heading: "İşlenen kişisel veriler",
    body: "Başvuru sırasında paylaştığınız ad soyad, T.C. kimlik veya pasaport numarası, doğum tarihi, cinsiyet, e-posta adresi, telefon numarası, okul/kurum, sınıf, şehir, komite tercihleri, başvuru metinleri, deneyim, beslenme tercihleri ve başvurunuzdaki diğer açıklamalar işlenebilir. Delegasyon başvurularında delegelere ait aynı nitelikteki veriler de işlenebilir.",
  },
  {
    heading: "İşleme amaçları",
    body: "Verileriniz başvurunuzun alınması ve değerlendirilmesi, başvurunuza geri dönüş yapılması, sonmun.com.tr sitesinin yönetilmesi ve kayıt tutulması, konferans öncesinde, sırasında veya sonrasında sizinle iletişim kurulması ve konferans organizasyonunun yürütülmesi amaçlarıyla işlenir.",
  },
  {
    heading: "Aktarım alıcıları ve kategorileri",
    body: "Verileriniz, Aydınlatma Metninde belirtilen amaçlarla sınırlı olmak üzere konferans organizasyon ekibine, başvuru ve iletişim süreçlerini destekleyen hizmet sağlayıcılara, internet sitesi ve teknik altyapı hizmeti sağlayıcılarına ve kanunen yetkili kamu kurumlarına aktarılabilir.",
  },
  {
    heading: "Toplama yöntemi ve hukuki sebep",
    body: "Kişisel verileriniz, bu başvuru formu, doğrulama e-postası ve site üzerindeki başvuru süreçleri aracılığıyla elektronik ortamda toplanır. Veriler, başvurunun değerlendirilmesi ve konferans hizmetinin yürütülmesi için gerekli işlemler, kanuni yükümlülükler ve gerektiğinde açık rızanız hukuki sebeplerine dayanılarak işlenir.",
  },
  {
    heading: "KVKK madde 11 kapsamındaki haklarınız",
    body: "KVKK'nın 11. maddesi uyarınca kişisel verilerinizin işlenip işlenmediğini öğrenme, işlenmişse bilgi talep etme, işleme amacını ve amaca uygun kullanılıp kullanılmadığını öğrenme, aktarıldığı üçüncü kişileri bilme, eksik veya yanlış işlenmişse düzeltilmesini isteme, şartları oluştuğunda silinmesini veya yok edilmesini isteme, yapılan işlemlerin aktarılan üçüncü kişilere bildirilmesini isteme, otomatik sistemlerle analiz sonucuna itiraz etme ve kanuna aykırı işlem nedeniyle zararın giderilmesini talep etme haklarına sahipsiniz.",
  },
  {
    heading: "Başvuru yolu",
    body: "KVKK kapsamındaki taleplerinizi /kvkk adresindeki KVKK Başvuru Formu'nu doldurarak, formda belirtilen talimatlar doğrultusunda organizasyonun sonmun.com.tr sitesinde yayımlanan iletişim kanalı üzerinden iletebilirsiniz.",
  },
] as const;

export default function ConsentDocumentModal({ document: documentType, onClose }: ConsentDocumentModalProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const isExplicit = documentType === "explicit";

  return (
    <div
      className="fixed inset-0 z-9999 flex items-center justify-center bg-black/70 p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border-2 border-[var(--color-accent)] bg-[var(--background)] p-6 text-white shadow-2xl sm:p-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="consent-document-title"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <h2
            id="consent-document-title"
            ref={headingRef}
            tabIndex={-1}
            className="text-2xl font-bold text-[var(--color-accent)] focus:outline-none sm:text-3xl"
          >
            {isExplicit ? "AÇIK RIZA ONAY METNİ" : "6698 Sayılı Kişisel Verileri Koruma Kanunu Aydınlatma Metni"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/30 px-3 py-1 text-xl leading-none text-white hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
            aria-label="Belgeyi kapat"
          >
            ×
          </button>
        </div>

        {isExplicit ? (
          <div className="whitespace-pre-line text-base leading-7 text-white/90">
            {EXPLICIT_CONSENT}
          </div>
        ) : (
          <div className="space-y-5 text-base leading-7 text-white/90">
            <p className="font-semibold">İZMİR SUMMIT OF NEXT MODEL UNITED NATIONS KONFERANSI Web Sitemizle İle İlgili Olarak 6698 Sayılı Kişisel Verileri Koruma Kanunu Aydınlatma Metni</p>
            {DISCLOSURE_SECTIONS.map((section) => (
              <div key={section.heading}>
                <h3 className="mb-1 text-lg font-semibold text-[var(--color-accent)]">{section.heading}</h3>
                <p>{section.body}</p>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-7 rounded-xl bg-[var(--color-accent)] px-5 py-3 font-bold text-[var(--background)] hover:bg-white"
        >
          Kapat
        </button>
      </section>
    </div>
  );
}
