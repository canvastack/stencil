import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { navigationService } from '../services/tenant/navigationService';
import type {
  HeaderConfig,
  HeaderConfigInput,
  Menu,
  MenuInput,
  MenusQueryParams,
  MenuReorderInput,
  FooterConfig,
  FooterConfigInput,
} from '../types/navigation';
import { useToast } from './use-toast';

const HEADER_KEY = ['navigation', 'header'];
const MENUS_KEY = ['navigation', 'menus'];
const FOOTER_KEY = ['navigation', 'footer'];

export const useHeaderConfig = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: HEADER_KEY,
    queryFn: async () => {
      try {
        console.log('[useHeaderConfig] 🔄 Fetching header config...');
        const result = await navigationService.getHeaderConfig();
        console.log('[useHeaderConfig] ✅ Header config received:', result);
        return result || null;
      } catch (error: any) {
        console.log('[useHeaderConfig] ❌ Header error:', error);
        console.log('[useHeaderConfig] Error response:', error?.response);
        console.log('[useHeaderConfig] Error status:', error?.response?.status);
        // Return null for 404 (no config exists yet)
        if (error?.response?.status === 404 || error?.status === 404) {
          console.log('[useHeaderConfig] Returning null for 404');
          return null;
        }
        // Return null for any other error to prevent undefined
        console.warn('[useHeaderConfig] Returning null due to error:', error?.message);
        return null;
      }
    },
    retry: false,
    staleTime: 30000,
  });

  const createMutation = useMutation({
    mutationFn: (data: HeaderConfigInput) => navigationService.createHeaderConfig(data),
    onSuccess: (data) => {
      queryClient.setQueryData(HEADER_KEY, data);
      toast({
        title: 'Berhasil',
        description: 'Konfigurasi header berhasil dibuat',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Gagal',
        description: error?.response?.data?.message || 'Gagal membuat konfigurasi header',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: HeaderConfigInput) => navigationService.updateHeaderConfig(data),
    onSuccess: (data) => {
      queryClient.setQueryData(HEADER_KEY, data);
      toast({
        title: 'Berhasil',
        description: 'Konfigurasi header berhasil diperbarui',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Gagal',
        description: error?.response?.data?.message || 'Gagal memperbarui konfigurasi header',
        variant: 'destructive',
      });
    },
  });

  console.log('[useHeaderConfig] 📊 Hook state:', {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  });

  return {
    headerConfig: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    createHeaderConfig: createMutation.mutateAsync,
    updateHeaderConfig: updateMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
  };
};

export const useMenuManagement = (params?: MenusQueryParams) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const menusQuery = useQuery({
    queryKey: [...MENUS_KEY, params],
    queryFn: () => navigationService.getMenus(params),
    retry: 1,
  });

  console.log('🔍 RAW QUERY DATA:', menusQuery.data);
  console.log('🔍 EXTRACTED MENUS:', menusQuery.data?.data);
  console.log('🔍 MENUS LENGTH:', menusQuery.data?.data?.length);
  console.log('🔍 META:', menusQuery.data?.meta);

  const createMutation = useMutation({
    mutationFn: (data: MenuInput) => navigationService.createMenu(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MENUS_KEY });
      toast({
        title: 'Berhasil',
        description: 'Menu berhasil dibuat',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Gagal',
        description: error?.response?.data?.message || 'Gagal membuat menu',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ uuid, data }: { uuid: string; data: MenuInput }) => 
      navigationService.updateMenu(uuid, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MENUS_KEY });
      toast({
        title: 'Berhasil',
        description: 'Menu berhasil diperbarui',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Gagal',
        description: error?.response?.data?.message || 'Gagal memperbarui menu',
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (uuid: string) => navigationService.deleteMenu(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MENUS_KEY });
      toast({
        title: 'Berhasil',
        description: 'Menu berhasil dihapus',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Gagal',
        description: error?.response?.data?.message || 'Gagal menghapus menu',
        variant: 'destructive',
      });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: (menus: MenuReorderInput[]) => navigationService.reorderMenus(menus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MENUS_KEY });
      toast({
        title: 'Berhasil',
        description: 'Urutan menu berhasil diperbarui',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Gagal',
        description: error?.response?.data?.message || 'Gagal memperbarui urutan menu',
        variant: 'destructive',
      });
    },
  });

  const restoreMutation = useMutation({
    mutationFn: (uuid: string) => navigationService.restoreMenu(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MENUS_KEY });
      toast({
        title: 'Berhasil',
        description: 'Menu berhasil dipulihkan',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Gagal',
        description: error?.response?.data?.message || 'Gagal memulihkan menu',
        variant: 'destructive',
      });
    },
  });

  console.log('🎯 RETURNING MENUS:', {
    menusLength: (menusQuery.data?.data || []).length,
    menus: menusQuery.data?.data || [],
  });

  return {
    menus: menusQuery.data?.data || [],
    meta: menusQuery.data?.meta,
    isLoading: menusQuery.isLoading,
    isError: menusQuery.isError,
    error: menusQuery.error,
    refetch: menusQuery.refetch,
    createMenu: createMutation.mutateAsync,
    updateMenu: updateMutation.mutateAsync,
    deleteMenu: deleteMutation.mutateAsync,
    reorderMenus: reorderMutation.mutateAsync,
    restoreMenu: restoreMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isReordering: reorderMutation.isPending,
  };
};

export const useFooterConfig = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: FOOTER_KEY,
    queryFn: async () => {
      try {
        console.log('[useFooterConfig] 🔄 Fetching footer config...');
        const result = await navigationService.getFooterConfig();
        console.log('[useFooterConfig] ✅ Footer config received:', result);
        return result || null;
      } catch (error: any) {
        console.log('[useFooterConfig] ❌ Footer error:', error);
        console.log('[useFooterConfig] Error response:', error?.response);
        console.log('[useFooterConfig] Error status:', error?.response?.status);
        // Return null for 404 (no config exists yet)
        if (error?.response?.status === 404 || error?.status === 404) {
          console.log('[useFooterConfig] Returning null for 404');
          return null;
        }
        // Return null for any other error to prevent undefined
        console.warn('[useFooterConfig] Returning null due to error:', error?.message);
        return null;
      }
    },
    retry: false,
    staleTime: 30000,
  });

  const createMutation = useMutation({
    mutationFn: (data: FooterConfigInput) => navigationService.createFooterConfig(data),
    onSuccess: (data) => {
      queryClient.setQueryData(FOOTER_KEY, data);
      toast({
        title: 'Berhasil',
        description: 'Konfigurasi footer berhasil dibuat',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Gagal',
        description: error?.response?.data?.message || 'Gagal membuat konfigurasi footer',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: FooterConfigInput) => navigationService.updateFooterConfig(data),
    onSuccess: (data) => {
      queryClient.setQueryData(FOOTER_KEY, data);
      toast({
        title: 'Berhasil',
        description: 'Konfigurasi footer berhasil diperbarui',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Gagal',
        description: error?.response?.data?.message || 'Gagal memperbarui konfigurasi footer',
        variant: 'destructive',
      });
    },
  });

  console.log('[useFooterConfig] 📊 Hook state:', {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  });

  return {
    footerConfig: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    createFooterConfig: createMutation.mutateAsync,
    updateFooterConfig: updateMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
  };
};

export const useMenuDetail = (uuid: string | undefined) => {
  return useQuery({
    queryKey: [...MENUS_KEY, uuid],
    queryFn: () => uuid ? navigationService.getMenu(uuid) : Promise.reject('No UUID provided'),
    enabled: !!uuid,
    retry: 1,
  });
};
