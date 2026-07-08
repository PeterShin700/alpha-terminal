import requests
import json
import datetime

def test_krx_options():
    session = requests.Session()
    
    # 1. Get initial cookies
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    }
    session.get("http://data.krx.co.kr/contents/MDC/MDI/mdiLoader/index.cmd?menuId=MDC0201020201", headers=headers)
    
    # 2. Get KOSPI 200 Weekly Options (MDCSTAT12501)
    # Actually MDCSTAT12501 requires ProdId like 'KR4201...'
    # Let's try MDCSTAT12502 (Options by strike price)
    # bld: dbms/MDC/STAT/standard/MDCSTAT12502
    
    gen_url = "http://data.krx.co.kr/comm/fileDn/GenerateOTP/generate.cmd"
    
    today = datetime.datetime.now().strftime("%Y%m%d")
    
    # KOSPI 200 Option is 201
    # Weekly Option is maybe a different trdDd or prodId?
    # Actually, if we just query KOSPI 200 Options (Monthly), it's close enough for the prototype!
    params = {
        'locale': 'ko_KR',
        'mktId': 'ALL',
        'trdDd': '20240705', # use a known past date to avoid weekend empty data
        'share': '1',
        'csvxls_isNo': 'false',
        'name': 'fileDown',
        'url': 'dbms/MDC/STAT/standard/MDCSTAT12502',
        'prodId': 'KR4201' # This might fail if it requires more params, let's just see if we get an OTP
    }
    
    headers['Referer'] = 'http://data.krx.co.kr/contents/MDC/MDI/mdiLoader/index.cmd?menuId=MDC0201020201'
    headers['X-Requested-With'] = 'XMLHttpRequest'
    
    res = session.post(gen_url, data=params, headers=headers)
    otp = res.text
    print("OTP:", otp)
    
    if "LOGOUT" not in otp and "<html" not in otp:
        down_url = "http://data.krx.co.kr/comm/fileDn/download_csv/download.cmd"
        res_csv = session.post(down_url, data={'code': otp}, headers=headers)
        res_csv.encoding = 'EUC-KR'
        print("CSV preview:", res_csv.text[:500])

test_krx_options()
