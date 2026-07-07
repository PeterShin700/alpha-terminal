import traceback
from pykrx import stock

try:
    print("Testing 20260707 KOSPI investor volume...")
    df = stock.get_market_trading_volume_by_investor("20260707", "20260707", "KOSPI")
    print(df.head())
except Exception as e:
    print("Error for 20260707:")
    traceback.print_exc()

try:
    print("\nTesting 20260706 KOSPI investor volume...")
    df = stock.get_market_trading_volume_by_investor("20260706", "20260706", "KOSPI")
    print(df.head())
except Exception as e:
    print("Error for 20260706:")
    traceback.print_exc()
