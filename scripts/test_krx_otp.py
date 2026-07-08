import urllib.request
import urllib.parse
import json
import datetime
from pykrx import stock

def get_kospi200_close():
    # Use PyKRX to get KOSPI 200
    today = datetime.datetime.now().strftime("%Y%m%d")
    df = stock.get_index_ohlcv_by_date(today, today, "1028") # 1028 is KOSPI 200
    if df.empty:
        # fallback to yesterday
        yesterday = (datetime.datetime.now() - datetime.timedelta(days=1)).strftime("%Y%m%d")
        df = stock.get_index_ohlcv_by_date(yesterday, yesterday, "1028")
    if not df.empty:
        return float(df['종가'].iloc[0])
    return 380.0 # fallback

def test_krx_options():
    # 1. KOSPI 200
    k200 = get_kospi200_close()
    print("KOSPI 200 Close:", k200)
    
    atm_strike = round(k200 / 2.5) * 2.5
    print("Calculated ATM Strike:", atm_strike)
    
    url_gen = "http://data.krx.co.kr/comm/fileDn/GenerateOTP/generate.cmd"
    headers = {
        'User-Agent': 'Mozilla/5.0',
        'Referer': 'http://data.krx.co.kr/',
    }
    
    # KOSPI 200 Weekly Option Call: KR4209
    params = {
        'locale': 'ko_KR',
        'mktId': 'ALL',
        'share': '1',
        'csvxls_isNo': 'false',
        'name': 'fileDown',
        'url': 'dbms/MDC/STAT/standard/MDCSTAT12601',
        'trdDd': '20260707',
        'prodId': 'KR4209' 
    }
    
    data = urllib.parse.urlencode(params).encode('utf-8')
    req = urllib.request.Request(url_gen, data=data, headers=headers)
    
    try:
        with urllib.request.urlopen(req) as response:
            otp = response.read().decode('utf-8')
            print("OTP:", otp)
            
            url_down = "http://data.krx.co.kr/comm/fileDn/download_csv/download.cmd"
            req2 = urllib.request.Request(url_down, data=urllib.parse.urlencode({'code': otp}).encode('utf-8'), headers=headers)
            with urllib.request.urlopen(req2) as resp2:
                csv_data = resp2.read().decode('EUC-KR')
                print(csv_data[:500])
    except Exception as e:
        print("Error:", e)

test_krx_options()
