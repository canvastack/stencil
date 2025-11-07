import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { MessageCircle, HelpCircle, Lightbulb } from "lucide-react";

const FAQ = () => {
  const faqCategories = [
    {
      category: "Umum",
      icon: <HelpCircle className="w-5 h-5" />,
      questions: [
        {
          q: "Apa itu etching dan bagaimana prosesnya?",
          a: "Etching adalah proses mengukir desain pada permukaan material seperti metal, kaca, atau kristal menggunakan teknologi laser atau chemical. Proses ini menghasilkan detail yang presisi dan tahan lama. Kami menggunakan teknologi terkini untuk memastikan hasil yang sempurna."
        },
        {
          q: "Berapa lama waktu produksi untuk pesanan saya?",
          a: "Waktu produksi bervariasi tergantung jenis produk dan kompleksitas desain. Umumnya: Signage dan nameplate (7-14 hari), Award dan plakat (10-21 hari), Panel dekoratif besar (21-45 hari). Kami akan memberikan estimasi waktu yang akurat saat Anda melakukan pemesanan."
        },
        {
          q: "Apakah ada minimum order quantity (MOQ)?",
          a: "MOQ bervariasi tergantung jenis produk. Untuk award dan plakat custom, MOQ mulai dari 1 pcs. Untuk signage industrial dan nameplate, MOQ mulai dari 10-50 pcs. Silakan hubungi kami untuk informasi MOQ spesifik produk yang Anda inginkan."
        },
        {
          q: "Apakah saya bisa melihat sample atau proof sebelum produksi?",
          a: "Ya, tentu! Kami menyediakan digital proof/mockup gratis untuk persetujuan Anda sebelum proses produksi dimulai. Untuk physical sample, tersedia dengan biaya tambahan yang akan dikembalikan jika Anda melakukan order."
        }
      ]
    },
    {
      category: "Desain & Customization",
      icon: <Lightbulb className="w-5 h-5" />,
      questions: [
        {
          q: "Apakah saya bisa mengirimkan desain sendiri?",
          a: "Sangat bisa! Anda dapat mengirimkan desain dalam format vector (AI, EPS, PDF) atau high-resolution image (PNG, JPG minimal 300 DPI). Tim desain kami juga siap membantu menyempurnakan atau membuat desain baru sesuai kebutuhan Anda."
        },
        {
          q: "Jenis font apa yang bisa digunakan untuk etching?",
          a: "Hampir semua jenis font dapat digunakan, namun kami merekomendasikan font dengan ketebalan minimal 1pt untuk hasil optimal. Font dengan detail terlalu tipis atau kompleks mungkin tidak akan terlihat jelas pada material tertentu. Tim kami akan memberikan saran terbaik."
        },
        {
          q: "Apakah bisa menambahkan foto atau gambar kompleks?",
          a: "Ya, kami dapat melakukan photo etching untuk reproduksi foto atau gambar kompleks pada metal dan kaca. Hasil terbaik untuk foto dengan kontras yang baik dan resolusi tinggi (minimal 300 DPI). Kami akan melakukan pre-processing untuk optimasi hasil."
        },
        {
          q: "Apakah ada batasan ukuran desain?",
          a: "Batasan ukuran tergantung material dan metode etching. Untuk detail sangat kecil (dibawah 0.5mm), kami akan merekomendasikan penyesuaian desain. Untuk area besar, kami bisa melakukan sectioning atau panel. Konsultasikan desain Anda dengan tim kami."
        }
      ]
    },
    {
      category: "Material & Kualitas",
      icon: <Package className="w-5 h-5" />,
      questions: [
        {
          q: "Material apa saja yang tersedia untuk etching?",
          a: "Kami melayani etching untuk berbagai material: Metal (Stainless Steel, Brass, Aluminum, Copper, Titanium), Kaca (Clear, Frosted, Mirror, Crystal), Award Material (Acrylic, Wood, Granite). Setiap material memiliki karakteristik dan keunggulan berbeda."
        },
        {
          q: "Apakah hasil etching tahan lama dan anti luntur?",
          a: "Ya! Etching adalah proses permanen yang mengubah struktur permukaan material, bukan hanya coating atau print. Hasil etching sangat tahan terhadap weathering, UV, korosi, dan abrasi. Untuk aplikasi outdoor, kami juga menyediakan protective coating tambahan."
        },
        {
          q: "Bagaimana cara merawat produk etching?",
          a: "Perawatan sangat mudah: Metal - lap dengan kain lembut, hindari abrasive cleaner. Kaca - cuci dengan sabun lembut dan air, dishwasher safe untuk produk tertentu. Award/Plakat - bersihkan dengan microfiber cloth. Kami akan memberikan care instruction spesifik untuk setiap produk."
        },
        {
          q: "Apakah produk Anda memiliki sertifikat kualitas?",
          a: "Ya, untuk aplikasi industrial dan aerospace, produk kami memenuhi standar internasional dan dilengkapi dengan Certificate of Conformance (CoC). Material yang kami gunakan bersertifikat dan traceable. Kami juga melakukan quality control ketat di setiap tahap produksi."
        }
      ]
    },
    {
      category: "Pemesanan & Pembayaran",
      icon: <ShoppingCart className="w-5 h-5" />,
      questions: [
        {
          q: "Bagaimana cara melakukan pemesanan?",
          a: "Proses pemesanan sangat mudah: 1) Hubungi kami via WhatsApp/Email/Form dengan detail kebutuhan, 2) Konsultasi desain dan material dengan tim kami, 3) Terima quotation dan digital proof, 4) Approve dan lakukan pembayaran, 5) Produksi dimulai, 6) Quality check dan pengiriman."
        },
        {
          q: "Apa saja metode pembayaran yang diterima?",
          a: "Kami menerima: Transfer Bank (BCA, Mandiri, BNI), Virtual Account, E-wallet (OVO, GoPay, Dana), Credit Card (untuk pemesanan online). Untuk corporate order, tersedia termin pembayaran 30-60 hari setelah approval."
        },
        {
          q: "Apakah ada biaya tambahan selain harga produk?",
          a: "Harga quotation sudah termasuk: desain/artwork, produksi, dan packaging. Biaya tambahan mungkin berlaku untuk: Physical sample, Revisi desain major (lebih dari 3x), Express production (rush order), Special packaging/gift box, Ongkos kirim (tergantung lokasi)."
        },
        {
          q: "Bagaimana dengan garansi dan return policy?",
          a: "Kami memberikan garansi 100% untuk defect produksi. Jika ada kesalahan dari pihak kami (salah etching, material defect), kami akan remake gratis. Untuk cancel order setelah produksi dimulai, akan dikenakan charge 50%. Kami tidak menerima return untuk custom order kecuali ada defect."
        }
      ]
    },
    {
      category: "Pengiriman",
      icon: <Truck className="w-5 h-5" />,
      questions: [
        {
          q: "Apakah produk bisa dikirim ke seluruh Indonesia?",
          a: "Ya! Kami melayani pengiriman ke seluruh Indonesia melalui ekspedisi terpercaya (JNE, J&T, SiCepat, Grab, GoSend untuk area Jabodetabek). Untuk produk fragile seperti kaca dan crystal, kami gunakan packaging khusus dengan asuransi."
        },
        {
          q: "Berapa lama estimasi pengiriman?",
          a: "Estimasi pengiriman setelah produksi selesai: Jabodetabek (1-2 hari), Jawa (2-3 hari), Luar Jawa (3-7 hari). Untuk produk besar atau area remote, mungkin memerlukan waktu lebih lama. Kami akan memberikan tracking number untuk monitoring pengiriman."
        },
        {
          q: "Apakah ada opsi express delivery?",
          a: "Ya, tersedia same day delivery untuk area Jabodetabek (tergantung ketersediaan) dan next day delivery untuk Jawa. Untuk pengiriman express, mohon informasikan saat melakukan order. Biaya tambahan akan berlaku."
        },
        {
          q: "Bagaimana jika produk rusak saat pengiriman?",
          a: "Semua pengiriman produk fragile (kaca, crystal, award) diasuransikan penuh. Jika terjadi kerusakan, segera foto dan laporkan dalam 1x24 jam setelah penerimaan. Kami akan proses klaim asuransi dan kirim pengganti atau refund sesuai kebijakan."
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-orange-light rounded-2xl mb-6 animate-float">
            <HelpCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary via-orange-light to-primary bg-clip-text text-transparent animate-gradient">
            Frequently Asked Questions
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Temukan jawaban untuk pertanyaan yang sering ditanyakan tentang layanan etching kami. 
            Jika Anda tidak menemukan jawaban yang Anda cari, jangan ragu untuk menghubungi kami.
          </p>
          <Button 
            size="lg"
            className="bg-gradient-to-r from-primary to-orange-light text-white hover:shadow-glow"
          >
            <MessageCircle className="w-5 h-5 mr-2" />
            Hubungi Kami
          </Button>
        </div>
      </section>

      {/* FAQ Categories */}
      <section className="pb-20 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="space-y-8">
            {faqCategories.map((category, idx) => (
              <Card 
                key={idx}
                className="p-6 md:p-8 backdrop-blur-sm bg-card/50 border-border/50 hover:border-primary/30 transition-all duration-300 animate-fade-in"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-orange-light flex items-center justify-center">
                    {category.icon}
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">
                    {category.category}
                  </h2>
                </div>

                <Accordion type="single" collapsible className="space-y-4">
                  {category.questions.map((item, qIdx) => (
                    <AccordionItem 
                      key={qIdx} 
                      value={`item-${idx}-${qIdx}`}
                      className="border border-border/50 rounded-lg px-6 hover:border-primary/30 transition-all"
                    >
                      <AccordionTrigger className="text-left hover:text-primary hover:no-underline py-4">
                        <span className="font-semibold text-base pr-4">
                          {item.q}
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground leading-relaxed pb-4 pt-2">
                        {item.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </Card>
            ))}
          </div>

          {/* Still Have Questions CTA */}
          <Card className="mt-12 p-8 md:p-12 text-center bg-gradient-to-br from-primary/5 to-orange-light/5 border-primary/20">
            <MessageCircle className="w-12 h-12 text-primary mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-4 text-foreground">
              Masih Ada Pertanyaan?
            </h3>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Tim customer service kami siap membantu Anda 24/7. Jangan ragu untuk menghubungi kami 
              melalui WhatsApp, email, atau form kontak untuk konsultasi gratis.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                className="bg-gradient-to-r from-primary to-orange-light text-white hover:shadow-glow"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Chat via WhatsApp
              </Button>
              <Button 
                size="lg"
                variant="outline"
                className="border-primary/30 hover:bg-primary/5"
              >
                Email Kami
              </Button>
            </div>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
};

// Missing imports
import { ShoppingCart, Truck, Package } from "lucide-react";

export default FAQ;
