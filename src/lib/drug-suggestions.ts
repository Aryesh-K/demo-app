export const FREE_DRUGS = [
  // Common OTCs
  "Acetaminophen", "Tylenol", "Ibuprofen", "Advil", "Motrin",
  "Aspirin", "Bayer", "Naproxen", "Aleve", "Diphenhydramine",
  "Benadryl", "Loratadine", "Claritin", "Cetirizine", "Zyrtec",
  "Fexofenadine", "Allegra", "Pseudoephedrine", "Sudafed",
  "Dextromethorphan", "NyQuil", "DayQuil", "Robitussin",
  "Guaifenesin", "Mucinex", "Omeprazole", "Prilosec",
  "Famotidine", "Pepcid", "Ranitidine", "Tums", "Calcium carbonate",
  "Loperamide", "Imodium", "Bismuth subsalicylate", "Pepto-Bismol",
  "Hydrocortisone cream", "Benzoyl peroxide", "Salicylic acid",
  "Neosporin", "Bacitracin", "Miconazole", "Clotrimazole",
  "Alcohol", "Caffeine", "Melatonin (OTC)", "Vitamin C", "Vitamin D",
  "Zinc", "Magnesium", "Iron supplement",
];

export const PREMIUM_EXTRA_DRUGS = [
  // Prescription drugs
  "Warfarin", "Coumadin", "Fluoxetine", "Prozac", "Sertraline",
  "Zoloft", "Escitalopram", "Lexapro", "Bupropion", "Wellbutrin",
  "Venlafaxine", "Effexor", "Duloxetine", "Cymbalta", "Tramadol",
  "Gabapentin", "Neurontin", "Pregabalin", "Lyrica", "Alprazolam",
  "Xanax", "Clonazepam", "Klonopin", "Lorazepam", "Ativan",
  "Zolpidem", "Ambien", "Metformin", "Glucophage", "Lisinopril",
  "Atorvastatin", "Lipitor", "Levothyroxine", "Synthroid",
  "Metoprolol", "Amlodipine", "Losartan", "Methotrexate",
  "Prednisone", "Amoxicillin", "Azithromycin", "Doxycycline",
  "Ciprofloxacin", "Clopidogrel", "Plavix", "Rivaroxaban",
  "Xarelto", "Apixaban", "Eliquis", "Quetiapine", "Seroquel",
  "Aripiprazole", "Abilify", "Risperidone", "Risperdal",
  "Lithium", "Lamotrigine", "Lamictal", "Topiramate", "Topamax",
  "Carbamazepine", "Tegretol", "Valproate", "Depakote",
  "Sildenafil", "Viagra", "Tadalafil", "Cialis", "Finasteride",
  "Propecia", "Spironolactone", "Aldactone", "Furosemide",
  "Lasix", "Hydrochlorothiazide", "Montelukast", "Singulair",
  "Albuterol", "Proventil", "Fluticasone", "Flonase",
  "Trazodone", "Oxycodone", "Percocet", "Hydrocodone", "Vicodin",
  "Morphine", "Naloxone", "Narcan",
  // Supplements
  "Fish oil", "Omega-3", "St. John's Wort", "Echinacea",
  "Ginseng", "Turmeric", "Ginger", "Garlic supplement",
  "Valerian root", "Ashwagandha", "Probiotics", "Collagen",
  "Biotin", "B12", "Folic acid", "CoQ10", "Glucosamine",
  // Cosmetics (premium learn only)
  "Retinol", "Tretinoin", "Niacinamide", "Hyaluronic acid",
  "Vitamin C serum", "AHA", "BHA", "Glycolic acid",
  "Lactic acid", "Azelaic acid", "Kojic acid",
];

export const PREMIUM_LEARN_EXTRA = [
  // Chemicals for premium learn only
  "Cyanide", "Carbon monoxide", "Ammonia", "Sulfur dioxide",
  "Lead", "Mercury", "Arsenic", "Cadmium", "Ethanol",
  "Methanol", "Acetone", "Benzene", "Formaldehyde",
  "Chlorine", "Hydrogen peroxide", "Sodium hydroxide",
  "Bleach", "Acetaldehyde", "Nicotine", "Caffeine anhydrous",
];

export function isLikelyValidDrug(name: string): boolean {
  if (!name || name.trim().length < 2) return false;

  const cleaned = name.trim().toLowerCase();

  // Check against known drug lists first — if it matches, always valid
  const allDrugs = [
    ...FREE_DRUGS,
    ...PREMIUM_EXTRA_DRUGS,
    ...PREMIUM_LEARN_EXTRA,
  ].map((d) => d.toLowerCase());

  if (
    allDrugs.some(
      (d) =>
        d.includes(cleaned) ||
        cleaned.includes(d) ||
        d.startsWith(cleaned.substring(0, 5)),
    )
  ) {
    return true;
  }

  // If not in any known list, apply strict pattern checks
  const letters = (cleaned.match(/[a-z]/gi) ?? []).length;
  const vowels = (cleaned.match(/[aeiou]/gi) ?? []).length;
  const vowelRatio = vowels / letters;

  // Strict vowel ratio — real words typically have 30-50% vowels
  if (vowelRatio < 0.25) return false;

  // No run of 3+ consonants in a row
  if (/[^aeiou\s\-]{3,}/i.test(cleaned)) return false;

  // Must be at least 3 characters
  if (cleaned.length < 3) return false;

  // Must not look like keyboard mashing — check for repeated character patterns
  if (/(.)\1{2,}/.test(cleaned)) return false;

  // Reasonable max length for a drug name
  if (cleaned.length > 30) return false;

  return true;
}

export function getDrugSuggestions(
  query: string,
  mode: "free" | "premium" | "premium-learn",
  recentSearches: string[] = [],
): string[] {
  if (!query || query.length < 1) {
    return recentSearches.slice(0, 5);
  }

  let list = [...FREE_DRUGS];
  if (mode === "premium") list = [...list, ...PREMIUM_EXTRA_DRUGS];
  if (mode === "premium-learn") {
    list = [...list, ...PREMIUM_EXTRA_DRUGS, ...PREMIUM_LEARN_EXTRA];
  }

  const q = query.toLowerCase();
  return list
    .filter((drug) => drug.toLowerCase().includes(q))
    .slice(0, 8);
}
