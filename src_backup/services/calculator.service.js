import { PURITY_PRESETS, WEIGHT_UNITS } from '../utils/constants.js';

export function calculateFineGold(grossWeightGrams, purityPercent, makingPercent = 0) {
  if (!grossWeightGrams || !purityPercent) return 0;
  return grossWeightGrams * (purityPercent + makingPercent) / 100;
}

export function calculateFineGoldFromMetal(weightGrams, purityPercent) {
  if (!weightGrams || !purityPercent) return 0;
  return weightGrams * purityPercent / 100;
}

export function calculateFineGoldFromCash(cashAmountInr, ratePerGramInr) {
  if (!cashAmountInr || !ratePerGramInr || ratePerGramInr <= 0) return 0;
  return cashAmountInr / ratePerGramInr;
}

export function calculateCashFromGold(fineGoldGrams, ratePerGramInr) {
  if (!fineGoldGrams || !ratePerGramInr) return 0;
  return fineGoldGrams * ratePerGramInr;
}

export function getPurityFromKarat(karatLabel) {
  const preset = PURITY_PRESETS.find(p => p.label === karatLabel);
  return preset ? preset.purity : null;
}

export function convertWeight(value, fromUnit, toUnit) {
  if (!value) return 0;
  const from = WEIGHT_UNITS.find(u => u.key === fromUnit);
  const to = WEIGHT_UNITS.find(u => u.key === toUnit);
  if (!from || !to) return value;
  const grams = value * from.inGrams;
  return grams / to.inGrams;
}

export function convertRate(ratePerUnit, fromUnit, toUnit) {
  if (!ratePerUnit) return 0;
  const from = WEIGHT_UNITS.find(u => u.key === fromUnit);
  const to = WEIGHT_UNITS.find(u => u.key === toUnit);
  if (!from || !to) return ratePerUnit;
  return ratePerUnit * (to.inGrams / from.inGrams);
}

export function getAllWeightConversions(grams) {
  return WEIGHT_UNITS.map(u => ({
    unit: u.key, label: u.label, abbr: u.abbr,
    value: grams / u.inGrams,
  }));
}

export function getAllRateConversions(ratePerGram) {
  return WEIGHT_UNITS.map(u => ({
    unit: u.key, label: u.label, abbr: u.abbr,
    value: ratePerGram * u.inGrams,
  }));
}
