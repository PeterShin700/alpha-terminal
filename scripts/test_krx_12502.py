import requests

def test_krx():
    session = requests.Session()
    headers = {
        'User-Agent': 'Mozilla/5.0',
        'Referer': 'http://data.krx.co.kr/',
    }
    session.get("http://data.krx.co.kr/contents/MDC/MDI/mdiLoader/index.cmd", headers=headers)
    
    url = "http://data.krx.co.kr/comm/fileDn/GenerateOTP/generate.cmd"
    params = {
        'locale': 'ko_KR',
        'mktId': 'ALL',
        'trdDd': '20260707',
        'prodId': 'KR4201', # KOSPI 200 Call Options
        'rghtTpCd': 'C',
        'share': '1',
        'csvxls_isNo': 'false',
        'name': 'fileDown',
        'url': 'dbms/MDC/STAT/standard/MDCSTAT12502'
    }
    headers['X-Requested-With'] = 'XMLHttpRequest'
    res = session.post(url, data=params, headers=headers)
    otp = res.text
    print("OTP:", otp)
    if "LOGOUT" not in otp:
        csv_res = session.post("http://data.krx.co.kr/comm/fileDn/download_csv/download.cmd", data={'code': otp}, headers=headers)
        csv_res.encoding = 'EUC-KR'
        print(csv_res.text[:500])

test_krx()
