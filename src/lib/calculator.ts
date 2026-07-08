export type OptionEntry = {
  strike: string;
  call: number | null;
  put: number | null;
};

export type StraddleResult = {
  atmStrike: number;
  call: number;
  put: number;
  sum: number;
  isMock: boolean;
};

/**
 * 주어진 행사가별 콜/풋 가격 맵에서 ATM(등가격) 행사가를 찾아 양합을 계산합니다.
 * ATM은 콜 가격과 풋 가격의 차이의 절댓값(Math.abs)이 가장 작은 행사가로 정의합니다.
 */
export function calculateATMStraddle(strikeMap: Map<string, { call: number | null, put: number | null }>): StraddleResult | null {
  let minDiff = Infinity;
  let atmStrikeStr = "0";
  let bestEntry = { call: 0, put: 0 };

  Array.from(strikeMap.entries()).forEach(([strike, prices]) => {
    // 콜과 풋 모두 가격이 존재하는 경우에만 비교 (가격이 0인 경우는 필터링됨)
    if (prices.call !== null && prices.put !== null && prices.call > 0 && prices.put > 0) {
      // 콜 - 풋의 절대값 오차 계산
      const diff = Math.abs(prices.call - prices.put);
      
      // 오차가 가장 작은 행사가를 ATM으로 식별
      if (diff < minDiff) {
        minDiff = diff;
        atmStrikeStr = strike;
        bestEntry = { call: prices.call, put: prices.put };
      }
    }
  });

  // 유효한 ATM을 찾지 못한 경우 null 반환
  if (atmStrikeStr === "0" || (bestEntry.call === 0 && bestEntry.put === 0)) {
    return null;
  }

  // 양합(Straddle) = C_ATM + P_ATM
  // 소수점 2자리에서 반올림 처리
  const sum = Math.round((bestEntry.call + bestEntry.put) * 100) / 100;
  
  return {
    atmStrike: parseFloat(atmStrikeStr),
    call: bestEntry.call,
    put: bestEntry.put,
    sum: sum,
    isMock: false
  };
}
