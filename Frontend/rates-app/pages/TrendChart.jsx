import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';



export default function TrendChart() {
  const [rates, setRates] = useState([]);
  const [base, setBase] = useState("USD");
  const [target, setTarget] = useState("EUR");
  const [range, setRange] = useState("7");
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
  axios.get("http://localhost:5039/rates")
    .then(res => {
      setRates(res.data.data);
      console.log("Rates loaded:", res.data.data.length);
      console.log("Sample rates:", res.data.data.slice(0, 5));

      console.log("Available dates:", [...new Set(res.data.data.map(r => r.date))]);
    })
    .catch(err => console.error("Error:", err));

    

}, []);


  useEffect(() => {
    if (!rates.length) return;

    const today = new Date();
    const from = new Date(today);
    from.setDate(today.getDate() - parseInt(range));

    const pad = n => (n < 10 ? "0" + n : n);
    const formatDate = (d) => `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}.`;

    const dates = [];
    for (let d = new Date(from); d <= today; d.setDate(d.getDate() + 1)) {
      dates.push(formatDate(new Date(d)));
    }

    console.log("Generated date range:", dates);
    const filtered = rates.filter(r =>
      dates.includes(r.date) && [base, target].includes(r.currencyName)
    );
    console.log("Filtered count:", filtered.length);
    console.log("Sample filtered:", filtered.slice(0, 5));


    const result = [];
    for (let d of dates) {
      const a = filtered.find(r => r.date === d && r.currencyName === base);
      const b = filtered.find(r => r.date === d && r.currencyName === target);

      if (a && b) {
        result.push({
          date: d,
          rate: (parseFloat(a.middleRate) / parseFloat(b.middleRate)).toFixed(4)
        });
      }
    }

    setChartData(result);
  }, [rates, base, target, range]);

  const currencyOptions = [...new Set(rates.map(r => r.currencyName))];

  return (
    <div style={{ padding: "20px" }}>
      <h1>Kretanje vrijednosti valute</h1>

      <label>Osnovna valuta:</label>
      <select value={base} onChange={e => setBase(e.target.value)}>
        {currencyOptions.map((c, i) => <option key={i} value={c}>{c}</option>)}
      </select>

      <label>U odnosu na:</label>
      <select value={target} onChange={e => setTarget(e.target.value)}>
        {currencyOptions.map((c, i) => <option key={i} value={c}>{c}</option>)}
      </select>

      <label>Raspon:</label>
      <select value={range} onChange={e => setRange(e.target.value)}>
        <option value="7">7 dana</option>
        <option value="30">30 dana</option>
      </select>

      <div style={{ width: "100%", height: 300, marginTop: 20 }}>
        <ResponsiveContainer>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="rate" stroke="#8884d8" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
