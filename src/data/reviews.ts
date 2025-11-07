export interface Review {
  id: string;
  productId: string;
  userName: string;
  userImage?: string;
  rating: number;
  date: string;
  comment: string;
  verified: boolean;
}

export const reviews: Review[] = [
  {
    id: "1",
    productId: "1",
    userName: "Budi Santoso",
    rating: 5,
    date: "2024-01-15",
    comment: "Kualitas etching sangat presisi dan detail. Hasil melampaui ekspektasi saya. Sangat puas dengan produk dan layanan yang diberikan. Pengiriman juga sangat cepat dan aman.",
    verified: true,
  },
  {
    id: "2",
    productId: "1",
    userName: "Siti Rahayu",
    rating: 5,
    date: "2024-01-10",
    comment: "Material stainless steel berkualitas tinggi. Tim customer service sangat membantu dalam proses konsultasi desain. Highly recommended!",
    verified: true,
  },
  {
    id: "3",
    productId: "1",
    userName: "Ahmad Yusuf",
    rating: 4,
    date: "2024-01-05",
    comment: "Produk bagus dengan harga yang kompetitif. Pengerjaan rapi dan sesuai dengan sample yang diberikan. Akan order lagi untuk project selanjutnya.",
    verified: true,
  },
  {
    id: "4",
    productId: "2",
    userName: "Linda Wijaya",
    rating: 5,
    date: "2024-01-20",
    comment: "Trophy kaca yang sangat elegan! Sempurna untuk acara penghargaan perusahaan kami. Etching logonya sangat detail dan presisi.",
    verified: true,
  },
  {
    id: "5",
    productId: "2",
    userName: "Eko Prasetyo",
    rating: 5,
    date: "2024-01-18",
    comment: "Kualitas premium dengan hasil yang memuaskan. Packaging sangat aman dan produk sampai dalam kondisi sempurna.",
    verified: true,
  },
  {
    id: "6",
    productId: "3",
    userName: "Dewi Lestari",
    rating: 5,
    date: "2024-01-22",
    comment: "Plakat brass yang sangat berkelas. Detail etching sangat halus dan elegan. Tim sangat profesional dalam handling custom design kami.",
    verified: true,
  },
];
