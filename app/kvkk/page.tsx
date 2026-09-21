import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "KVKK Başvuru Formu",
  description: "Kişisel verilerinizle ilgili KVKK başvurularınız için form.",
  alternates: { canonical: "/kvkk" },
};

const inputClass = "mt-2 w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white outline-none transition focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]";

export default function KvkkPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-16 text-white sm:px-10 lg:py-24">
      <section className="rounded-3xl border border-white/15 bg-black/20 p-6 shadow-2xl sm:p-10">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">Kişisel Veriler</p>
        <h1 className="text-4xl font-bold text-[var(--color-accent)] sm:text-5xl">KVKK Başvuru Formu</h1>
        <p className="mt-5 max-w-3xl text-base leading-7 text-white/80">
          KVKK kapsamındaki haklarınızı kullanmak için aşağıdaki formu doldurunuz. Formu tarayıcınızın yazdırma özelliğiyle yazdırıp imzaladıktan sonra, İzmir Summit of Next Model United Nations Organizasyon Ekibi&apos;ne sonmun.com.tr sitesinde yayımlanan iletişim kanalı üzerinden iletiniz. Bu sayfa başvuruyu otomatik olarak göndermez.
        </p>

        <form className="mt-10 space-y-8" aria-label="KVKK başvuru formu">
          <fieldset className="grid gap-6 md:grid-cols-2">
            <legend className="mb-1 text-xl font-semibold text-[var(--color-accent)]">Başvuru sahibi</legend>
            <div>
              <label htmlFor="fullName" className="text-sm font-semibold">Ad Soyad *</label>
              <input id="fullName" name="fullName" type="text" required className={inputClass} />
            </div>
            <div>
              <label htmlFor="identityNumber" className="text-sm font-semibold">T.C. Kimlik No / Pasaport No *</label>
              <input id="identityNumber" name="identityNumber" type="text" required className={inputClass} />
            </div>
            <div>
              <label htmlFor="email" className="text-sm font-semibold">E-posta *</label>
              <input id="email" name="email" type="email" required className={inputClass} />
            </div>
            <div>
              <label htmlFor="phone" className="text-sm font-semibold">Telefon</label>
              <input id="phone" name="phone" type="tel" className={inputClass} />
            </div>
          </fieldset>

          <div>
            <label htmlFor="request" className="text-sm font-semibold">Talep ve açıklamalar *</label>
            <textarea id="request" name="request" required rows={8} className={`${inputClass} resize-y`} placeholder="KVKK kapsamındaki talebinizi ve gerekli açıklamaları yazınız." />
          </div>

          <div className="max-w-xs">
            <label htmlFor="date" className="text-sm font-semibold">Tarih *</label>
            <input id="date" name="date" type="date" required className={inputClass} />
          </div>

          <p className="border-t border-white/15 pt-6 text-sm leading-6 text-white/65">
            Formu doldurduktan sonra tarayıcınızın yazdırma komutunu kullanarak belgenizi yazdırınız. İmzalı başvuruyu, sonmun.com.tr üzerinde yayımlanan güncel iletişim kanalından organizasyon ekibine gönderiniz.
          </p>
        </form>
      </section>
    </main>
  );
}

