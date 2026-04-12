const token = process.env.TOKEN;
(async()=>{
  const res = await fetch('http://localhost:5000/api/appointments', { headers: { Authorization: `Bearer ${token}` } });
  console.log(res.status);
  console.log(await res.text());
})();
