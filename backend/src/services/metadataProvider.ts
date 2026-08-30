import { NormalizedMetadata } from '../types/metadata';

export interface MetadataProvider {
  analyze(url: URL): Promise<NormalizedMetadata>;
}