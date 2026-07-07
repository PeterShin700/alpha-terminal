import sys
import json
from datetime import datetime, timedelta
from pykrx import stock

def get_latest_business_day():
    today = datetime.today()
    # Check up to 10 days back
    for i in range(10):
        d = today - timedelta(days=i)
        d_str = d.strftime("%Y%m%d")
        b_days = stock.get_business_days_of_month(d.year, d.month)
        b_days_str = [day.strftime("%Y%m%d") for day in b_days]
        if d_str in b_days_str:
            return d_str
    return today.strftime("%Y%m%d")

def fetch_data():
    try:
        date = get_latest_business_day()
        
        # 1. KOSPI Investor net buy (foreign & institution)
        # Using KOSPI market (or KOSPI 200 if supported, KOSPI is safer)
        df_inv = stock.get_market_trading_volume_by_investor(date, date, "KOSPI")
        
        # In pykrx, investors are rows or columns.
        # usually columns are: 기관합계, 외국인, 개인 ...
        # Let's try to fetch KOSPI ticker 005930 (Samsung) or whole market?
        # Actually, get_market_trading_value_by_investor is better.
        
        # Let's just output some structure first to inspect
        print(json.dumps({"status": "ok", "date": date}))
    except Exception as e:
        print(json.dumps({"status": "error", "message": str(e)}))

if __name__ == "__main__":
    fetch_data()
