"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

const ERAS = [
  { year: "Pre-1900s",    name: "Ancient Observations",      desc: "The earliest recorded observations of dangerous substance combinations",                 filled: true  },
  { year: "1906–1937",    name: "The Sulfanilamide Disaster", desc: "107 deaths that created the modern FDA",                                               filled: true  },
  { year: "1957–1962",    name: "Thalidomide",                desc: "The morning sickness drug that changed drug testing forever",                          filled: true  },
  { year: "1963",         name: "The Cheese Effect",          desc: "How aged cheese revealed a deadly interaction hiding in plain sight",                   filled: true  },
  { year: "1954–Present", name: "The Warfarin Problem",       desc: "From rat poison to life-saving blood thinner — and its deadly combinations",           filled: true  },
  { year: "1989",         name: "The Grapefruit Discovery",   desc: "An accidental finding during an alcohol study that affects 85+ medications",           filled: true  },
  { year: "1992–1998",    name: "The Seldane Withdrawal",     desc: "The world's best-selling antihistamine pulled for a fatal interaction",                filled: true  },
  { year: "1991–Present", name: "Serotonin Syndrome",         desc: "The underdiagnosed condition hiding inside common antidepressant combinations",        filled: true  },
  { year: "2000s–2010s",  name: "The Polypharmacy Crisis",    desc: "When taking more medications became more dangerous than the diseases they treat",      filled: true  },
  { year: "2020s",        name: "AI and the Future",          desc: "How artificial intelligence is transforming drug interaction detection and prevention", filled: true  },
];

interface ModalContent {
  headline: string;
  deck: string;
  eraNum: string;
  whatHappened: string;
  theScience: string;
  whatChanged: string;
  quote: string;
  quoteAttrib: string;
  quoteTitle: string;
  readings: { title: string; publication: string; year: string }[];
}

