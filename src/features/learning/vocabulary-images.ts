import rawVocabularyImages from '@content/seed/vocabulary-images.json';

export type ImageStatus = 'none' | 'reference_only' | 'approved' | 'needs_review';
export type ImageQuality = 'good' | 'ambiguous' | 'wrong';

export type VisualContentType = 'vocabulary' | 'kanji';
export type VisualAssetKind = 'illustration' | 'stroke_order' | 'component' | 'mnemonic';

export interface LearningVisualAsset {
  contentType: VisualContentType;
  assetKind: VisualAssetKind;
  id: number;
  word: string;
  meaning: string;
  imageUrl: string | null;
  imageSource: string;
  imageLicense: string;
  imageLicenseUrl: string;
  imageCredit: string;
  imageStatus: Exclude<ImageStatus, 'none'>;
  imageQuality: ImageQuality;
}

export type VocabularyImageAsset = LearningVisualAsset & { contentType: 'vocabulary'; assetKind: 'illustration' };
const assets = (rawVocabularyImages as { assets: LearningVisualAsset[] }).assets;
export const LEARNING_VISUAL_ASSETS: readonly LearningVisualAsset[] = assets;
export const VOCABULARY_IMAGE_ASSETS: readonly VocabularyImageAsset[] = assets.filter((asset): asset is VocabularyImageAsset =>
  asset.contentType === 'vocabulary' && asset.assetKind === 'illustration');
const assetsById = new Map(VOCABULARY_IMAGE_ASSETS.map((asset) => [asset.id, asset]));

/** UI-safe asset lookup: unapproved assets are never returned in production. */
export function vocabularyImageAssetOf(id: number): VocabularyImageAsset | null {
  const asset = assetsById.get(id);
  if (!asset) return null;
  return isVisible(asset) ? asset : null;
}

/** Missing manifest entries have status `none`; pending/reference assets are never exposed in production. */
export function vocabularyImageStatusOf(id: number): ImageStatus {
  const asset = assetsById.get(id);
  return asset?.imageStatus ?? 'none';
}

/** Future Kanji visual assets can target stroke order, components, or mnemonics without adding cartoon per character. */
export function kanjiVisualAssetsOf(id: number): readonly LearningVisualAsset[] {
  return assets.filter((asset) => asset.contentType === 'kanji' && asset.id === id && asset.imageUrl && isVisible(asset));
}

function isVisible(asset: LearningVisualAsset): boolean {
  return asset.imageStatus === 'approved' || (asset.imageStatus === 'reference_only' && process.env.NODE_ENV !== 'production');
}

/** Local image path for the learning UI, or null when the asset is absent/unapproved. */
export function vocabularyImageOf(id: number): string | null {
  return vocabularyImageAssetOf(id)?.imageUrl ?? null;
}

/** Source repository path used by the explicit icon fetch script. */
export function vocabularyImageSourcePath(asset: VocabularyImageAsset): string | null {
  const marker = '/assets/';
  const index = asset.imageSource.indexOf(marker);
  return index < 0 ? null : asset.imageSource.slice(index + marker.length).split('/').map(decodeURIComponent).join('/');
}

export function vocabularyImageFile(sourcePath: string): string {
  return sourcePath.split('/').at(-1)!.replace(/_3d(_default)?\.png$/, '.png');
}
