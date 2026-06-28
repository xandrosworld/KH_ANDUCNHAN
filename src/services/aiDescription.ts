/**
 * AI Description service.
 *
 * Production rule:
 * - Use the backend /api/ai/description proxy when available.
 * - Keep provider keys in backend/config/config.php only.
 * - Fall back to a local template when backend AI is not configured.
 */

import type { AIDescriptionInput } from '../types/types';
import { isApiConfigured } from './apiClient';
import { generateAiDescription } from './propertyApi';

export async function generateDescription(input: AIDescriptionInput): Promise<string> {
  if (isApiConfigured()) {
    try {
      const result = await generateAiDescription(input as unknown as Record<string, unknown>);
      if (result.ok && result.data?.description) {
        return result.data.description;
      }
    } catch {
      // Backend AI is optional; local template keeps the form usable.
    }
  }

  return generateTemplate(input);
}

function generateTemplate(input: AIDescriptionInput): string {
  const {
    propertyType,
    listingType,
    price,
    bedrooms,
    bathrooms,
    sqft,
    address,
    city,
    state,
    isVip,
    amenities,
  } = input;

  const action = listingType === 'rent' ? 'for rent' : 'for sale';
  const priceStr = Number(price)
    ? `$${Number(price).toLocaleString()}${listingType === 'rent' ? '/mo' : ''}`
    : price;

  const lines: string[] = [];

  lines.push(`Beautiful ${propertyType.toLowerCase()} ${action} in ${city}, ${state}.`);

  if (bedrooms || bathrooms || sqft) {
    const specs: string[] = [];
    if (bedrooms) specs.push(`${bedrooms} bedroom${Number(bedrooms) > 1 ? 's' : ''}`);
    if (bathrooms) specs.push(`${bathrooms} bathroom${Number(bathrooms) > 1 ? 's' : ''}`);
    if (sqft) specs.push(`${Number(sqft).toLocaleString()} sq ft of living space`);
    lines.push(`This home features ${specs.join(', ')}.`);
  }

  lines.push(`Listed at ${priceStr}, located at ${address}.`);

  if (amenities && amenities.length > 0) {
    lines.push(`Key amenities include: ${amenities.join(', ')}.`);
  }

  if (isVip) {
    lines.push('This is a VIP listing with premium visibility on So Do Van Phuc.');
  }

  lines.push('Contact us today for a private showing or more details about this exceptional property.');

  return lines.join(' ');
}