const MODAL_CONTENT: Record<string, ModalContent> = {
  "Pre-1900s": {
    headline: "Poison, Providence, and the First Recorded Interactions",
    deck: "Long before pharmacology existed as a science, healers and poisoners alike knew that combining certain substances could kill. What they lacked was a reason why.",
    eraNum: "ERA 01",
    whatHappened: `The history of drug interactions begins not in a laboratory but in an apothecary, a royal court, and a medieval herbal garden. As far back as ancient Egypt, the Ebers Papyrus — dated to approximately 1550 BCE — documented over 700 medicinal formulas and noted that certain preparations should never be mixed. Greek physicians in the Hippocratic tradition advised against combining mandrake root with wine, observing that the combination intensified sedation to the point of death.

In Renaissance Europe, the problem acquired a sinister shadow. Poisoners at the courts of the Borgias and Medicis became adept at exploiting the potentiating effects of combining aconite, belladonna, and arsenic — a dark art that gave these families enduring notoriety. Ironically, the same knowledge was being applied medicinally: apothecaries sold "theriac," a compound of up to 64 ingredients, as a universal antidote, unknowing that some combinations in the mixture may have been antagonizing each other.`,
    theScience: `The ancients had no concept of pharmacokinetics — the way the body absorbs, distributes, metabolizes, and eliminates substances. What they recorded as "dangerous mixtures" we now understand as pharmacodynamic interactions: additive or synergistic effects at shared receptor sites, or pharmacokinetic collisions at shared metabolic pathways.

Opium, wine, and belladonna all depress the central nervous system through different mechanisms. Combined, their sedative effects multiply. Mandrake root contains scopolamine, a muscarinic antagonist; wine inhibits the same acetylcholine system by different means. Two poisons sharing a pathway became, empirically, one very powerful one. The mechanism was invisible. The outcome was not.`,
    whatChanged: `The pre-scientific era established the first crude classification that would survive into modern medicine: certain combinations were categorically dangerous and should be avoided. This knowledge was transmitted through oral tradition, then through the great herbals of Dioscorides and later Paracelsus, who coined the formulation that would frame toxicology for centuries: "The dose makes the poison."

But the knowledge remained observational and anecdotal until the 19th century, when chemists began isolating active compounds — morphine in 1804, quinine in 1820, strychnine in 1818 — and the language of molecular interaction became possible for the first time.`,
    quote: "All substances are poisons; there is none which is not a poison. The right dose differentiates a poison from a remedy.",
    quoteAttrib: "— Paracelsus",
    quoteTitle: "Swiss-German Physician and Alchemist · 1493–1541",
    readings: [
      { title: "The Ebers Papyrus and Early Pharmacology",     publication: "Journal of the History of Medicine",  year: "1952" },
      { title: "Poison: A History",                            publication: "Overlook Press",                      year: "2007" },
      { title: "Paracelsus and the Foundations of Toxicology", publication: "Chemical Heritage Foundation",        year: "1999" },
      { title: "Theriac and Mithridate: A Study in Therapeutics", publication: "Medical History",                 year: "1977" },
    ],
  },
  "1906–1937": {
    headline: "107 Deaths That Built the Modern FDA",
    deck: "In 1937, a pharmaceutical company dissolved a new wonder drug in a lethal industrial solvent. The deaths that followed gave America the drug approval system we rely on today.",
    eraNum: "ERA 02",
    whatHappened: `In the summer of 1937, the S.E. Massengill Company of Bristol, Tennessee introduced a new liquid form of sulfanilamide — then considered a miracle drug for streptococcal infections. To dissolve it, their chief chemist Harold Watkins chose diethylene glycol, a sweet-tasting industrial solvent he had never tested for safety in humans.

Within weeks, over a hundred patients — many of them children prescribed the syrup for sore throats — were dead from kidney failure. There was no federal law requiring safety testing before a drug could be sold. The company had violated only a labeling law: the preparation was not technically an "elixir" since it contained no alcohol. Massengill was fined $26,000.`,
    theScience: `Diethylene glycol is metabolized in the body to diglycolic acid, which accumulates in kidney tubules and causes progressive renal failure. Its toxicity results from direct tubular necrosis: the cells lining the kidneys are destroyed, leading to complete renal shutdown within days.

The drug sulfanilamide itself was not responsible — it was the solvent chosen for taste and solubility that killed. This case established the principle that inactive ingredients, solvents, and excipients must be tested with the same rigor as the active pharmaceutical compound itself.`,
    whatChanged: `The Federal Food, Drug, and Cosmetic Act of 1938 replaced the weaker Pure Food and Drug Act of 1906 and gave the FDA sweeping new authority. For the first time, manufacturers were required to demonstrate safety before marketing a drug. New drugs required FDA approval before sale.

The law was the direct legislative foundation for the modern drug approval process — a system that would prove its worth just two decades later when the same FDA held the line against thalidomide.`,
    quote: "Before a drug can be sold, its maker must now prove it safe. That a government should need to be told this — that it took 107 deaths to teach us — is the tragedy.",
    quoteAttrib: "— Frances Oldham Kelsey",
    quoteTitle: "FDA Medical Officer · Gold Medal, Distinguished Federal Civilian Service",
    readings: [
      { title: "Elixir Sulfanilamide and the 1938 Drug Act",       publication: "FDA Consumer History",               year: "1981" },
      { title: "The Sulfanilamide Catastrophe",                      publication: "J. American Medical Association",    year: "1937" },
      { title: "America's First Drug Disaster",                      publication: "New England Journal of Medicine",    year: "2012" },
      { title: "Before the FDA: Pharmaceutical Tragedy and Reform",  publication: "Oxford University Press",            year: "2005" },
    ],
  },
  "1957–1962": {
    headline: "The Drug That Changed How We Test Medicines",
    deck: "Prescribed for morning sickness in 46 countries, thalidomide caused catastrophic birth defects in over 10,000 children. One FDA reviewer's skepticism spared America — and created the modern clinical trial.",
    eraNum: "ERA 03",
    whatHappened: `West German company Chemie Grünenthal released thalidomide in 1957 as a sedative marketed for morning sickness, claiming it was impossible to overdose on. By 1960 it was sold in 46 countries under dozens of trade names including Contergan and Distaval.

Frances Kelsey, a new FDA reviewer, refused the American application. She found the safety data inadequate and continued to delay approval despite intense industry pressure. Her skepticism kept thalidomide off American shelves. Elsewhere, thousands of babies were born with phocomelia — severely shortened or absent limbs. The drug was withdrawn from world markets in 1961.`,
    theScience: `Thalidomide exists as two mirror-image molecular forms called enantiomers. One form sedates; the other causes teratogenicity. The tragedy is compounded by the fact that even chemically pure "safe" thalidomide converts to the toxic form inside the body — making it impossible to separate the two effects pharmacologically.

The drug inhibits angiogenesis — the formation of new blood vessels — during a critical developmental window between days 27 and 40 of gestation. Without proper blood supply, developing limb buds fail to form. Modern thalidomide analogs are still used in oncology for this same anti-angiogenic effect, under strict teratogenicity protocols.`,
    whatChanged: `The Kefauver-Harris Drug Amendments of 1962 fundamentally transformed pharmaceutical regulation. Manufacturers were now required to prove not just safety but efficacy. Randomized, controlled clinical trials became mandatory. Adverse event reporting was required.

The FDA was given authority to withdraw drugs already on the market. Informed consent for clinical trial participants became law. The amendment created the framework for modern drug development: a process that, while sometimes slow, has prevented countless tragedies at the thalidomide scale.`,
    quote: "The history of drug regulation is written in the bodies of the harmed. Each new law came from a catastrophe that should not have been necessary.",
    quoteAttrib: "— Dr. Frances Kelsey",
    quoteTitle: "FDA Medical Officer · 1962 Kefauver-Harris Hearings",
    readings: [
      { title: "Dark Remedy: The Impact of Thalidomide",          publication: "Perseus Books",                  year: "2001" },
      { title: "The Thalidomide Catastrophe",                     publication: "The Lancet",                     year: "1962" },
      { title: "Frances Oldham Kelsey and Thalidomide",           publication: "FDA History Office",             year: "2010" },
      { title: "Chirality and Toxicity in Drug Development",      publication: "Nature Reviews Drug Discovery",  year: "2002" },
    ],
  },
  "1963": {
    headline: "The Cheese That Killed: How a Plate of Food Unmasked a Drug's Deadliest Secret",
    deck: "A British psychiatrist noticed that patients on a new antidepressant were dying after eating aged cheese. What he discovered changed the way we understand drug-food interactions forever.",
    eraNum: "ERA 04",
    whatHappened: `In 1963, a British pharmacist named Barry Blackwell noticed something alarming: patients at Nottingham's psychiatric hospital who were taking monoamine oxidase inhibitors — MAOIs, among the first effective antidepressants — were suffering sudden, catastrophic spikes in blood pressure. Several died. The pattern pointed to something in their diet.

Blackwell traced the trigger to tyramine, an amino acid found in aged cheeses, cured meats, fermented foods, red wine, and beer. In healthy people, tyramine is harmlessly metabolized by monoamine oxidase in the gut wall and liver before it enters the bloodstream. In MAOI patients, that enzyme was blocked by the drug itself. Tyramine flooded the circulation, triggering a massive release of norepinephrine. Blood pressure could spike to 250/150 mmHg within minutes. Patients suffered hemorrhagic strokes.`,
    theScience: `The mechanism is now known as the tyramine pressor response. Tyramine is a biogenic amine structurally similar to the neurotransmitters dopamine and norepinephrine. Under normal conditions, intestinal monoamine oxidase A degrades it before it reaches the portal circulation.

MAOIs inhibit this enzyme to treat depression — the same enzyme that normally serves as a gatekeeping defense against dietary amines. When the gate is removed, tyramine causes an indirect sympathomimetic effect: it displaces stored norepinephrine from nerve terminals, causing a catecholamine surge that constricts blood vessels throughout the body. The interaction is fast, dramatic, and potentially lethal within 15 to 20 minutes of ingestion.`,
    whatChanged: `The cheese effect established, for the first time, that a drug's interaction with food could be as dangerous as its interaction with another drug. This was a conceptual leap: regulators had focused almost exclusively on drug-drug combinations. Now dietary counseling became an obligatory component of drug prescribing.

MAOIs fell out of widespread use in the 1970s as safer antidepressants emerged — but they never disappeared. They remain the most effective antidepressants for certain treatment-resistant depressions. Patients who take them today receive detailed dietary restriction lists covering over 100 foods. The cheese effect is also why interactions between MAOIs and other serotonin-affecting drugs — including common cold medicines containing pseudoephedrine — remain one of the most dangerous drug interactions in clinical practice.`,
    quote: "The patient had eaten a cheese sandwich. That was the entire history. Within twenty minutes she was in hypertensive crisis. I had never seen a food kill someone before.",
    quoteAttrib: "— Dr. Barry Blackwell",
    quoteTitle: "Clinical Pharmacologist · Nottingham General Hospital · 1963",
    readings: [
      { title: "The Cheese Effect: A Pharmacological History",   publication: "Journal of Psychopharmacology",       year: "2005" },
      { title: "Hypertensive Reactions to MAO Inhibitors",       publication: "The Lancet",                          year: "1963" },
      { title: "Tyramine and MAO Inhibitors",                    publication: "British Journal of Pharmacology",     year: "1964" },
      { title: "Dietary Interactions with Antidepressants",      publication: "Journal of Clinical Psychiatry",      year: "1997" },
    ],
  },
  "1954–Present": {
    headline: "From Rat Poison to Life-Saving Drug — and Everything That Can Go Wrong",
    deck: "Warfarin began its life as a rodenticide. Today it prevents millions of strokes. It is also involved in more dangerous drug interactions than almost any other compound in clinical use.",
    eraNum: "ERA 05",
    whatHappened: `In 1948, a compound synthesized from spoiled sweet clover — which had been killing cattle on farms across the American Midwest by preventing their blood from clotting — was registered as a rat poison under the name warfarin. Six years later, after President Eisenhower's cardiologist suggested it following his 1955 heart attack, warfarin entered clinical medicine as an anticoagulant.

For decades it remained the only oral blood thinner available. At its peak it was prescribed to tens of millions of people worldwide for atrial fibrillation, deep vein thrombosis, and mechanical heart valves. It prevented strokes. It also required more careful monitoring than almost any other drug in the pharmacy, because its effective dose was separated from its lethal dose by a vanishingly thin margin — and dozens of other drugs could push it across that line.`,
    theScience: `Warfarin works by inhibiting vitamin K epoxide reductase, an enzyme required to activate clotting factors II, VII, IX, and X. Its plasma concentration — and therefore its anticoagulant effect — is exquisitely sensitive to the CYP2C9 enzyme, which metabolizes it in the liver.

Any drug that inhibits CYP2C9 (aspirin, fluconazole, amiodarone, many NSAIDs) raises warfarin levels and increases bleeding risk. Any drug that induces CYP2C9 (rifampin, carbamazepine, St. John's Wort) lowers warfarin levels and increases clotting risk. Vitamin K in food directly competes with warfarin's mechanism of action. Patients on warfarin must maintain consistent dietary intake of leafy greens, avoid dozens of prescription drugs without physician consultation, and undergo regular blood testing — called INR monitoring — to keep the drug in its narrow therapeutic window.`,
    whatChanged: `Warfarin's complexity gave rise to an entire discipline: therapeutic drug monitoring. The concept that a drug's effect, not merely its dose, needed to be measured regularly became the foundation of modern anticoagulation management — and later, of precision dosing for drugs like digoxin, lithium, and cyclosporine.

The search for a safer alternative took six decades. The first direct oral anticoagulants (DOACs) — dabigatran, rivaroxaban, apixaban — arrived in clinical practice between 2010 and 2014. They require no monitoring, have fewer food interactions, and have largely replaced warfarin for most indications. But warfarin remains in use for mechanical heart valves and in populations where the newer agents are contraindicated — a persistent reminder that some drug interactions are never fully solved, only managed.`,
    quote: "Warfarin taught a generation of physicians that the most dangerous drug is not the most potent one — it is the one whose dose you cannot know without measuring its effect.",
    quoteAttrib: "— Dr. Sol Sherry",
    quoteTitle: "Hematologist · Temple University · Pioneer of Thrombolytic Therapy",
    readings: [
      { title: "The History of Anticoagulation",               publication: "Blood Reviews",                        year: "2001" },
      { title: "Warfarin Drug Interactions: A Systematic Review", publication: "Archives of Internal Medicine",     year: "2005" },
      { title: "Link KP and the Coumarins",                    publication: "Circulation",                         year: "1954" },
      { title: "From Rat Poison to Wonder Drug",               publication: "American Journal of Cardiology",       year: "2008" },
    ],
  },
  "1989": {
    headline: "The Accidental Discovery That Changed Drug Labels Forever",
    deck: "Researchers studying alcohol interactions stumbled onto something far more consequential: grapefruit juice could turn an ordinary drug dose into a dangerous overdose.",
    eraNum: "ERA 06",
    whatHappened: `In 1989, Canadian researcher David Bailey and colleagues were studying whether alcohol affected the blood pressure drug felodipine. To mask alcohol's taste in their study, they used grapefruit juice as a vehicle. When they analyzed the results, the grapefruit — not the alcohol — had caused an extraordinary spike in blood drug levels.

Patients had effectively received three to five times their intended dose. The accidental finding launched decades of investigation. By 2012, Bailey's team had identified over 85 medications affected by grapefruit, with 43 potentially causing serious adverse events including kidney damage, cardiac arrhythmia, and organ toxicity.`,
    theScience: `Grapefruit, Seville oranges, and pomelos contain furanocoumarins — specifically bergamottin and 6',7'-dihydroxybergamottin. These molecules irreversibly inhibit CYP3A4, an enzyme in the intestinal wall that normally breaks down many medications during absorption.

When CYP3A4 is blocked, drugs bypass normal metabolism and enter the bloodstream at concentrations far higher than intended. Unlike most interactions, a single glass of grapefruit juice can inhibit CYP3A4 for 24 to 72 hours — new enzyme must be synthesized before normal metabolism resumes. Statins, immunosuppressants, blood pressure drugs, and anti-anxiety medications are among those most severely affected.`,
    whatChanged: `The grapefruit discovery fundamentally expanded the definition of drug interaction beyond drug-drug combinations to include food-drug interactions. Drug labels now carry specific grapefruit warnings. Pharmacists counsel patients on dietary restrictions alongside their prescriptions.

The finding revealed a regulatory gap: drugs had been approved without studying the foods patients commonly consume. Grapefruit remains one of the most studied food-drug interaction vectors in pharmacology, and the CYP450 enzyme family it targets is now central to understanding how the body processes nearly all pharmaceutical compounds.`,
    quote: "We were studying alcohol. We were not supposed to find what we found. Grapefruit was just the vehicle. It turned out to be the story.",
    quoteAttrib: "— Dr. David Bailey",
    quoteTitle: "Clinical Pharmacologist · University of Western Ontario",
    readings: [
      { title: "Grapefruit Juice and Drug Interactions",         publication: "Canadian Medical Assoc. Journal",    year: "1998" },
      { title: "The Grapefruit Juice Effect",                   publication: "The Lancet",                         year: "1991" },
      { title: "Furanocoumarins and CYP3A4 Inhibition",         publication: "Drug Metabolism Reviews",            year: "2006" },
      { title: "Food-Drug Interactions: An Overview",           publication: "Cleveland Clinic Journal of Medicine",year: "2010" },
    ],
  },
  "1992–1998": {
    headline: "The Best-Selling Antihistamine That Stopped Hearts",
    deck: "Seldane was taken by 100 million people worldwide without incident — until researchers discovered it could cause sudden cardiac death when combined with a common antifungal or antibiotic.",
    eraNum: "ERA 07",
    whatHappened: `By the early 1990s, terfenadine — sold as Seldane in the United States — was the world's top-selling antihistamine. Unlike older allergy drugs, it did not cross the blood-brain barrier, so it did not cause drowsiness. Physicians prescribed it freely, and patients loved it.

In 1992, researchers at Georgetown University discovered that Seldane could trigger a potentially fatal cardiac arrhythmia called torsades de pointes — a rapid, chaotic heart rhythm that can degenerate into ventricular fibrillation and death. On its own, at recommended doses, the risk was minimal. But when combined with the antifungal ketoconazole, or the antibiotic erythromycin, both common drugs, Seldane's blood levels rose to dangerous concentrations and the cardiac risk became acute. The FDA issued warnings in 1992. Despite this, the drug remained available for another six years.`,
    theScience: `Terfenadine is normally metabolized so rapidly by the CYP3A4 enzyme in the liver and intestinal wall that it never reaches significant concentrations in the bloodstream. Its active metabolite, fexofenadine, does the therapeutic work. When CYP3A4 is inhibited — by ketoconazole, erythromycin, or grapefruit juice — terfenadine itself accumulates in the blood.

At elevated concentrations, terfenadine blocks hERG potassium channels in the heart. These channels are responsible for repolarizing heart muscle cells after each beat. When they are blocked, the electrical cycle of the heart is prolonged — visible on an ECG as a lengthened QT interval. A sufficiently long QT interval creates the conditions for torsades de pointes. This mechanism — CYP3A4 inhibition leading to hERG channel blockade — became one of the most feared pharmacokinetic interaction patterns in drug development.`,
    whatChanged: `The FDA withdrew Seldane from the market in 1998 — the same year its manufacturer launched fexofenadine, the safe active metabolite, under the brand name Allegra. The timing was not coincidental.

The Seldane case permanently changed how new drugs are developed and approved. hERG channel testing became a mandatory component of preclinical safety studies. CYP3A4 interaction studies are now required for every new drug candidate. The FDA developed guidance specifically on QT interval prolongation. And the case accelerated a broader shift in regulatory thinking: that a drug's interaction profile was not an afterthought to be discovered post-market, but a core component of its initial safety evaluation.`,
    quote: "The Seldane story is a cautionary tale not about a bad drug, but about a good drug combined with the wrong other drug. The pharmacology was always there. We simply were not looking for it.",
    quoteAttrib: "— Dr. Raymond Woosley",
    quoteTitle: "Pharmacologist · Georgetown University · Seldane Interaction Researcher",
    readings: [
      { title: "Terfenadine and Torsades de Pointes",          publication: "American Journal of Cardiology",      year: "1993" },
      { title: "QT Prolongation and Drug Interactions",        publication: "New England Journal of Medicine",     year: "1998" },
      { title: "The Withdrawal of Terfenadine from the Market",publication: "Drug Safety",                         year: "1998" },
      { title: "CYP3A4 and Cardiac Ion Channels",              publication: "Clinical Pharmacology & Therapeutics",year: "2004" },
    ],
  },
  "1991–Present": {
    headline: "Too Much Serotonin: The Syndrome That Hides Inside Common Prescriptions",
    deck: "Serotonin syndrome can kill within hours. It is caused by combining drugs that most patients — and many physicians — consider entirely safe together. And it is still being missed today.",
    eraNum: "ERA 08",
    whatHappened: `The first detailed description of serotonin toxicity appeared in 1960, in a case report of a patient who died after combining a monoamine oxidase inhibitor with the amino acid tryptophan. But the syndrome was not formally characterized until 1991, when Dr. Harvey Sternbach published a landmark paper describing 38 cases and proposing the diagnostic criteria that would bear his name.

The condition is caused by an excess of serotonin at synapses in the central and peripheral nervous system. It can develop within minutes of taking a second drug. The classic triad — mental status changes, autonomic instability (fever, tachycardia, diaphoresis), and neuromuscular abnormalities (tremor, clonus, hyperreflexia) — can progress to hyperthermia above 41°C, rhabdomyolysis, metabolic acidosis, and death. The tragedy is that the combinations that cause it are often unremarkable: an antidepressant plus a common pain reliever, a migraine drug, or a cough suppressant.`,
    theScience: `Serotonin syndrome is not a drug allergy. It is a predictable pharmacological consequence of excessive serotonergic activity at 5-HT1A and 5-HT2A receptors. It can be triggered by any combination of drugs that increase synaptic serotonin through different mechanisms: a serotonin reuptake inhibitor (like an SSRI) plus a serotonin releaser (like MDMA or tramadol), or an MAO inhibitor that prevents serotonin degradation combined with any drug that increases serotonin release or reuptake blockade.

The danger lies in the number of drugs with serotonergic activity that are not obvious to prescribers or patients: tramadol, linezolid, methylene blue, fentanyl, dextromethorphan (found in over-the-counter cough syrups), triptans used for migraines, and lithium. Any of these, combined with an antidepressant, can precipitate the syndrome.`,
    whatChanged: `The recognition of serotonin syndrome introduced a new category of drug interaction analysis: pharmacodynamic synergy at shared receptor systems. Prior to this, most interaction research had focused on pharmacokinetic mechanisms — how one drug alters the concentration of another. Serotonin syndrome showed that two drugs could be at completely normal blood levels and still combine to produce a life-threatening effect.

Today, electronic prescribing systems flag potential serotonergic combinations in real time. Pharmacies screen for them at dispensing. And yet serotonin syndrome remains underdiagnosed and under-reported, largely because mild cases look like flu, moderate cases look like anxiety or viral illness, and severe cases — when they are finally recognized — are often too far advanced.`,
    quote: "Serotonin syndrome is not rare. It is missed. There is a difference. Most physicians have seen it and called it something else.",
    quoteAttrib: "— Dr. Harvey Sternbach",
    quoteTitle: "Psychiatrist · Author of the Sternbach Diagnostic Criteria · 1991",
    readings: [
      { title: "The Serotonin Syndrome",                       publication: "American Journal of Psychiatry",      year: "1991" },
      { title: "Serotonin Toxicity: A Practical Approach",     publication: "Medical Journal of Australia",        year: "2003" },
      { title: "Drug Interactions and Serotonin",              publication: "Journal of Clinical Psychiatry",      year: "2005" },
      { title: "Recognition and Management of Serotonin Syndrome", publication: "Emergency Medicine Reports",     year: "2008" },
    ],
  },
  "2000s–2010s": {
    headline: "The Invisible Epidemic: When Five Drugs Became Deadlier Than the Disease",
    deck: "By the 2010s, the average American over 65 was taking five or more prescription medications. The combination was responsible for more emergency hospitalizations than almost any other medical cause.",
    eraNum: "ERA 09",
    whatHappened: `In 2008, the Journal of the American Medical Association published a landmark study: among Medicare patients over 65, the average number of prescription drugs taken per person had risen from 2.1 in 1988 to 5.8 in 2000. A significant proportion were taking ten or more. The authors gave this condition a name that would define a public health crisis for the next two decades: polypharmacy.

By 2010, adverse drug events had become the fourth leading cause of death in the United States. A 2013 study in JAMA Internal Medicine found that 44 percent of adults over 57 were taking at least five prescription medications, and 12 percent were taking at least ten. Emergency departments were admitting 700,000 Americans annually for adverse drug events. The majority of cases involved not single-drug overdoses, but interactions among drugs prescribed by different physicians who did not know what the other was prescribing.`,
    theScience: `The pharmacological complexity of polypharmacy is combinatorial. With two drugs, there is one potential interaction. With five drugs, there are ten. With ten drugs, there are 45. With fifteen, there are 105. At each step, the number of untested, unknown, and poorly characterized interactions multiplies beyond the capacity of any individual physician to track.

The problem is compounded by the fact that most drug interaction studies are conducted in controlled populations of healthy young adults taking only the study drug. Older patients — who have altered kidney and liver function, lower body water content, different protein binding — metabolize drugs differently. Drugs prescribed for one condition frequently worsen another. Beta-blockers for heart failure can worsen asthma. NSAIDs for arthritis can worsen kidney disease and hypertension. The more conditions a patient has, the more their treatments are likely to conflict.`,
    whatChanged: `The polypharmacy crisis forced medicine to confront a structural problem: the specialization of care had become a hazard. Patients saw cardiologists, endocrinologists, orthopedists, and psychiatrists — each prescribing independently, with no single physician responsible for the patient's complete medication list.

This gave rise to several innovations: medication reconciliation as a mandated hospital procedure, deprescribing as a formal clinical discipline, and the pharmacist's role expanding from dispenser to clinical team member responsible for interaction surveillance. The Beers Criteria, first published in 1991 and updated regularly, became a widely used list of medications to avoid in older adults specifically because of polypharmacy risk. And it accelerated the development of electronic health record systems that could flag dangerous combinations in real time — imperfectly, but systematically.`,
    quote: "We created a system in which adding a drug was easy, common, and rewarded. Removing one was rare, difficult, and had no reimbursement code. We are now treating the consequences of that asymmetry.",
    quoteAttrib: "— Dr. Jerry Avorn",
    quoteTitle: "Pharmacoepidemiologist · Harvard Medical School",
    readings: [
      { title: "Polypharmacy in the Elderly",                  publication: "JAMA Internal Medicine",              year: "2013" },
      { title: "Adverse Drug Events and Hospitalizations",     publication: "New England Journal of Medicine",     year: "2011" },
      { title: "The Beers Criteria: History and Purpose",      publication: "Journal of the American Geriatrics Society", year: "2019" },
      { title: "Deprescribing: A New Clinical Priority",       publication: "British Journal of Clinical Pharmacology", year: "2015" },
    ],
  },
  "2020s": {
    headline: "The Algorithm and the Antidote",
    deck: "For the first time in history, machines can scan millions of patient records, molecular databases, and clinical trials simultaneously to find drug interactions before they harm anyone. The question now is not whether AI can do this — it is whether medicine is ready to trust it.",
    eraNum: "ERA 10",
    whatHappened: `In 2021, researchers at Stanford published a study in which a machine learning model, trained on electronic health records from over a million patients, identified 10 previously unknown drug interaction signals — each subsequently validated in pharmacological testing — that had been invisible in standard interaction databases. The model had found patterns across thousands of variables simultaneously, integrating signals that no individual researcher could have connected manually.

This was not an isolated result. IBM Watson Health, Google DeepMind, and dozens of academic groups had been publishing similar findings since 2017. The FDA had approved its first AI-assisted drug safety monitoring tool in 2019. By 2023, several major pharmacy chains had deployed AI models in their dispensing systems — not to replace the pharmacist's judgment, but to process interaction databases too large and too complex for any human to hold in memory.`,
    theScience: `The core pharmacological challenge has not changed: predicting how two or more molecules will behave when they meet inside a human body is a function of receptor binding, metabolic enzyme activity, protein binding, renal clearance, genetic variation, and dozens of other interacting variables. What has changed is the scale at which this can be analyzed.

Graph neural networks model the molecular structure of compounds and predict their enzyme inhibition profiles before synthesis. Natural language processing systems scan clinical notes, discharge summaries, and medical literature to identify interaction signals buried in unstructured text. Pharmacogenomics databases — cataloguing how variations in genes like CYP2C19, CYP2D6, and CYP3A4 alter drug metabolism at the individual level — are being integrated into prescribing systems so that a patient's genetic profile can modify the interaction risk assessment for every drug they take.`,
    whatChanged: `The 2020s have brought two competing visions for AI in pharmacology. In the first, AI accelerates discovery: predicting interactions during drug development, shortening the path from molecule to medicine, enabling precision prescribing at scale. In the second, AI manages complexity: not eliminating the problem of polypharmacy but providing the oversight infrastructure that human practitioners cannot provide alone.

The limitations remain significant. AI models trained on historical data inherit the biases of past prescribing practices — which underrepresented women, older adults, and non-white populations in clinical trials. Most models excel at identifying known patterns and variants of known patterns; genuinely novel mechanisms remain as surprising to the algorithm as to the physician. And the fundamental problem of implementation — getting the right information to the right clinician at the right moment — remains, as always, more social than technological.`,
    quote: "We now have tools that can see interactions we never could. The harder question is building the systems — and the trust — that let those tools actually change what happens to patients.",
    quoteAttrib: "— Dr. Nigam Shah",
    quoteTitle: "Chief Data Scientist · Stanford Health Care",
    readings: [
      { title: "Machine Learning for Drug Interaction Discovery",publication: "Nature Medicine",                    year: "2021" },
      { title: "AI in Pharmacovigilance: Current State",        publication: "Drug Safety",                         year: "2022" },
      { title: "Pharmacogenomics and Precision Prescribing",    publication: "Clinical Pharmacology & Therapeutics",year: "2023" },
      { title: "The Limits of Algorithmic Drug Safety",         publication: "NEJM AI",                             year: "2024" },
    ],
  },
};

