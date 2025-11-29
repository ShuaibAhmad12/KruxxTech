import { createClient } from '@sanity/client';
import imageUrlBuilder from '@sanity/image-url';

export const sanityClient = createClient({
  projectId: '9qvfwi5w', 
  dataset: 'production',
  useCdn: true,
  apiVersion: '2023-05-03', 
});

const builder = imageUrlBuilder(sanityClient);

export function urlFor(source: any) {
  return builder.image(source);
}