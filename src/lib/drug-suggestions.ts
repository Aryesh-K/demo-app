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
