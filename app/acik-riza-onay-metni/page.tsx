import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Açık Rıza Onay Metni",
  description: "İzmir Summit of Next Model United Nations Açık Rıza Onay Metni.",
  alternates: { canonical: "/acik-riza-onay-metni" },
};

export default function ExplicitConsentPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-16 text-white sm:px-10 lg:py-24">
      <article className="rounded-3xl border border-white/15 bg-black/20 p-6 shadow-2xl sm:p-10">
        <header className="border-b border-white/15 pb-7">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">Kişisel Veriler</p>
          <h1 className="text-4xl font-bold text-[var(--color-accent)] sm:text-5xl">AÇIK RIZA ONAY METNİ</h1>
        </header>
        <div className="mt-8 space-y-6 text-base leading-8 text-white/85">
          <p>
            6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında tarafıma gerekli bilgilendirme yapılmış olup bu doğrultuda &quot;İzmir Summit of Next Model United Nations&quot; konferansına katılım başvurusu yapmam durumunda Aydınlatma Metninde belirtilen kişisel verilerimin;
          </p>
          <ul className="list-disc space-y-2 pl-6">
            <li>Başvuruma geri dönüş yapılabilmesi,</li>
            <li>sonmun.com.tr sitesinin yönetilebilmesi ve kayıt tutulabilmesi,</li>
            <li>Konferans öncesinde, sırasında veya sonrasında beni ilgilendiren bir durum anında benimle iletişime geçebilmesi</li>
          </ul>
          <p>
            amaçları ve Aydınlatma Metninde belirtilen diğer amaçlar dahilinde işlenmesine, işlenen verilerimin Aydınlatma Metninde belirtilen üçüncü kişiler ve kurumlar ile paylaşılmasına rıza gösterdiğimi kabul ve beyan ederim.
          </p>
        </div>
      </article>
    </main>
  );
}