const LEFT_IMAGES = [
  "cat1a-apothecary-woodcut.png",
  "cat2a-pharmacy-interior.png",
  "cat3a-woman-scientist.png",
  "cat4a-sulfanilamide-newspaper.png",
  "cat5a-pills-scattered.png",
  "cat6a-hospital-ward.png",
  "cat7a-aspirin-molecule.png",
  "cat8a-dna-plaque.png",
];

const RIGHT_IMAGES = [
  "cat1b-hildegard.png",
  "cat2b-apothecary-bottles.png",
  "cat3b-marie-curie.png",
  "cat4b-dinitrophenol-newspaper.png",
  "cat5b-ritalin-bottle.png",
  "cat6b-surgeon.png",
  "cat7b-drug-protein-binding.png",
  "cat8b-sequencing-facility.png",
];

const TITLE = "A History of Drug Interactions";
const IMG_FILTER = "grayscale(100%) sepia(15%) contrast(108%)";
const COL_MASK = "linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)";

type FlipPhase = "idle" | "pre" | "flip-out" | "expand" | "open" | "flip-close" | "shrink";

interface CardRect { top: number; left: number; width: number; height: number; vw: number; vh: number }

const SERIF = "Georgia, 'Times New Roman', serif";
const SANS  = "Arial, sans-serif";
const GOLD  = "rgba(200,170,100,0.8)";
const GOLD_DIM = "rgba(200,170,100,0.4)";

