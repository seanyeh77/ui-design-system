import type * as React from 'react';

/** A row: any object. Column keys are checked against it. */
export type Row = object;
/** The string keys of a row type. */
export type RowKey<R extends Row> = Extract<keyof R, string>;

export interface DataTableColumn<R extends Row = Record<string, unknown>> {
  /** The field shown in this column. */
  key: RowKey<R>;
  /** Header text; never wraps. */
  label: string;
  /** Numbers: right-aligned with tabular figures. */
  numeric?: boolean;
  /** After each value: '%', 'ms', '個'. Write it here, not in the label. */
  unit?: string;
  /** Your own cell content (a Badge, a link). Return plain values from searchText for search. */
  render?: (row: R) => React.ReactNode;
  sortable?: boolean;
  /** What to sort by when it is not the field itself. */
  sortValue?: (row: R) => number | string;
  width?: number;
  grow?: number;
  /** money: NT$ 1,280. date: 2026/11/04（三）. relative: 「2 小時前」 within a week. */
  format?: 'money' | 'date' | 'datetime' | 'relative' | 'percent';
  currency?: string;
  decimals?: number;
  /** The text search matches for this column. */
  searchText?: (row: R) => string;
  /** Place on phone cards: title row left, title row right, or hidden. Default: the first column is the title. */
  mobile?: 'title' | 'status' | 'hide';
  /** Long text: 2 lines with 「顯示全部」 on phone cards, one line with an ellipsis on desktop. */
  long?: boolean;
}

export interface FilterOption {
  value: string;
  label: string;
}

export interface DataTableFilter<R extends Row = Record<string, unknown>> {
  key: RowKey<R>;
  label: string;
  /** list: options with counts (default). range: min and max. */
  type?: 'list' | 'range';
  /** Default: every distinct value of the field. */
  options?: FilterOption[];
  /** More than one option at a time. Default true. */
  multiple?: boolean;
  /** Range inputs are multiplied by this before comparing, e.g. 1024 for MB typed against bytes. */
  scale?: number;
  /** Under the range inputs, e.g. 「單位：MB」. */
  unitLabel?: string;
  /** Your own test for a row. */
  match?: (row: R, value: FilterValue) => boolean;
}

export type RangeValue = { min: string; max: string };
export type FilterValue = string[] | RangeValue;

/** A filter with its defaults filled in. */
export type ResolvedFilter<R extends Row> = DataTableFilter<R> & { type: 'list' | 'range'; multiple: boolean; options: FilterOption[] };

export interface DataTableView<R extends Row = Record<string, unknown>> {
  id: string;
  label: string;
  filter?: (row: R) => boolean;
}

export type Total<R extends Row> = 'sum' | 'avg' | ((rows: R[]) => React.ReactNode);
