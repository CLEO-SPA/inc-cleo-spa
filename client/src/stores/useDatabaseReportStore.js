import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import apiClient from '@/services/api';

export const useDatabaseReportStore = create(
  devtools(
    persist(
      (set, get) => ({
        // states used
        packages: [],
        carePackageData: null,
        isLoading: false,
        error: null,

        // actions
        addPackage: async (packageData) => {
          set({ isLoading: true, error: null });

          try {
            const packageWithTimestamps = {
              ...packageData,
              created_at: packageData.created_at || new Date().toISOString(),
              updated_at: packageData.updated_at || new Date().toISOString(),
            };

            let apiResponse;

            try {
              const response = await apiClient.post('/cp/e', packageWithTimestamps);
              apiResponse = response.data;
            } catch (error) {
              console.log('API request failed, creating mock data:', error.message);

              // create mock data if API fails (for development/testing)
              apiResponse = {
                old: {
                  care_packages: [],
                  care_package_item_details: [],
                },
                new: {
                  care_packages: [
                    {
                      id: 1,
                      care_package_name: 'GOLD LIFT TREATMENT',
                      care_package_remarks:
                        'Lifts and firms the skin while relieving neck tension. Avoid if you have neck or spine issues.',
                      care_package_price: '1280',
                      care_package_customizable: 'ENABLED',
                      created_at: '2024-08-11T20:46:24+08:00',
                      updated_at: '2024-08-11T20:46:24+08:00',
                    },
                    {
                      id: 2,
                      care_package_name: 'EYEBROW SHAPING',
                      care_package_remarks:
                        'Defines and enhances your natural brow shape. Not suitable during pregnancy or if you have foot wounds.',
                      care_package_price: '500',
                      care_package_customizable: 'ENABLED',
                      created_at: '2024-02-22T19:21:07+08:00',
                      updated_at: '2024-02-22T19:21:07+08:00',
                    },
                  ],
                  care_package_item_details:
                    packageWithTimestamps.services?.flatMap((service) => [
                      {
                        id: `1`,
                        care_package_id: 1,
                        service_id: service.id,
                        care_package_item_details_quantity: 10,
                        care_package_item_details_discount: 0,
                        care_package_item_details_price: 128,
                      },
                      {
                        id: `2`,
                        care_package_id: 2,
                        service_id: service.id,
                        care_package_item_details_quantity: 5,
                        care_package_item_details_discount: 0,
                        care_package_item_details_price: 100,
                      },
                    ]) || [],
                },
              };
            }

            set((state) => ({
              carePackageData: apiResponse,
              packages: [...state.packages, ...(apiResponse.new?.care_packages || [])],
              isLoading: false,
            }));

            return apiResponse;
          } catch (error) {
            console.error('Error in addPackage:', error);
            set({ error: error.message, isLoading: false });
            throw error;
          }
        },

        updatePackage: async (packageId, updatedData) => {
          set({ isLoading: true, error: null });

          try {
            const state = get();
            const existingPackage = state.packages.find((pkg) => pkg.id === packageId);

            if (!existingPackage) {
              console.warn(`Package with ID ${packageId} not found for update. Skipping update.`);
              set({ isLoading: false });
              return null;
            }

            const packageWithTimestamp = {
              ...updatedData,
              id: packageId,
              updated_at: new Date().toISOString(),
            };

            let apiResponse;

            try {
              const response = await apiClient.put('/cp/e', packageWithTimestamp);
              apiResponse = response.data;
            } catch (error) {
              console.log('UPDATE API request failed, creating mock data:', error.message);

              const updatedPackage = {
                ...existingPackage,
                care_package_name: updatedData.package_name || existingPackage.care_package_name,
                care_package_remarks: updatedData.package_remarks || existingPackage.care_package_remarks,
                care_package_price: updatedData.package_price || existingPackage.care_package_price,
                care_package_customizable:
                  updatedData.is_customizable !== undefined
                    ? updatedData.is_customizable
                    : existingPackage.care_package_customizable,
                updated_at: packageWithTimestamp.updated_at,
              };

              apiResponse = {
                old: {
                  care_packages: [existingPackage],
                  care_package_item_details: [],
                },
                new: {
                  care_packages: [updatedPackage],
                  care_package_item_details:
                    updatedData.services?.map((service, idx) => ({
                      id: (idx + 1).toString(),
                      care_package_id: packageId,
                      service_id: service.id,
                      care_package_item_details_quantity: service.quantity,
                      care_package_item_details_discount: service.discount,
                      care_package_item_details_price: service.price,
                    })) || [],
                },
              };
            }

            set((state) => ({
              carePackageData: apiResponse,
              packages: state.packages.map((pkg) =>
                pkg.id === packageId ? apiResponse.new?.care_packages?.[0] || pkg : pkg
              ),
              isLoading: false,
            }));

            return apiResponse;
          } catch (error) {
            console.error('Error in updatePackage:', error);
            set({ error: error.message, isLoading: false });
            throw error;
          }
        },

        deletePackage: async (packageId) => {
          set({ isLoading: true, error: null });

          try {
            const state = get();
            const packageToDelete = state.packages.find((pkg) => pkg.id === packageId);

            if (!packageToDelete) {
              console.warn(`Package with ID ${packageId} not found for deletion. Skipping delete.`);
              set({ isLoading: false });
              return null;
            }

            let apiResponse;

            try {
              const response = await apiClient.delete('/cp/e', {
                params: { id: packageId },
              });
              apiResponse = response.data;
            } catch (error) {
              console.log('DELETE API request failed, creating mock data:', error.message);

              apiResponse = {
                old: {
                  care_packages: [packageToDelete],
                  care_package_item_details: [],
                },
                new: {
                  care_packages: [],
                  care_package_item_details: [],
                },
              };
            }

            set((state) => ({
              carePackageData: apiResponse,
              packages: state.packages.filter((pkg) => pkg.id !== packageId),
              isLoading: false,
            }));

            return apiResponse;
          } catch (error) {
            console.error('Error in deletePackage:', error);
            set({ error: error.message, isLoading: false });
            throw error;
          }
        },

        fetchPackages: async () => {
          set({ isLoading: true, error: null });

          try {
            const response = await apiClient.get('/cp');
            const packages = response.data;

            console.log('Fetched packages:', packages);
            set({ packages, isLoading: false });
            return packages;
          } catch (error) {
            console.error('Error in fetchPackages:', error);
            set({ error: error.message, isLoading: false });
            throw error;
          }
        },

        clearError: () => set({ error: null }),
        setLoading: (loading) => set({ isLoading: loading }),
      }),
      {
        name: 'database-report-store',
        partialize: (state) => ({ packages: state.packages }),
      }
    )
  )
);