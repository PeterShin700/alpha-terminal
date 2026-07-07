const https = require('https');
const AdmZip = require('adm-zip');
const { parse } = require('csv-parse/sync');

const urlFin = 'https://www.cftc.gov/files/dea/history/fut_fin_txt_2026.zip';
const urlDisagg = 'https://www.cftc.gov/files/dea/history/fut_disagg_txt_2026.zip';

async function fetchAndParse(url, searchStr) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            const data = [];
            res.on('data', chunk => data.push(chunk));
            res.on('end', () => {
                const buffer = Buffer.concat(data);
                const zip = new AdmZip(buffer);
                const entries = zip.getEntries();
                if (entries.length > 0) {
                    const txt = entries[0].getData().toString('utf8');
                    const records = parse(txt, { columns: true, skip_empty_lines: true });
                    const match = records.find(r => r['Market and Exchange Names'] && r['Market and Exchange Names'].includes(searchStr));
                    resolve(match);
                } else {
                    resolve(null);
                }
            });
        }).on('error', reject);
    });
}

(async () => {
    try {
        const nq = await fetchAndParse(urlFin, 'NASDAQ-100');
        console.log('NASDAQ:', nq ? nq['Market and Exchange Names'] : 'Not found');
        if (nq) {
            console.log('Lev Money Long:', nq['Lev_Money_Positions_Long_All']);
            console.log('Lev Money Short:', nq['Lev_Money_Positions_Short_All']);
            console.log('Asset Mgr Long:', nq['Asset_Mgr_Positions_Long_All']);
            console.log('Asset Mgr Short:', nq['Asset_Mgr_Positions_Short_All']);
        }

        const wti = await fetchAndParse(urlDisagg, 'CRUDE OIL');
        console.log('\nWTI:', wti ? wti['Market and Exchange Names'] : 'Not found');
        if (wti) {
            console.log('M_Money_Positions_Long_All:', wti['M_Money_Positions_Long_All']);
            console.log('M_Money_Positions_Short_All:', wti['M_Money_Positions_Short_All']);
        }
    } catch (e) {
        console.error(e);
    }
})();
