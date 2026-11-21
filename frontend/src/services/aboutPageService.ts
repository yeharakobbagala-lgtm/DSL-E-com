import { apiClient, BackendApiResponse } from '@/lib/api/apiClient';
import { AboutPageData, DEFAULT_ABOUT_PAGE_DATA } from '@/types/about';

class AboutPageService {
  /**
   * Public: Fetch customer-facing About Us page sections and imagery.
   */
  public async getAboutPageContent(): Promise<AboutPageData> {
    try {
      const res = await apiClient.get<any>('store-settings/about');
      const data = res?.data ?? res;
      if (data && typeof data === 'object') {
        return { ...DEFAULT_ABOUT_PAGE_DATA, ...data };
      }
      return DEFAULT_ABOUT_PAGE_DATA;
    } catch (err) {
      console.warn('Failed to fetch public about page content, using defaults:', err);
      return DEFAULT_ABOUT_PAGE_DATA;
    }
  }

  /**
   * Admin: Fetch About Us page configuration for editing.
   */
  public async getAdminAboutPageContent(): Promise<AboutPageData> {
    try {
      const res = await apiClient.get<any>('store-settings/admin/about');
      const data = res?.data ?? res;
      if (data && typeof data === 'object') {
        return { ...DEFAULT_ABOUT_PAGE_DATA, ...data };
      }
      return DEFAULT_ABOUT_PAGE_DATA;
    } catch (err) {
      console.warn('Failed to fetch admin about page content, using defaults:', err);
      return DEFAULT_ABOUT_PAGE_DATA;
    }
  }

  /**
   * Admin: Save updated About Us page content.
   */
  public async updateAboutPageContent(
    data: Partial<AboutPageData>
  ): Promise<AboutPageData> {
    const res = await apiClient.put<any>('store-settings/admin/about', data);
    const updated = res?.data ?? res;
    return { ...DEFAULT_ABOUT_PAGE_DATA, ...updated };
  }

  /**
   * Upload an image file for any section of the About Us page.
   * Returns the uploaded asset URL.
   */
  public async uploadAboutImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await apiClient.post<BackendApiResponse<{ url: string }>>(
      'uploads',
      formData,
      {
        params: { folder: 'general' },
      }
    );

    if (res?.success && res.data?.url) {
      return res.data.url;
    }
    if ((res as any)?.url) {
      return (res as any).url;
    }
    throw new Error(res?.message || 'Failed to upload image');
  }
}

export const aboutPageService = new AboutPageService();
export default aboutPageService;
