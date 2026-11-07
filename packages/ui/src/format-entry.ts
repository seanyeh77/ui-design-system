/* @seanyeh77/ui/format: dates, numbers, amounts and UI text without React, so server code can use them too.
   The main entry re-exports the same functions and shares the same locale. */
export { format, type Decimals } from './format';
export { tr as t, setLocale, addMessages } from './i18n';
