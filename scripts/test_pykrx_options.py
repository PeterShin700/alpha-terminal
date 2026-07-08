import sys
from pykrx import stock
import datetime

def test_pykrx_options():
    try:
        today = datetime.datetime.now().strftime("%Y%m%d")
        print("Checking if pykrx supports options...")
        # PyKRX usually supports stocks, ETFs, ETNs. Does it support derivatives?
        # Let's check available modules
        print(dir(stock))
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    test_pykrx_options()
