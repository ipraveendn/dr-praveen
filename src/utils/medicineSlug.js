/**
 * Generate SEO-friendly slug from medicine name
 * Examples:
 * "ROSARA 5" → "rosara-5"
 * "ROSUPLUS 10/160" → "rosuplus-10-160"
 * "D FLOZIN 10" → "d-flozin-10"
 */
export function generateMedicineSlug(name) {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')        // Replace spaces with hyphens
    .replace(/[\/]/g, '-')        // Replace slashes with hyphens
    .replace(/[^a-z0-9\-]/g, '') // Remove special characters
    .replace(/\-+/g, '-')         // Replace multiple hyphens with single hyphen
    .replace(/^\-+|\-+$/g, '')    // Remove leading/trailing hyphens
}

/**
 * Find medicine by slug from the catalog
 */
export function getMedicineBySlug(slug, pharmacyCatalog) {
  for (const category of pharmacyCatalog) {
    const medicine = category.items.find(item => generateMedicineSlug(item.name) === slug)
    if (medicine) {
      return { medicine, category }
    }
  }
  return null
}

/**
 * Get all medicines as flat array for sitemap generation
 */
export function getAllMedicines(pharmacyCatalog) {
  const allMedicines = []
  for (const category of pharmacyCatalog) {
    allMedicines.push(...category.items.map(item => ({
      ...item,
      category: category.title,
      slug: generateMedicineSlug(item.name)
    })))
  }
  return allMedicines
}
