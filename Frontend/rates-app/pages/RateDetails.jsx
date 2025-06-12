import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';



export default function RateDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [rate, setRate] = useState(null);
  const [form, setForm] = useState({
    date: "",
    currencyCode: "",
    currencyName: "",
    buyRate: "",
    middleRate: "",
    sellRate: ""
  });
  const [status, setStatus] = useState("");

  useEffect(() => {
    axios.get(`http://localhost:5039/rates/${id}`)
      .then(res => {
        setRate(res.data.data);
        setForm(res.data.data); // populate form
      })
      .catch(err => setStatus("Ne mogu dohvatiti tečajnicu"));
  }, [id]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleUpdate = () => {
    if (!form.date || !form.currencyCode || !form.currencyName) {
      setStatus("Sva polja moraju biti ispunjena.");
      return;
    }

    axios.put(`http://localhost:5039/rates/${id}`, form)
      .then(() => {
        setStatus("Tečajnica ažurirana.");
      })
      .catch(() => {
        setStatus("Greška prilikom ažuriranja.");
      });
  };

  const handleDelete = () => {
    if (confirm("Jeste li sigurni da želite izbrisati ovu tečajnicu?")) {
      axios.delete(`http://localhost:5039/rates/${id}`)
        .then(() => navigate("/"))
        .catch(() => setStatus("Greška prilikom brisanja."));
    }
  };

  if (!rate) return <div>Učitavanje...</div>;

  return (
    <div style={{ padding: "20px" }}>
      <h1>Uredi tečajnicu</h1>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxWidth: "400px" }}>
        <label>Datum primjene</label>
        <input name="date" value={form.date} onChange={handleChange} />

        <label>Šifra valute</label>
        <input name="currencyCode" value={form.currencyCode} onChange={handleChange} />

        <label>Valuta</label>
        <input name="currencyName" value={form.currencyName} onChange={handleChange} />

        <label>Kupovni tečaj</label>
        <input name="buyRate" type="number" step="any" value={form.buyRate} onChange={handleChange} />

        <label>Srednji tečaj</label>
        <input name="middleRate" type="number" step="any" value={form.middleRate} onChange={handleChange} />

        <label>Prodajni tečaj</label>
        <input name="sellRate" type="number" step="any" value={form.sellRate} onChange={handleChange} />

        <button onClick={handleUpdate}>Spremi izmjene</button>
        <button onClick={handleDelete} style={{ backgroundColor: "red", color: "white" }}>Izbriši</button>
        <p>{status}</p>
      </div>
    </div>
    

    
  );

  
}
