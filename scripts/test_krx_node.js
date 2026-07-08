async function fetchKrx() {
    try {
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        };

        // 1. Get cookies
        const resInit = await fetch('http://data.krx.co.kr/contents/MDC/MDI/mdiLoader/index.cmd?menuId=MDC0201020201', { headers });
        let cookies = [];
        const setCookieHeaders = resInit.headers.get('set-cookie');
        if (setCookieHeaders) {
            // Split by comma but carefully to ignore commas in dates
            const parts = setCookieHeaders.split(/,(?=\s*[a-zA-Z0-9_-]+\=)/);
            cookies = parts.map(c => c.split(';')[0].trim());
        }
        const cookieStr = cookies.join('; ');
        console.log("Cookies:", cookieStr);

        const genUrl = "http://data.krx.co.kr/comm/fileDn/GenerateOTP/generate.cmd";
        const today = new Date();
        const dateStr = today.toISOString().slice(0,10).replace(/-/g, '');

        const params = new URLSearchParams({
            locale: 'ko_KR',
            mktId: 'ALL',
            trdDd: dateStr,
            share: '1',
            csvxls_isNo: 'false',
            name: 'fileDown',
            url: 'dbms/MDC/STAT/standard/MDCSTAT12501'
        });

        const resGen = await fetch(genUrl, {
            method: 'POST',
            headers: {
                ...headers,
                'Referer': 'http://data.krx.co.kr/contents/MDC/MDI/mdiLoader/index.cmd?menuId=MDC0201020201',
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'Accept': 'text/plain, */*; q=0.01',
                'X-Requested-With': 'XMLHttpRequest',
                'Cookie': cookieStr
            },
            body: params.toString()
        });

        const otp = await resGen.text();
        console.log("OTP:", otp);

        if(otp && !otp.includes('<html>') && otp !== 'LOGOUT') {
            const downUrl = "http://data.krx.co.kr/comm/fileDn/download_csv/download.cmd";
            const downParams = new URLSearchParams({ code: otp });
            console.log("Downloading CSV...");
            const resDown = await fetch(downUrl, {
                method: 'POST',
                headers: {
                    ...headers,
                    'Referer': 'http://data.krx.co.kr/contents/MDC/MDI/mdiLoader/index.cmd?menuId=MDC0201020201',
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Cookie': cookieStr
                },
                body: downParams.toString()
            });
            const csvBuffer = await resDown.arrayBuffer();
            const iconv = require('iconv-lite');
            const csvText = iconv.decode(Buffer.from(csvBuffer), 'EUC-KR');
            console.log("CSV Output length:", csvText.length);
            console.log(csvText.substring(0, 1000));
        }
    } catch (e) {
        console.error(e);
    }
}
fetchKrx();
