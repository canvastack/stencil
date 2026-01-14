<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CommentSeeder extends Seeder
{
    public function run(): void
    {
        $tenantId = DB::table('tenants')
            ->where('name', 'PT. Custom Etching Xenial')
            ->value('uuid');

        if (!$tenantId) {
            if ($this->command) {
                $this->command->warn('Tenant PT. Custom Etching Xenial not found. Skipping seeder.');
            }
            return;
        }

        $blogContents = DB::table('canplug_pagen_contents')
            ->where('tenant_id', $tenantId)
            ->where('is_commentable', true)
            ->where('status', 'published')
            ->limit(10)
            ->get();

        if ($blogContents->isEmpty()) {
            if ($this->command) {
                $this->command->warn('No commentable contents found. Run ContentSeeder first.');
            }
            return;
        }

        $customerEmails = [
            'budi.santoso@example.com',
            'ani.wijaya@example.com',
            'rudi.hermawan@example.com',
            'siti.nurhaliza@example.com',
            'agus.pratama@example.com',
        ];

        $comments = [];
        $commentCount = 0;

        foreach ($blogContents as $content) {
            $parentComments = [];
            
            for ($i = 0; $i < rand(3, 7); $i++) {
                $customerEmail = $customerEmails[array_rand($customerEmails)];
                $customerName = explode('@', $customerEmail)[0];
                $customerName = str_replace('.', ' ', $customerName);
                $customerName = ucwords($customerName);

                $commentData = [
                    'content_id' => $content->uuid,
                    'parent_id' => null,
                    'user_id' => null,
                    'author_name' => $customerName,
                    'author_email' => $customerEmail,
                    'comment_text' => $this->generateCommentText(),
                    'status' => ['pending', 'approved', 'approved', 'approved'][rand(0, 3)],
                    'ip_address' => $this->generateIP(),
                    'spam_score' => 0,
                    'metadata' => json_encode([]),
                    'created_at' => now()->subDays(rand(1, 30)),
                    'updated_at' => now()->subDays(rand(0, 15)),
                ];

                $parentUuid = Str::uuid()->toString();
                $commentData['uuid'] = $parentUuid;
                $parentComments[] = $parentUuid;

                DB::table('canplug_pagen_comments')->insert($commentData);
                $commentCount++;

                if (rand(0, 10) > 5) {
                    $replyCustomerEmail = $customerEmails[array_rand($customerEmails)];
                    $replyCustomerName = explode('@', $replyCustomerEmail)[0];
                    $replyCustomerName = str_replace('.', ' ', $replyCustomerName);
                    $replyCustomerName = ucwords($replyCustomerName);

                    $replyData = [
                        'content_id' => $content->uuid,
                        'parent_id' => $parentUuid,
                        'user_id' => null,
                        'author_name' => $replyCustomerName,
                        'author_email' => $replyCustomerEmail,
                        'comment_text' => $this->generateReplyText($customerName),
                        'status' => 'approved',
                        'ip_address' => $this->generateIP(),
                        'spam_score' => 0,
                        'metadata' => json_encode([]),
                        'created_at' => now()->subDays(rand(1, 25)),
                        'updated_at' => now()->subDays(rand(0, 10)),
                    ];

                    DB::table('canplug_pagen_comments')->insert($replyData);
                    $commentCount++;
                }
            }
        }

        if ($this->command) {
            $this->command->info("CommentSeeder: {$commentCount} comments seeded (with threaded replies)");
        }
    }

    private function generateCommentText(): string
    {
        $comments = [
            'Artikel yang sangat informatif! Saya baru mengetahui tentang teknik etching ini. Terima kasih atas sharingnya.',
            'Sangat membantu untuk project kami yang sedang berjalan. Apakah ada rekomendasi vendor untuk material stainless steel?',
            'Penjelasan yang detail dan mudah dipahami. Saya tertarik untuk mencoba teknik ini untuk bisnis saya.',
            'Mantap! Kami sudah beberapa kali order di PT CEX dan hasilnya selalu memuaskan. Recommended!',
            'Apakah teknik ini bisa diaplikasikan untuk material akrilik tebal (10mm)?',
            'Artikel yang bagus. Saya ingin tahu lebih lanjut tentang proses chemical etching. Ada artikel lanjutannya?',
            'Terima kasih atas tips-tipsnya. Sangat bermanfaat untuk project trophy perusahaan kami.',
            'Kualitas artikel yang luar biasa. Menambah wawasan saya tentang industri etching.',
            'Saya pernah coba sendiri dan hasilnya kurang maksimal. Sepertinya memang perlu keahlian khusus ya.',
            'Berapa lama waktu yang diperlukan untuk produksi 100 unit plakat dengan teknik ini?',
            'Sangat membantu! Kami sedang mencari supplier untuk event tahunan perusahaan.',
            'Detail penjelasannya sangat jelas. Apakah ada video tutorial untuk teknik ini?',
            'Keren! Kami tertarik untuk bekerjasama. Bagaimana cara untuk request quotation?',
            'Artikel yang sangat bermanfaat untuk pemula seperti saya. Keep posting!',
            'Apakah ada perbedaan harga yang signifikan antara laser etching dan chemical etching?',
        ];

        return $comments[array_rand($comments)];
    }

    private function generateReplyText($mentionName): string
    {
        $replies = [
            "Terima kasih {$mentionName}! Senang artikel ini bermanfaat untuk Anda.",
            "Hai {$mentionName}, untuk pertanyaan Anda silakan hubungi tim sales kami di sales@ptcex.com",
            "{$mentionName}, betul sekali! Kami siap membantu project Anda. Silakan kontak kami untuk diskusi lebih lanjut.",
            "Salam {$mentionName}, terima kasih atas feedback positifnya. Kami akan terus berbagi informasi bermanfaat.",
            "{$mentionName}, untuk detail spesifikasi seperti itu sebaiknya konsultasi langsung dengan tim teknis kami.",
            "Hai {$mentionName}, artikel lanjutan sudah dalam proses penulisan. Stay tuned!",
            "Terima kasih {$mentionName}! Jangan ragu untuk menghubungi kami jika ada pertanyaan lebih lanjut.",
        ];

        return $replies[array_rand($replies)];
    }

    private function generateIP(): string
    {
        return rand(1, 255) . '.' . rand(1, 255) . '.' . rand(1, 255) . '.' . rand(1, 255);
    }
}
