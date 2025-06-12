import { useEffect, useState } from 'react';
import axios from 'axios';

export default function Tools() {
  const [rates, setRates] = useState([]);
  const [date, setDate] = useState("");
  const [amount, setAmount] = useState(1);
  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState("EUR");
  const [type, setType] = useState("middleRate");
  const [result, setResult] = useState(null);

  useEffect(() => {
    axios
      .get("http://localhost:5039/rates")
      .then(res => setRates(res.data.data))
      .catch(err => console.error("Error fetching rates:", err));
  }, []);

  const convert = () => {
    if (!amount || !from || !to || !type) {
      setResult("Sva polja moraju biti ispunjena.");
      return;
    }
    


    const today = new Date();
    const selectedDate = date ? new Date(date) : today;
    const pad = (n) => (n < 10 ? `0${n}` : n);
    const formattedDate = `${pad(selectedDate.getDate())}.${pad(selectedDate.getMonth() + 1)}.${selectedDate.getFullYear()}.`;


    const filteredRates = rates.filter(r => r.date.trim() === formattedDate.trim());
    const availableCurrencies = [...new Set(filteredRates.map(r => r.currencyName))];


    /** Testing
     * console.log("Looking for date:", formattedDate);
     * console.log("Filtered rates:", filteredRates);
     * console.log("From:", from, "| To:", to);
     */
    
    const source = filteredRates.find(r => r.currencyName === from);
    const target = filteredRates.find(r => r.currencyName === to);

    if (!source || !target) {
      setResult("Tečaj za zadani datum nije pronađen.");
      return;
    }

    const sourceRate = parseFloat(source[type]);
    const targetRate = parseFloat(target[type]);

    if (isNaN(sourceRate) || isNaN(targetRate)) {
      setResult("Neispravni tečajevi.");
      return;
    }

    const value = (parseFloat(amount) * sourceRate) / targetRate;
    setResult(`${amount} ${from} = ${value.toFixed(4)} ${to}`);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Kalkulator za konverziju</h1>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxWidth: "400px" }}>
        <label>Iznos</label>
        <input
          type="number"
          value={amount === "" ? "" : amount}
          onChange={(e) => {
            const val = e.target.value;
            setAmount(val === "" ? "" : parseFloat(val));
          }}
        />

        <label>Iz valute</label>
        <select value={from} onChange={(e) => setFrom(e.target.value)}>
          {rates.map((r, i) => (
            <option key={i} value={r.currencyName}>
              {r.currencyName} ({r.currencyCode})
            </option>
          ))}
        </select>

        <label>U valutu</label>
        <select value={to} onChange={(e) => setTo(e.target.value)}>
          {rates.map((r, i) => (
            <option key={i} value={r.currencyName}>
              {r.currencyName} ({r.currencyCode})
            </option>
          ))}
        </select>

        <label>Vrsta tečaja</label>
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="buyRate">Kupovni</option>
          <option value="middleRate">Srednji</option>
          <option value="sellRate">Prodajni</option>
        </select>

        <label>Datum (opcionalno)</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />

        <button onClick={convert}>Konvertiraj</button>

        <p><strong>Rezultat:</strong> {result}</p>
      </div>
    </div>
  );
}
