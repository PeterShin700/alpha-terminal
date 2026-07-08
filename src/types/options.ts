export interface OptionChainItem {
  date: string;
  strike: number;
  call: number | null;
  put: number | null;
  sum: number | null;
  d1Variance: number | null | 'N/A';
  isATM: boolean;
  prdCtg?: string;
  itmsNm?: string;
}

export interface OptionChainData {
  items: OptionChainItem[];
  timestamp: string;
  apiRawStatus?: string;
}
