import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "KVKK Aydınlatma Metni",
  description: "İzmir Summit of Next Model United Nations KVKK Aydınlatma Metni.",
  alternates: { canonical: "/kvkk-aydinlatma-metni" },
};

type DisclosureSection = {
  title: string;
  paragraphs: string[];
  lists?: string[][];
  afterLists?: string[];
  principleLists?: Array<Array<[string, string]>>;
  finalParagraphs?: string[];
};

const sections: DisclosureSection[] = [
  {
    title: "1. Kişisel Verilerinizin Ne Şekilde İşlenebileceği",
    paragraphs: [
      "6698 sayılı KVKK uyarınca, sonmun.com.tr ile paylaştığınız kişisel verileriniz, tamamen veya kısmen, otomatik olarak veyahut herhangi bir veri kayıt sisteminin parçası olmak kaydıyla otomatik olmayan yollarla elde edilerek, kaydedilerek, depolanarak, değiştirilerek, yeniden düzenlenerek, kısacası veriler üzerinde gerçekleştirilen her türlü işleme konu olarak tarafımızdan işlenebilecektir. KVKK kapsamında veriler üzerinde gerçekleştiren her türlü işlem “kişisel verilerin işlenmesi” olarak kabul edilmektedir.",
    ],
  },
  {
    title: "2. Kişisel Verilerinizin Toplanma Şekli ve Hukuki Sebebi",
    paragraphs: [
      "Ziyaretçilere ait kişisel veriler, ziyaretçinin ancak Açık Rıza Metnini onaylayarak web sitesindeki başvuru sistemi üzerinden konferansımıza başvuru yapması halinde ve ilgili kişinin manuel olarak bu bilgileri başvuru formuna girmesiyle elde edilmektedir. Elde edilen bir diğer bilgi ise ziyaretçilerin IP adresi olup bu işlem otomatik olarak sunucu tarafından gerçekleşmektedir.",
      "Toplanan veriler şu şekildedir:",
    ],
    lists: [
      [
        "IP adresiniz ve kullanıcı aracısı bilgileriniz",
        "İsminiz",
        "Soy isminiz",
        "Telefon numaranız",
        "E-Posta adresiniz",
        "Öğrenim gördüğünüz okul ve sınıfınız",
      ],
    ],
  },
  {
    title: "3. Kişisel Verilerinizin İşlenme Amaçları Ve Hukuki Sebepleri",
    paragraphs: [
      "Paylaştığınız kişisel veriler;",
    ],
    lists: [
      [
        "Konferansımız için yaptığınız başvurularınıza geri dönüş yapabilmek için,",
        "İnternet sitesini yönetmek ve kayıt tutmak için,",
        "Konferans öncesinde, sırasında veya sonrasında sizi ilgilendiren bir durum anında sizlere ulaşabilmek için,",
        "Kamu güvenliğine ilişkin hususlarda ve hukuki uyuşmazlıklarda, talep halinde ve mevzuat gereği savcılıklara, mahkemelere ve ilgili kamu görevlilerine bilgi verebilmek için,",
      ],
    ],
    afterLists: [
      "6698 sayılı KVKK ve ilgili düzenlemelere uygun olarak işlenecektir. Belirtilen hususların dışında bu bilgiler hiçbir şekilde başka amaçlarla kullanılamayacak olup, üçüncü kişilere verilemeyecek ve sosyal etkinlik sona erdikten sonra resen silinecektir.",
      "İzmir Summit of Next Model United Nations, kişisel verilerin korunması konusunda şirket politikası olarak özel bir hassasiyet göstermekte olup bu doğrultuda aşağıdaki temel ilkelerin ışığında hareket etmektedir.",
    ],
    principleLists: [
      [
        ["Hukuka ve Dürüstlük Kuralına Uygun İşleme", "Kişisel verilerin işlenmesinde hukuksal düzenlemelerle getirilen ilkeler ile genel güven ve dürüstlük kuralına uygun hareket edilmektedir."],
        ["Kişisel verilerin Doğru ve Gerektiğinde Güncel Olmasını Sağlama", "Kişi gruplarının işlenen kişisel verilerinin doğru ve güncel olması için dönemsel kontrol ve güncellemeler yapılmakta ve bu doğrultuda gerekli tedbirler alınmaktadır. Bu kapsamda kişisel verilerin doğruluğunu kontrol etme ve gerekli düzeltmeleri yapmaya yönelik sistemler İzmir Karabağlar Oğuzhan Özkaya Fen ve Anadolu Lisesi bünyesinde oluşturulur."],
        ["Belirli, Açık ve Meşru Amaçlarla İşleme", "Kişisel veriler açık, belirli ve meşru veri işleme amaçlarına dayalı olarak işlenmektedir. Verilerin hangi amaçla işleneceği, aşağıda detaylı olarak yer almaktadır."],
        ["İşlendikleri Amaçla Bağlantılı, Sınırlı ve Ölçülü Olma", "Kişisel veriler öngörülen amaç/amaçların gerçekleştirilebilmesi için ölçülü, amaçla ilintili ve sınırlı biçimde işlenmekte ve amacın gerçekleştirilmesi ile ilgili olmayan veya ihtiyaç duyulmayan kişisel verilerin işlenmesinden kaçınılmaktadır."],
        ["İlgili Mevzuatta Öngörülen veya İşlendikleri Amaç İçin Gerekli Olan Süre Kadar Muhafaza Etme", "İzmir Summit of Next Model United Nations kişisel verileri ancak ilgili mevzuatta öngörülen veya işlendikleri amaç için gerekli olan süre kadar muhafaza etmektedir. Bu kapsamda, öncelikle ilgili mevzuatta kişisel verilerin saklanması için bir süre öngörülüp öngörülmediği tespit edilmekte, bir süre belirlenmişse bu süreye uygun davranılmakta, bir süre belirlenmemişse kişisel veriler işlendikleri amaç için gerekli olan süre kadar saklanmaktadır. Sürenin bitimi veya işlenmesini gerektiren sebeplerin ortadan kalkması halinde, daha uzun süre işlenmelerine izin veren hukuki bir sebep bulunmaması halinde, kişisel veriler İzmir Summit of Next Model United Nations’ın Kişisel Verilerin Saklanması ve İmhası Politikasına göre resen silinmekte, yok edilmekte veya anonim hale getirilmektedir."],
      ],
    ],
    finalParagraphs: ["Katılımcıların açık rıza onayı olmadan kişisel verilerin hiçbirisi istenmeyecektir."],
  },
  {
    title: "4. Kişisel Verilerinizin Aktarılabileceği Üçüncü Kişi Veya Kuruluşlar Hakkında Bilgilendirme",
    paragraphs: [
      "Yukarıda belirtilen amaçlarla, sonmun.com.tr ile paylaştığınız kişisel verileriniz konferansımızın organizasyon ekibi, akademik ekibi ve aynı zamanda sitemizin arka planında kullandığımız Google servisleri ile paylaşılabilecektir. Mahkemelerden gelen bağlayıcı taleplere yönelik olarak hukuki yükümlülüklerimiz dahilinde verileriniz resmi kurumlarla paylaşılabilecektir.",
    ],
  },
  {
    title: "5. Kişisel Verilerin Saklanması ve Korunması",
    paragraphs: [
      "sonmun.com.tr, gizliliğinizin ve kişisel verilerinizin korunmasına ilişkin endişelerinize saygı duymaktadır. Bu kapsamda sonmun.com.tr, kişisel verilerinizi KVKK başta olmak üzere kişisel verilerin korunmasına ilişkin tüm mevzuat hükümlerine uygun şekilde işlemekte, verilerinizin güvenli şekilde barındırılmasını sağlamakta ve olası hukuka aykırı erişimlere, kaza ile veri kayıplarına, verilerin kasti silinmesine veya verilerin zarar görmesine karşı gerekli tüm güvenlik tedbirlerini almaktadır.",
      "İzmir Summit of Next Model United Nations işlenen verilerin güvenliğinin sağlanması amacıyla aşağıdaki yükümlülüklere uyar:",
    ],
    lists: [
      [
        "Kişisel verilerin korunmasına ilişkin konularda hukuka uygun ve dürüst davranma,",
        "Kişisel verileri doğru, tam ve eksiksiz işleme,",
        "Güncelliğini kaybeden kişisel verilerin güncellenmesi amacıyla gerekli çalışmaları yapma,",
        "Kişisel verilerin işlenmesinde herhangi bir hukuka aykırılık fark ettiğinde ilgili yöneticiyi bilgilendirme,",
        "Kişisel verilere ilişkin kanuni hakların kullanılabilmesi için gerekli yönlendirmeleri yapma.",
      ],
    ],
  },
  {
    title: "6. Kişisel Veri Sahibinin Hakları",
    paragraphs: [
      "Veri sahibi verilerine erişim hakkını her zaman kullanabilir. Buna ek olarak ilgili şartların yerine getirilmesi durumunda KVKK madde 11'de düzenlenen haklar ve aşağıda belirtilen haklar kullanılabilir:",
    ],
    lists: [
      [
        "Kişisel veri işlenip işlenmediğini öğrenme hakkı,",
        "Kişisel verileri işlenmişse buna ilişkin bilgi talep etme hakkı,",
        "Kişisel verilerin işlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme,",
        "Yurt içinde veya yurt dışında kişisel verilerin aktarıldığı üçüncü kişileri bilme,",
        "Kişisel verilerin eksik veya yanlış işlenmiş olması hâlinde bunların düzeltilmesini isteme,",
        "KVKK'nin 7. maddesinde öngörülen şartlar çerçevesinde kişisel verilerin silinmesini veya yok edilmesini isteme,",
        "Kişisel verilerin düzeltilmesi, silinmesi, yok edilmesi halinde bu işlemlerin, kişisel verilerin aktarıldığı üçüncü kişilere de bildirilmesini isteme,",
        "İşlenen verilerin münhasıran otomatik sistemler vasıtasıyla analiz edilmesi suretiyle kişinin kendisi aleyhine bir sonucun ortaya çıkmasına itiraz etme,",
        "Kişisel verilerin kanuna aykırı olarak işlenmesi sebebiyle zarara uğraması hâlinde zararın giderilmesini talep etme hakkı.",
      ],
    ],
  },
  {
    title: "7. İletişim ve Başvuru Yöntemi",
    paragraphs: [
      "Kişisel Veri Sahipleri, sorularını, görüşlerini veya taleplerini son.modelunitednations26@gmail.com e-posta adresine yöneltebilirler. Kişisel verilere ilişkin hakları kullanmak için kişiler; sonmun.com.tr sayfasında yer alan KVKK Başvuru Formu’nu kullanarak yapabileceklerdir. Bu şekilde yapılacak başvurulara en geç 30 gün içerisinde yanıt verilecektir.",
    ],
  },
] as const;

