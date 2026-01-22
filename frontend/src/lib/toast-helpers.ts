import { toast } from 'sonner';
import { handleApiError, getErrorMessage } from './error-handler';

export const toastHelpers = {
  success(message: string, description?: string) {
    toast.success(message, {
      description,
      duration: 4000,
    });
  },

  error(error: unknown, fallbackMessage?: string) {
    const message = error ? handleApiError(error) : (fallbackMessage || 'Terjadi kesalahan tidak terduga');
    toast.error('Kesalahan', {
      description: message,
      duration: 5000,
    });
  },

  warning(message: string, description?: string) {
    toast.warning(message, {
      description,
      duration: 4000,
    });
  },

  info(message: string, description?: string) {
    toast.info(message, {
      description,
      duration: 3000,
    });
  },

  loading(message: string) {
    return toast.loading(message);
  },

  promise<T>(
    promise: Promise<T>,
    {
      loading,
      success,
      error,
    }: {
      loading: string;
      success: string | ((data: T) => string);
      error?: string | ((error: unknown) => string);
    }
  ) {
    return toast.promise(promise, {
      loading,
      success,
      error: (err) => {
        if (typeof error === 'function') {
          return error(err);
        }
        return error || handleApiError(err);
      },
    });
  },

  domainAdded(domainName: string) {
    toast.success('Domain Berhasil Ditambahkan', {
      description: `Domain ${domainName} telah ditambahkan. Silakan verifikasi DNS untuk mengaktifkan.`,
      duration: 5000,
    });
  },

  domainVerified(domainName: string) {
    toast.success('Domain Terverifikasi', {
      description: `Domain ${domainName} telah berhasil diverifikasi dan aktif.`,
      duration: 5000,
    });
  },

  domainDeleted(domainName: string) {
    toast.success('Domain Dihapus', {
      description: `Domain ${domainName} telah dihapus.`,
      duration: 4000,
    });
  },

  domainSetPrimary(domainName: string) {
    toast.success('Domain Utama Diperbarui', {
      description: `${domainName} sekarang menjadi domain utama.`,
      duration: 4000,
    });
  },

  sslRenewed(domainName: string) {
    toast.success('SSL Certificate Diperbaharui', {
      description: `SSL certificate untuk ${domainName} telah diperbaharui.`,
      duration: 4000,
    });
  },

  configurationSaved() {
    toast.success('Konfigurasi Disimpan', {
      description: 'Pengaturan URL tenant telah berhasil disimpan.',
      duration: 4000,
    });
  },

  verificationInProgress(domainName: string) {
    toast.info('Verifikasi Sedang Diproses', {
      description: `Memverifikasi DNS records untuk ${domainName}. Ini mungkin memakan waktu beberapa menit.`,
      duration: 5000,
    });
  },

  verificationFailed(domainName: string, reason?: string) {
    toast.error('Verifikasi Gagal', {
      description: reason || `Gagal memverifikasi domain ${domainName}. Silakan periksa DNS records Anda.`,
      duration: 6000,
    });
  },

  copySuccess(label: string = 'Teks') {
    toast.success(`${label} Disalin`, {
      description: 'Teks telah disalin ke clipboard.',
      duration: 2000,
    });
  },
};
