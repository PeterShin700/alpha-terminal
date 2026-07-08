import urllib.request
import urllib.parse
import json

def fetch_krx():
    url = "http://data.krx.co.kr/comm/bldAttendant/getJsonData.cmd"
    
    headers = {
        'User-Agent': 'Mozilla/5.0',
        'Referer': 'http://data.krx.co.kr/',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'X-Requested-With': 'XMLHttpRequest'
    }

    # Let's try MDCSTAT12501 with KOSPI200 Call Option
    data = urllib.parse.urlencode({
        'bld': 'dbms/MDC/STAT/standard/MDCSTAT12501',
        'trdDd': '20260707',
        'prodId': 'KR4201', # Call
    }).encode('utf-8')

    req = urllib.request.Request(url, data=data, headers=headers)
    
    try:
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode('utf-8'))
            if 'output' in result:
                print("Output rows:", len(result['output']))
                for row in result['output'][:2]:
                    print(row)
    except urllib.error.HTTPError as e:
        print(f"Error {e.code}: {e.read().decode('utf-8')}")

fetch_krx()
