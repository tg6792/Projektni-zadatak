import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';


export default function RatesList() {
  const [rates, setRates] = useState([]);
  const [filter, setFilter] = useState('');
  const navigate = useNavigate();

const handleDelete = (id) => {
  if (confirm("Izbrisati tečajnicu?")) {
    axios.delete(`http://localhost:5039/rates/${id}`)
      .then(() => window.location.reload());
  }
};


  useEffect(() => {
  axios
    .get("http://localhost:5039/rates")
    .then(res => {
        console.log(res.data); // ✅ this is the debug line
        setRates(res.data.data);
      })
    .catch(err => console.error("Fetch failed:", err));
}, []);


  return (
    <div style={{ padding: '20px' }}>
      <h1>Pregled tečajnica</h1>

      <input
        type="text"
        placeholder="Filter by currency code"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        style={{ marginBottom: '10px', padding: '5px' }}
      />

      <table border="1" cellPadding="8">
        <thead>
          <tr>
            <th>Datum</th>
            <th>Šifra</th>
            <th>Valuta</th>
            <th>Srednji</th>
            <th>Detalji</th>
            <th>Obriši</th>

          </tr>
        </thead>
        <tbody>
          {rates.map((rate, index) => (
            rate.id ? (
                <tr key={rate.id}>
                <td>{rate.date}</td>
                <td>{rate.currencyCode}</td>
                <td>{rate.currencyName}</td>
                <td>{rate.middleRate}</td>
                <td>
                    <Link to={`/rates/${rate.id}`}>Prikaži</Link>
                </td>
                <td>
                    <button onClick={() => handleDelete(rate.id)}>X</button>
                </td>

                </tr>
            ) : null
            ))}


        </tbody>
      </table>
    </div>
  );
}
