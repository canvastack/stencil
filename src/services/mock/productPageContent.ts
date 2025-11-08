import { PageContent } from '@/types/page-content';
import { getPageContent, updatePageContent } from './pages';

class ProductPageContentService {
  // Reads content from the central pages mock (services/mock/pages.ts)
  async getContent(): Promise<PageContent> {
    // Small simulated delay to mimic network
    await new Promise((resolve) => setTimeout(resolve, 200));
  const content = getPageContent('products') as unknown as PageContent | undefined;
  if (!content) throw new Error('Product page content not found');
  return content;
  }

  // Updates content via the pages mock so changes are visible site-wide
  async updateContent(newContent: PageContent): Promise<PageContent> {
    await new Promise((resolve) => setTimeout(resolve, 200));
  const updatedPage = updatePageContent('products', newContent as any);
  return updatedPage.content as unknown as PageContent;
  }

  // No-op: pages.resetPages exists if a full reset is needed elsewhere
}

export const productPageContentService = new ProductPageContentService();