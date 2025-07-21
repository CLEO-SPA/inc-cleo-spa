import { create } from 'zustand';
import api from '@/services/api';

const getInitialState = () => ({
  newPassword: '',
  confirmPassword: '',
  error: '',
  successMessage: '',
  isSubmitting: false,
  token: '',
  isVerifying: true,
  isTokenValid: false,
});

const useResetPasswordStore = create((set, get) => ({
  ...getInitialState(),

  setField: (field, value) => set({ [field]: value }),

  verifyToken: async () => {
    const token = get().token;
    if (!token) {
      set({ isVerifying: false, error: 'No reset token found in URL.' });
      return;
    }

    set({ isVerifying: true, error: '' });
    try {
      await api.post(`/em/verify?token=${token}`);
      set({ isTokenValid: true });
    } catch (err) {
      set({
        isTokenValid: false,
        error: err.response?.data?.message || 'Invalid or expired invitation link.',
      });
    } finally {
      set({ isVerifying: false });
    }
  },

  resetPassword: async (navigate) => {
    const { newPassword, confirmPassword, token } = get();
    set({ error: '', successMessage: '' });

    if (!newPassword || !confirmPassword) {
      set({ error: 'Please fill in both password fields.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      set({ error: 'Passwords do not match.' });
      return;
    }
    if (newPassword.length < 8) {
      set({ error: 'Password must be at least 8 characters long.' });
      return;
    }

    set({ isSubmitting: true });
    try {
      const response = await api.post(`/em/invites?token=${token}`, {
        password: newPassword,
      });

      if (response.status === 200) {
        set({
          successMessage: 'Password has been reset successfully! You can now log in with your new password.',
          newPassword: '',
          confirmPassword: '',
        });
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (err) {
      set({
        error: err.response?.data?.message || 'An unexpected error occurred. The link may have expired.',
      });
    } finally {
      set({ isSubmitting: false });
    }
  },

  reset: () => set(getInitialState()),
}));

export default useResetPasswordStore;
