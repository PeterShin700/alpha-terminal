fetch('http://localhost:3000/api/cron/day-market', {
  headers: {
    'Authorization': 'Bearer my_development_cron_secret'
  }
})
  .then(res => res.json())
  .then(data => console.log("Cron Result:", JSON.stringify(data, null, 2)))
  .catch(err => console.error("Error:", err));