export default function KvkkDisclosurePage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-16 text-white sm:px-10 lg:py-24">
      <article className="rounded-3xl border border-white/15 bg-black/20 p-6 shadow-2xl sm:p-10">
        <header className="border-b border-white/15 pb-7">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">Personal Data</p>
          <h1 className="text-3xl font-bold text-[var(--color-accent)] sm:text-4xl">İZMİR SUMMIT OF NEXT MODEL UNITED NATİONS KONFERANSI Web Sitemizle İle İlgili Olarak 6698 Sayılı Kişisel Verileri Koruma Kanunu Aydınlatma Metni</h1>
        </header>

        <div className="mt-8 space-y-7 text-base leading-8 text-white/85">
          <p className="font-semibold">sonmun.com.tr (İzmir Summit of Next Model United Nations Konferansı Organizasyon Ekibi)</p>
          <p>Kişisel verileriniz 6698 sayılı Kişisel Verilerin Korunması Kanunu (“KVKK”)&apos;na uygun olarak işlenmekte ve muhafaza edilmektedir. 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK), kişisel verilerin işlenmesi ya da korunması ile ilgili hükümlerde veri sorumlularının yükümlülükleri dahilinde; İzmir Karabağlar Oğuzhan Özkaya Fen ve Anadolu Lisesi Kampüsü’nde gerçekleşecek olan İzmir Summit of Next Model United Nations Konferansı’nda öğrencilerin, öğretmenlerin ve ziyaretçilerin kişisel verilerinin korunması önemsenmekte ve bu konuda yasal yükümlülüklerin titizlikle yerine getirilmesi amaçlanmaktadır. Bu bağlamda çalıştaya katılım sağlayacak öğrencilerin, öğretmenlerin ve ziyaretçilerin kişisel verilerinin 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) uygun olarak toplanmasına, işlenmesine ve muhafaza edilmesine büyük önem verilmektedir. KVKK ve Aydınlatma Yükümlülüğünün Yerine Getirilmesiyle Uyulacak Usul Ve Esaslar Hakkında Tebliğ hükümlerine uygun olarak, kişisel verilerin hangi amaçla işleneceği, işlenen kişisel verilerin kimlere ve hangi amaçla aktarılabileceği, kişisel veri toplamanın yöntemi ve hukuki sebebi, KVKK’nın 11. maddede sayılan diğer hakları konusunda aydınlatmakla yükümlü olup aşağıda yükümlülüklerimiz ve haklarımız konusunda gerekli bilgiler sunulmaktadır.</p>

          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="mb-3 text-xl font-semibold text-[var(--color-accent)]">{section.title}</h2>
              <div className="space-y-4">
                {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                {section.lists?.map((items) => (
                  <ul key={items.join("|")} className="list-disc space-y-2 pl-6">
                    {items.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                ))}
                {section.afterLists?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                {section.principleLists?.map((principles) => (
                  <ul key={principles.map(([heading]) => heading).join("|")} className="space-y-4">
                    {principles.map(([heading, description]) => (
                      <li key={heading}>
                        <p className="font-semibold">{heading}</p>
                        <p>{description}</p>
                      </li>
                    ))}
                  </ul>
                ))}
                {section.finalParagraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              </div>
            </section>
          ))}

          <p>
            <Link href="/kvkk" className="font-semibold text-[var(--color-accent)] underline underline-offset-2 hover:text-white">KVKK Başvuru Formu</Link>
          </p>
        </div>
      </article>
    </main>
  );
}
