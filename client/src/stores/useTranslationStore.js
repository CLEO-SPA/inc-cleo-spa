import { create } from 'zustand';
import api from '@/services/api';

const useTranslationStore = create((set, get) => ({
    // Form state and messages
    english: '',
    chinese: '',
    meaningEnglish: '',
    meaningChinese: '',
    error: '',
    success: '',
    showConfirm: false,
    confirmTranslation: {},

    // Translation data and loading state
    translations: [],
    loading: false,
    createdAt: '',
    setCreatedAt: (value) => set({ createdAt: value }),

    // Setters
    setEnglish: (val) => set({ english: val }),
    setChinese: (val) => set({ chinese: val }),
    setMeaningEnglish: (val) => set({ meaningEnglish: val }),
    setMeaningChinese: (val) => set({ meaningChinese: val }),
    setError: (val) => set({ error: val }),
    setSuccess: (val) => set({ success: val }),
    setShowConfirm: (val) => set({ showConfirm: val }),
    setConfirmTranslation: (val) => set({ confirmTranslation: val }),

    // Fetch all translations once and store uniquely
    fetchTranslations: async () => {
        set({ loading: true });
        try {
            const response = await api.get('/trans/all');
            // Remove duplicates by english key (case-insensitive)
            const unique = Array.from(
                new Map(
                    response.data.map((item) => [item.english.toLowerCase(), item])
                ).values()
            );
            set({ translations: unique, loading: false });
        } catch (error) {
            console.error('Error fetching all translations:', error);
            set({ loading: false, error: 'Failed to load translations' });
        }
    },
    // Add new translation
    addTranslation: async (fetchTranslations, t) => {
        const {
            english,
            chinese,
            meaningEnglish,
            meaningChinese,
            createdAt,
        } = get();

        try {
            const payload = {
                english,
                chinese,
                ...(meaningEnglish && { meaning_in_english: meaningEnglish }),
                ...(meaningChinese && { meaning_in_chinese: meaningChinese }),
                ...(createdAt && { created_at: createdAt }),
            };

            const response = await api.post('/trans/add', payload);

            if (response.status === 200 || response.status === 201) {
                set({
                    success: t('Translation added successfully!', '翻译添加成功！'),
                    error: '',
                    english: '',
                    chinese: '',
                    meaningEnglish: '',
                    meaningChinese: '',
                    createdAt: '',
                });
                await fetchTranslations();
            }
        } catch (error) {
            if (error.response?.status === 400) {
                set({ error: t('Translation already exists', '翻译已存在'), success: '' });
            } else {
                set({
                    error: error.response?.data?.error || t('Failed to add translation.', '添加翻译失败'),
                    success: '',
                });
            }
        }
    },


    // Update existing translation by id
    // Update existing translation by id
    updateTranslation: async (id, { chinese, meaning_in_english, meaning_in_chinese, updated_at }) => {
        try {
            const payload = {
                ...(chinese && { chinese }),
                ...(meaning_in_english && { meaning_in_english }),
                ...(meaning_in_chinese && { meaning_in_chinese }),
                ...(updated_at && { updated_at }),
            };

            await api.put(`/trans/${id}`, payload);
            await get().fetchTranslations();
            set({ success: 'Translation updated successfully!', error: '' });
            return true;
        } catch (error) {
            console.error('Failed to update translation:', error);
            set({ error: 'Failed to update translation.', success: '' });
            return false;
        }
    },


    // Delete translation by id
    deleteTranslation: async (id) => {
        try {
            await api.delete(`/trans/${id}`);
            await get().fetchTranslations();
            set({ success: 'Translation deleted successfully!', error: '' });
            return true;
        } catch (error) {
            console.error('Failed to delete translation:', error);
            set({ error: 'Failed to delete translation.', success: '' });
            return false;
        }
    },
}));

export default useTranslationStore;