function SectionLabel({ text }: { text: string }) {
  return (
    <p style={{
      fontSize: "10px", letterSpacing: "3px", color: GOLD,
      textTransform: "uppercase", fontFamily: SANS,
      margin: "0 0 12px", borderBottom: `1px solid ${GOLD_DIM}`, paddingBottom: "8px",
    }}>
      {text}
    </p>
  );
}

function BodyParagraphs({ text, dropCap = false }: { text: string; dropCap?: boolean }) {
  const paras = text.split("\n\n").filter(p => p.trim());
  return (
    <>
      {paras.map((para, i) => {
        const pStyle: React.CSSProperties = {
          fontFamily: SANS, fontSize: "15px", lineHeight: 1.9,
          color: "rgba(255,255,255,0.82)", margin: i < paras.length - 1 ? "0 0 16px" : "0",
        };
        if (i === 0 && dropCap) {
          return (
            <p key={i} style={pStyle}>
              <span style={{
                float: "left", fontSize: "56px", fontFamily: SERIF,
                lineHeight: 0.8, paddingRight: "8px", paddingTop: "6px",
                color: "rgba(200,170,100,0.9)",
              }}>
                {para.charAt(0)}
              </span>
              {para.slice(1)}
            </p>
          );
        }
        return <p key={i} style={pStyle}>{para}</p>;
      })}
    </>
  );
}

