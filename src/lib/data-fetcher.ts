// src/lib/data-fetcher.ts

/**
 * 인위적인 딜레이(Throttling)를 발생시킵니다.
 * KRX 사이트 시스템 차단을 방지하기 위해 사용됩니다.
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * KRX OTP 발급 및 데이터 조회를 모방하는 Node.js 함수입니다.
 * (실제 KRX 웹크롤링 시에는 복잡한 폼데이터 전송과 쿠키가 필요할 수 있으므로, 본 함수는 뼈대와 임시 모킹을 포함합니다.)
 */
export async function fetchKrxInvestorNet(bld: string) {
  try {
    // 1. Throttling 대기 (1~2초 랜덤 지연)
    const randomDelay = Math.floor(Math.random() * 1000) + 1000;
    await delay(randomDelay);

    // 2. OTP 발급 요청 (KRX는 generate.cmd 에 bld 파라미터를 POST하여 OTP를 받음)
    // const otpResponse = await fetch('http://data.krx.co.kr/comm/fileDn/GenerateOTP/generate.cmd', { method: 'POST', body: ... });
    // const otp = await otpResponse.text();

    // 3. 실제 데이터 조회
    // const dataResponse = await fetch('http://data.krx.co.kr/comm/bldAttendant/getJsonData.cmd', { method: 'POST', body: new URLSearchParams({ code: otp }) });
    // const data = await dataResponse.json();

    console.log(`[KRX Fetcher] Simulated OTP and Data Fetch for BLD: ${bld}`);

    // (모의 응답 생성)
    // 실제 환경에서는 KRX 응답의 JSON을 리턴합니다.
    return {
      success: true,
      data: {
        foreign: Math.floor(Math.random() * 5000) - 2500, // -2500 ~ 2500
        institution: Math.floor(Math.random() * 5000) - 2500
      }
    };
  } catch (error) {
    console.error(`[KRX Fetcher] Error fetching KRX data for BLD ${bld}:`, error);
    return { success: false, error };
  }
}

/**
 * 프로그램 매매 동향 크롤링 모방 함수
 */
export async function fetchKrxProgramTrading(bld: string) {
  try {
    const randomDelay = Math.floor(Math.random() * 1000) + 1000;
    await delay(randomDelay);

    console.log(`[KRX Fetcher] Simulated Program Trading Fetch for BLD: ${bld}`);
    return {
      success: true,
      data: {
        trend: Array.from({ length: 5 }, () => Math.floor(Math.random() * 1000) - 500)
      }
    };
  } catch (error) {
    console.error(`[KRX Fetcher] Error fetching Program Trading data for BLD ${bld}:`, error);
    return { success: false, error };
  }
}

/**
 * 수집한 JSON 데이터가 올바른 구조를 가지는지 검증하는 Schema Validation 함수
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function validateLiquiditySchema(data: any): boolean {
  if (!data) return false;
  
  const { investorNet, programTrading } = data;
  
  if (!investorNet || typeof investorNet.foreign !== 'number' || typeof investorNet.institution !== 'number') {
    return false;
  }
  
  if (!programTrading || !Array.isArray(programTrading.trend)) {
    return false;
  }
  
  return true;
}
