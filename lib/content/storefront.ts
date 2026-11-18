import fs from 'fs';
import path from 'path';
import { StorefrontContent, DEFAULT_STOREFRONT_CONTENT } from './defaults';

export type { StorefrontContent };
export { DEFAULT_STOREFRONT_CONTENT };

const CONTENT_FILE_PATH = path.join(process.cwd(), 'data', 'storefront-content.json');

export async function getStorefrontContent(): Promise<StorefrontContent> {
  try {
    if (fs.existsSync(CONTENT_FILE_PATH)) {
      const raw = await fs.promises.readFile(CONTENT_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_STOREFRONT_CONTENT,
        ...parsed,
        announcement: { ...DEFAULT_STOREFRONT_CONTENT.announcement, ...(parsed.announcement || {}) },
        brand: { ...DEFAULT_STOREFRONT_CONTENT.brand, ...(parsed.brand || {}) },
        hero: { ...DEFAULT_STOREFRONT_CONTENT.hero, ...(parsed.hero || {}) },
        categoriesSection: { ...DEFAULT_STOREFRONT_CONTENT.categoriesSection, ...(parsed.categoriesSection || {}) },
        collectionSection: { ...DEFAULT_STOREFRONT_CONTENT.collectionSection, ...(parsed.collectionSection || {}) },
        festivePromo: { ...DEFAULT_STOREFRONT_CONTENT.festivePromo, ...(parsed.festivePromo || {}) },
        storySection: { ...DEFAULT_STOREFRONT_CONTENT.storySection, ...(parsed.storySection || {}) },
        socialSection: { ...DEFAULT_STOREFRONT_CONTENT.socialSection, ...(parsed.socialSection || {}) },
      };
    }
  } catch (err) {
    console.error('Error reading storefront content:', err);
  }
  return DEFAULT_STOREFRONT_CONTENT;
}

export async function saveStorefrontContent(content: Partial<StorefrontContent>): Promise<StorefrontContent> {
  const current = await getStorefrontContent();
  const merged: StorefrontContent = {
    ...current,
    ...content,
    announcement: { ...current.announcement, ...(content.announcement || {}) },
    brand: { ...current.brand, ...(content.brand || {}) },
    hero: { ...current.hero, ...(content.hero || {}) },
    categoriesSection: { ...current.categoriesSection, ...(content.categoriesSection || {}) },
    collectionSection: { ...current.collectionSection, ...(content.collectionSection || {}) },
    festivePromo: { ...current.festivePromo, ...(content.festivePromo || {}) },
    storySection: { ...current.storySection, ...(content.storySection || {}) },
    socialSection: { ...current.socialSection, ...(content.socialSection || {}) },
  };

  const dir = path.dirname(CONTENT_FILE_PATH);
  if (!fs.existsSync(dir)) {
    await fs.promises.mkdir(dir, { recursive: true });
  }

  await fs.promises.writeFile(CONTENT_FILE_PATH, JSON.stringify(merged, null, 2), 'utf-8');
  return merged;
}