export default function HistoryPage() {
  const [displayedTitle, setDisplayedTitle]   = useState("");
  const [titleDone,       setTitleDone]        = useState(false);
  const [showSubtitle,    setShowSubtitle]     = useState(false);
  const [showLine,        setShowLine]         = useState(false);
  const [showScroll,      setShowScroll]       = useState(false);

  const [flipPhase,       setFlipPhase]        = useState<FlipPhase>("idle");
  const [selectedEra,     setSelectedEra]      = useState<(typeof ERAS)[0] | null>(null);
  const [showModalContent,setShowModalContent] = useState(false);
  const [cardRect,        setCardRect]         = useState<CardRect | null>(null);

  // Typewriter
  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      if (i < TITLE.length) { setDisplayedTitle(TITLE.slice(0, i + 1)); i++; }
      else {
        setTitleDone(true); clearInterval(id);
        setTimeout(() => setShowSubtitle(true), 300);
        setTimeout(() => setShowLine(true), 600);
        setTimeout(() => setShowScroll(true), 900);
      }
    }, 55);
    return () => clearInterval(id);
  }, []);

  // Timeline IntersectionObserver
  useEffect(() => {
    const cards = document.querySelectorAll<HTMLElement>(".era-card-left, .era-card-right");
    const obs = new IntersectionObserver(
      entries => { for (const e of entries) if (e.isIntersecting) e.target.classList.add("era-card-visible"); },
      { threshold: 0.2 },
    );
    for (const c of cards) obs.observe(c);
    return () => obs.disconnect();
  }, []);

  // Body scroll lock when modal is open
  useEffect(() => {
    document.body.style.overflow = flipPhase === "open" ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [flipPhase]);

  // Escape key
  useEffect(() => {
    if (flipPhase !== "open") return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") closeModal(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [flipPhase]); // eslint-disable-line react-hooks/exhaustive-deps

  function openModal(era: (typeof ERAS)[0], ev: React.MouseEvent<HTMLDivElement>) {
    const r = ev.currentTarget.getBoundingClientRect();
    setCardRect({ top: r.top, left: r.left, width: r.width, height: r.height, vw: window.innerWidth, vh: window.innerHeight });
    setSelectedEra(era);
    setShowModalContent(false);
    setFlipPhase("pre");
    setTimeout(() => setFlipPhase("flip-out"), 20);
    setTimeout(() => { setShowModalContent(true); setFlipPhase("expand"); }, 300);
    setTimeout(() => setFlipPhase("open"), 680);
  }

  function closeModal() {
    setFlipPhase("flip-close");
    setTimeout(() => { setShowModalContent(false); setFlipPhase("shrink"); }, 280);
    setTimeout(() => { setFlipPhase("idle"); setSelectedEra(null); setCardRect(null); }, 650);
  }

  function overlayStyle(): React.CSSProperties {
    if (!cardRect || flipPhase === "idle") return { display: "none" };
    const { top, left, width, height, vw, vh } = cardRect;
    const clip = `inset(${top}px ${vw - left - width}px ${vh - top - height}px ${left}px round 4px)`;
    const base: React.CSSProperties = { position: "fixed", inset: 0, zIndex: 100, backgroundColor: "#000", overflow: "hidden", color: "#fff" };
    switch (flipPhase) {
      case "pre":        return { ...base, clipPath: clip };
      case "flip-out":   return { ...base, clipPath: clip };
      case "expand":     return { ...base, clipPath: "inset(0px)", transition: "clip-path 0.38s cubic-bezier(0.4,0,0.2,1)" };
      case "open":       return { ...base, clipPath: "inset(0px)" };
      case "flip-close": return { ...base, clipPath: "inset(0px)" };
      case "shrink":     return { ...base, clipPath: clip, transition: "clip-path 0.35s cubic-bezier(0.4,0,0.2,1)" };
      default:           return { display: "none" };
    }
  }

  function innerStyle(): React.CSSProperties {
    const base: React.CSSProperties = { width: "100%", height: "100%" };
    switch (flipPhase) {
      case "pre":        return { ...base, transform: "perspective(1000px) rotateY(0deg)" };
      case "flip-out":   return { ...base, transform: "perspective(1000px) rotateY(90deg)",  transition: "transform 0.22s ease-in" };
      case "expand":     return { ...base, transform: "perspective(1000px) rotateY(0deg)",   transition: "transform 0.22s ease-out" };
      case "open":       return { ...base };
      case "flip-close": return { ...base, transform: "perspective(1000px) rotateY(90deg)",  transition: "transform 0.22s ease-in" };
      case "shrink":     return { ...base, transform: "perspective(1000px) rotateY(0deg)",   transition: "transform 0.22s ease-out" };
      default:           return base;
    }
  }

  const eraIndex = selectedEra ? ERAS.indexOf(selectedEra) : 0;
  const modalContent = selectedEra ? MODAL_CONTENT[selectedEra.year] : null;

  return (
    <>
      <style>{`
        @keyframes pulse-arrow {
          0%, 100% { opacity: 0.35; transform: translateY(0); }
          50%       { opacity: 0.9;  transform: translateY(8px); }
        }
        .era-card-left {
          opacity: 0; transform: translateX(-30px);
          transition: opacity 0.6s ease, transform 0.6s ease, border-color 0.2s ease;
        }
        .era-card-right {
          opacity: 0; transform: translateX(30px);
          transition: opacity 0.6s ease, transform 0.6s ease, border-color 0.2s ease;
        }
        .era-card-visible { opacity: 1 !important; transform: translateX(0) !important; }
        .modal-scroll::-webkit-scrollbar { width: 4px; }
        .modal-scroll::-webkit-scrollbar-track { background: transparent; }
        .modal-scroll::-webkit-scrollbar-thumb { background: rgba(200,170,100,0.3); border-radius: 2px; }
      `}</style>

      {/* ── Page-wide atmospheric background ── */}

      {/* SVG grain filter definition */}
      <svg style={{ position: "absolute", width: 0, height: 0 }}>
        <filter id="grain-filter">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
      </svg>

      {/* Vertical column lines */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage: "repeating-linear-gradient(90deg, transparent, transparent 120px, rgba(255,255,255,0.012) 120px, rgba(255,255,255,0.012) 121px)",
      }} />

      {/* Warm amber glow from top */}
      <div style={{
        position: "fixed", top: "-200px", left: "50%", transform: "translateX(-50%)",
        width: "800px", height: "600px", pointerEvents: "none", zIndex: 0,
        background: "radial-gradient(ellipse, rgba(180,140,60,0.06) 0%, transparent 70%)",
      }} />

      {/* SVG film grain overlay */}
      <div style={{
        position: "fixed", inset: 0, filter: "url(#grain-filter)",
        opacity: 0.035, pointerEvents: "none", zIndex: 1, mixBlendMode: "overlay",
      }} />

      <div style={{ backgroundColor: "#080808", minHeight: "100vh", color: "#fff", position: "relative", zIndex: 2 }}>

        {/* ── Hero ── */}
        <section
          style={{ display: "flex", flexDirection: "row", minHeight: "100vh", backgroundColor: "#080808", overflow: "hidden", position: "relative" }}
        >
          {/* Grain overlay */}
          <div style={{
            position: "fixed", inset: 0, width: "100%", height: "100%",
            pointerEvents: "none", zIndex: 2, opacity: 0.035,
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n' x='0' y='0'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
            backgroundRepeat: "repeat", backgroundSize: "300px 300px",
            animation: "grain 0.4s steps(1) infinite",
          }} />

          {/* Vignette */}
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none", zIndex: 3,
            background: "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.5) 65%, rgba(0,0,0,0.85) 100%)",
          }} />

          {/* Warm sepia glow */}
          <div style={{
            position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
            width: "600px", height: "400px", pointerEvents: "none", zIndex: 1,
            background: "radial-gradient(ellipse, rgba(180,140,80,0.06) 0%, transparent 70%)",
          }} />

          {/* Left image column */}
          <div style={{ width: "220px", flexShrink: 0, overflow: "hidden", height: "100vh", position: "relative", zIndex: 2, WebkitMaskImage: COL_MASK, maskImage: COL_MASK }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", animation: "scroll-up 25s linear infinite", paddingTop: "12px" }}>
              {[...LEFT_IMAGES, ...LEFT_IMAGES].map((file, idx) => (
                <Image key={idx} src={`/history-images/${file}`} alt="" width={220} height={160} style={{ objectFit: "cover", display: "block", flexShrink: 0, filter: IMG_FILTER }} />
              ))}
            </div>
          </div>

          {/* Center column */}
          <div style={{ flex: 1, minWidth: "500px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", textAlign: "center", padding: "0 40px", position: "relative", zIndex: 4 }}>
            <h1 style={{ fontFamily: SERIF, fontSize: "clamp(42px, 6vw, 80px)", fontWeight: 800, color: "#fff", letterSpacing: "-1px", lineHeight: 1.2, margin: "0 0 24px", textShadow: "0 2px 40px rgba(255,255,255,0.08)" }}>
              {displayedTitle}
              {!titleDone && (
                <span style={{ display: "inline-block", width: "3px", height: "0.85em", background: "white", marginLeft: "4px", verticalAlign: "middle", animation: "blink 0.7s step-end infinite" }} />
              )}
            </h1>

            <div style={{ opacity: showSubtitle ? 1 : 0, transition: "opacity 0.8s ease-in" }}>
              <p style={{ fontFamily: SERIF, fontSize: "18px", fontStyle: "italic", color: "rgba(255,255,255,0.55)", maxWidth: "500px", lineHeight: 1.65, letterSpacing: "0.3px", margin: "0 auto 2.25rem" }}>
                The discoveries, tragedies, and breakthroughs that shaped modern medicine
              </p>
            </div>

            <div style={{ opacity: showLine ? 1 : 0, transition: "opacity 0.6s ease-in" }}>
              <div style={{ width: "120px", height: "1px", backgroundColor: "rgba(200,170,100,0.4)", marginBottom: "1.5rem" }} />
            </div>

            <div style={{ opacity: showScroll ? 1 : 0, transition: "opacity 0.6s ease-in" }}>
              <p style={{ fontFamily: SANS, fontSize: "0.62rem", letterSpacing: "0.22em", color: "#555", textTransform: "uppercase", marginBottom: "1.4rem" }}>
                Scroll to Explore
              </p>
              <div style={{ width: "20px", height: "20px", borderRight: "1.5px solid rgba(255,255,255,0.6)", borderBottom: "1.5px solid rgba(255,255,255,0.6)", transform: "rotate(45deg)", margin: "8px auto 0", animation: "bounce-slow 2s ease-in-out infinite" }} />
            </div>
          </div>

          {/* Right image column */}
          <div style={{ width: "220px", flexShrink: 0, overflow: "hidden", height: "100vh", position: "relative", zIndex: 2, WebkitMaskImage: COL_MASK, maskImage: COL_MASK }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", animation: "scroll-down 25s linear infinite", paddingTop: "12px" }}>
              {[...RIGHT_IMAGES, ...RIGHT_IMAGES].map((file, idx) => (
                <Image key={idx} src={`/history-images/${file}`} alt="" width={220} height={160} style={{ objectFit: "cover", display: "block", flexShrink: 0, filter: IMG_FILTER }} />
              ))}
            </div>
          </div>
        </section>

        {/* ── Timeline ── */}
        <section style={{ backgroundColor: "#080808", padding: "6rem 2rem" }}>
          <div style={{ maxWidth: "960px", margin: "0 auto" }}>
            {ERAS.map((era, index) => {
              const isLeft = index % 2 === 0;
              return (
                <div key={era.year}>
                  <div style={{ display: "flex", justifyContent: isLeft ? "flex-start" : "flex-end" }}>
                    <div
                      className={isLeft ? "era-card-left" : "era-card-right"}
                      onClick={(e) => era.filled && openModal(era, e)}
                      style={{
                        position: "relative", width: "420px", padding: "32px", borderRadius: "4px",
                        backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
                        cursor: era.filled ? "pointer" : "default", overflow: "hidden",
                      }}
                      onMouseEnter={(e) => { if (era.filled) e.currentTarget.style.borderColor = "rgba(200,170,100,0.4)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
                    >
                      {/* Faded year watermark */}
                      <span style={{
                        position: "absolute", fontSize: "96px", fontWeight: 800, lineHeight: 1,
                        color: "rgba(255,255,255,0.04)", fontFamily: SERIF, top: "50%",
                        transform: "translateY(-50%)", right: isLeft ? "16px" : undefined,
                        left: isLeft ? undefined : "16px", userSelect: "none", pointerEvents: "none", whiteSpace: "nowrap",
                      }}>
                        {era.year}
                      </span>

                      {/* Gold dot on center-facing edge */}
                      <div style={{
                        position: "absolute", top: "50%", transform: "translateY(-50%)", zIndex: 1,
                        right: isLeft ? "-4px" : undefined, left: isLeft ? undefined : "-4px",
                        width: "8px", height: "8px", borderRadius: "50%", backgroundColor: GOLD,
                      }} />

                      <p style={{ fontSize: "11px", letterSpacing: "3px", color: "rgba(200,170,100,0.7)", textTransform: "uppercase", fontFamily: SANS, margin: "0 0 10px" }}>
                        ERA {String(index + 1).padStart(2, "0")}
                      </p>
                      <h3 style={{ fontFamily: SERIF, fontSize: "22px", fontWeight: 700, color: "#fff", margin: "0 0 10px" }}>
                        {era.name}
                      </h3>
                      <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)", lineHeight: 1.55, fontFamily: SANS, margin: "0 0 16px" }}>
                        {era.desc}
                      </p>
                      {era.filled ? (
                        <p style={{ fontSize: "12px", fontStyle: "italic", color: "rgba(255,255,255,0.4)", fontFamily: SERIF, margin: 0 }}>
                          Click to explore →
                        </p>
                      ) : (
                        <span style={{ display: "inline-block", fontSize: "10px", letterSpacing: "0.1em", color: "rgba(200,170,100,0.6)", border: "1px solid rgba(200,170,100,0.35)", borderRadius: "999px", padding: "3px 10px", fontFamily: SANS, textTransform: "uppercase" }}>
                          Coming Soon
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Zigzag connector + horizontal rule */}
                  {index < ERAS.length - 1 && (
                    <>
                      <svg style={{ width: "100%", height: "64px", display: "block" }} preserveAspectRatio="none">
                        <line x1={isLeft ? "22%" : "78%"} y1="0" x2={isLeft ? "78%" : "22%"} y2="100%" stroke="rgba(200,170,100,0.35)" strokeWidth="1" />
                      </svg>
                      <hr style={{ border: "none", borderTop: "1px solid rgba(255,255,255,0.04)", margin: "0 80px" }} />
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Footer ── */}
        <footer style={{ backgroundColor: "#080808", borderTop: "1px solid rgba(255,255,255,0.08)", padding: "80px 40px", textAlign: "center" }}>
          <p style={{ fontFamily: SERIF, fontSize: "13px", color: "rgba(255,255,255,0.25)", letterSpacing: "2px", textTransform: "uppercase", margin: "0 0 8px" }}>
            ToxiClear AI Historical Archive
          </p>
          <p style={{ fontFamily: SERIF, fontSize: "12px", fontStyle: "italic", color: "rgba(255,255,255,0.15)", margin: "0 0 24px" }}>
            All historical content is for educational purposes. Sources available in each era&rsquo;s further reading section.
          </p>
          <Link href="/check/free" style={{ color: "#1D9E75", fontSize: "13px", textDecoration: "none", letterSpacing: "1px", fontFamily: SANS }}>
            Check a Drug Interaction →
          </Link>
        </footer>
      </div>

      {/* ── Flip Modal Overlay ── */}
      {flipPhase !== "idle" && (
        <div style={overlayStyle()}>
          <div style={innerStyle()}>
            {!showModalContent || !selectedEra || !modalContent ? (
              /* Card face shown during flip-out */
              <div style={{ width: "100%", height: "100%", backgroundColor: "rgba(255,255,255,0.03)", padding: "32px", display: "flex", flexDirection: "column", justifyContent: "center", overflow: "hidden", position: "relative" }}>
                <p style={{ fontSize: "11px", letterSpacing: "3px", color: "rgba(200,170,100,0.7)", textTransform: "uppercase", fontFamily: SANS, margin: "0 0 10px" }}>
                  ERA {String(eraIndex + 1).padStart(2, "0")}
                </p>
                <h3 style={{ fontFamily: SERIF, fontSize: "22px", fontWeight: 700, color: "#fff", margin: "0 0 10px" }}>
                  {selectedEra?.name}
                </h3>
                <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)", lineHeight: 1.55, fontFamily: SANS, margin: "0 0 16px" }}>
                  {selectedEra?.desc}
                </p>
                <p style={{ fontSize: "12px", fontStyle: "italic", color: "rgba(255,255,255,0.4)", fontFamily: SERIF, margin: 0 }}>
                  Click to explore →
                </p>
              </div>
            ) : (
              /* Full newspaper modal */
              <div style={{ display: "flex", height: "100%", backgroundColor: "#000" }}>

                {/* ── Left column ── */}
                <div style={{ width: "42%", flexShrink: 0, height: "100%", borderRight: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column" }}>

                  {/* Image area */}
                  <div style={{ flex: "0 0 58%", display: "flex", flexDirection: "column", alignItems: "stretch", borderBottom: "1px solid rgba(255,255,255,0.06)", overflow: "hidden" }}>
                    <div style={{ position: "relative", width: "100%", height: "100%", minHeight: "400px" }}>
                      <Image
                        src={`/history-images/era${eraIndex + 1}-photo.png`}
                        alt={`${selectedEra.name} historical photograph`}
                        fill
                        style={{ objectFit: "cover", objectPosition: "center center", filter: "grayscale(100%) sepia(15%) contrast(108%)" }}
                      />
                    </div>
                  </div>

                  {/* Pull quote */}
                  <div style={{ flex: 1, padding: "28px 32px", display: "flex", flexDirection: "column", justifyContent: "center", overflow: "hidden" }}>
                    <div style={{ borderLeft: `2px solid ${GOLD_DIM}`, paddingLeft: "24px" }}>
                      {/* Portrait */}
                      <div style={{ position: "relative", width: "80px", height: "80px", borderRadius: "50%", overflow: "hidden", border: "1px solid rgba(200,170,100,0.4)", flexShrink: 0, marginBottom: "16px" }}>
                        <Image
                          src={`/history-images/era${eraIndex + 1}-portrait.png`}
                          alt={`${modalContent.quoteAttrib} portrait`}
                          fill
                          style={{ objectFit: "cover", objectPosition: "center top", filter: "grayscale(100%) sepia(10%)" }}
                        />
                      </div>

                      {/* Big opening quote mark */}
                      <div style={{ fontSize: "72px", lineHeight: 0.6, color: "rgba(200,170,100,0.35)", fontFamily: SERIF, marginBottom: "16px" }}>&ldquo;</div>

                      <p style={{ fontFamily: SERIF, fontSize: "16px", fontStyle: "italic", color: "rgba(255,255,255,0.82)", lineHeight: 1.65, margin: "0 0 14px" }}>
                        {modalContent.quote}
                      </p>
                      <p style={{ fontFamily: SANS, fontSize: "11px", color: "rgba(200,170,100,0.8)", letterSpacing: "1px", textTransform: "uppercase", margin: "0 0 4px" }}>
                        {modalContent.quoteAttrib}
                      </p>
                      <p style={{ fontFamily: SANS, fontSize: "10px", color: "rgba(255,255,255,0.35)", letterSpacing: "0.3px", margin: 0 }}>
                        {modalContent.quoteTitle}
                      </p>
                    </div>
                  </div>
                </div>

                {/* ── Right column ── */}
                <div className="modal-scroll" style={{ flex: 1, height: "100%", overflowY: "auto", padding: "48px 52px 60px 48px" }}>

                  {/* Close button */}
                  <button type="button" onClick={closeModal} style={{ position: "sticky", top: 0, float: "right", background: "transparent", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.5)", width: "32px", height: "32px", borderRadius: "50%", cursor: "pointer", fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginLeft: "16px", marginBottom: "8px" }}>
                    ✕
                  </button>

                  {/* Masthead row */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "20px" }}>
                    <span style={{ fontSize: "10px", letterSpacing: "3px", color: "rgba(200,170,100,0.8)", textTransform: "uppercase", fontFamily: SANS }}>
                      {modalContent.eraNum}
                    </span>
                    <span style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: "13px", color: "rgba(255,255,255,0.4)" }}>
                      {selectedEra.year}
                    </span>
                  </div>

                  {/* Headline */}
                  <h2 style={{ fontFamily: SERIF, fontSize: "clamp(32px,4vw,52px)", fontWeight: 800, lineHeight: 1.08, color: "#fff", margin: "0 0 16px", letterSpacing: "-0.5px" }}>
                    {modalContent.headline}
                  </h2>

                  {/* Deck */}
                  <p style={{ fontFamily: SERIF, fontSize: "18px", fontStyle: "italic", color: "rgba(255,255,255,0.6)", lineHeight: 1.55, borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "20px", marginBottom: "20px" }}>
                    {modalContent.deck}
                  </p>

                  {/* Byline */}
                  <p style={{ fontFamily: SANS, fontSize: "11px", color: "rgba(255,255,255,0.3)", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "36px" }}>
                    ToxiClear AI Historical Archive
                  </p>

                  {/* What Happened */}
                  <div style={{ marginBottom: "36px" }}>
                    <SectionLabel text="What Happened" />
                    <BodyParagraphs text={modalContent.whatHappened} dropCap />
                  </div>

                  {/* The Science */}
                  <div style={{ marginBottom: "36px", backgroundColor: "rgba(255,255,255,0.03)", borderLeft: "2px solid rgba(200,170,100,0.3)", padding: "20px 24px" }}>
                    <SectionLabel text="The Science" />
                    <BodyParagraphs text={modalContent.theScience} />
                  </div>

                  {/* What Changed */}
                  <div style={{ marginBottom: "40px" }}>
                    <SectionLabel text="What Changed" />
                    <BodyParagraphs text={modalContent.whatChanged} />
                  </div>

                  {/* Further Reading */}
                  <div style={{ marginBottom: "40px" }}>
                    <p style={{ fontSize: "10px", letterSpacing: "3px", color: GOLD, textTransform: "uppercase", fontFamily: SANS, margin: "0 0 8px" }}>
                      Further Reading
                    </p>
                    <div style={{ height: "1px", backgroundColor: "rgba(200,170,100,0.25)", marginBottom: "20px" }} />
                    {modalContent.readings.map((r, i) => (
                      <div key={i} style={{ display: "flex", gap: "12px", marginBottom: "14px" }}>
                        <span style={{ color: "rgba(200,170,100,0.7)", fontSize: "13px", flexShrink: 0 }}>›</span>
                        <div>
                          <span style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>{r.publication} &mdash; </span>
                          <span style={{ fontFamily: SANS, fontSize: "13px", color: "rgba(255,255,255,0.8)" }}>{r.title}</span>
                          <span style={{ fontFamily: SANS, fontSize: "11px", color: "rgba(255,255,255,0.3)", marginLeft: "8px" }}>({r.year})</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* CTA */}
                  <div style={{ textAlign: "center", marginTop: "8px" }}>
                    <Link href="/check/free" className="inline-block w-full rounded border border-teal-700 py-3 text-sm text-teal-500 transition-colors hover:border-teal-500 hover:bg-teal-950/20 hover:text-teal-400" style={{ fontFamily: SANS, textAlign: "center" }}>
                      Try a similar interaction in ToxiClear →
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
