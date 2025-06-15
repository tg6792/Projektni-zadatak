import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { Typography, Select, MenuItem, FormControl, InputLabel, Paper, Grid, Box, CircularProgress } from '@mui/material';

export default function TrendChart() {
  const [rates, setRates] = useState([]);
  const [base, setBase] = useState("USD");
  const [target, setTarget] = useState("EUR");
  const [range, setRange] = useState("7");
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    axios.get(
      "http://localhost:5039/rates",
      { params: { page: 1, pageSize: 1000 } } // Fetch a large enough set for trend analysis
    )
      .then(res => {
        setRates(res.data.data);
        // console.log("Rates loaded:", res.data.data.length);
        // console.log("Sample rates:", res.data.data.slice(0, 5));
        // console.log("Available dates:", [...new Set(res.data.data.map(r => r.date))]);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching rates:", err);
        setError("Failed to load rates data.");
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!rates.length) return;

    const today = new Date();
    const from = new Date(today);
    from.setDate(today.getDate() - parseInt(range));

    const pad = n => (n < 10 ? "0" + n : n);
    // Ensure this date format matches your backend's date format
    // Example: If backend is YYYY-MM-DD
    // const formatDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    // Example: If backend is DD.MM.YYYY.
    const formatDate = (d) => `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}.`;


    const dates = [];
    for (let d = new Date(from); d <= today; d.setDate(d.getDate() + 1)) {
      dates.push(formatDate(new Date(d)));
    }

    // console.log("Generated date range for chart:", dates);
    const filtered = rates.filter(r =>
      dates.includes(r.date) && [base, target].includes(r.currencyName)
    );
    // console.log("Filtered count for chart:", filtered.length);
    // console.log("Sample filtered for chart:", filtered.slice(0, 5));

    const result = [];
    for (let d of dates) {
      const baseRateEntry = filtered.find(r => r.date === d && r.currencyName === base);
      const targetRateEntry = filtered.find(r => r.date === d && r.currencyName === target);

      if (baseRateEntry && targetRateEntry && baseRateEntry.middleRate && targetRateEntry.middleRate) {
        const baseRate = parseFloat(String(baseRateEntry.middleRate).replace(',', '.'));
        const targetRate = parseFloat(String(targetRateEntry.middleRate).replace(',', '.'));
        if (targetRate !== 0) { // Avoid division by zero
            result.push({
              date: d.substring(0, 5), // Shorten date for display: DD.MM
              rate: (baseRate / targetRate).toFixed(4)
            });
        }
      }
    }
    // console.log("Chart data:", result);
    setChartData(result);
  }, [rates, base, target, range]);

  const currencyOptions = [...new Set(rates.map(r => r.currencyName))].sort();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="70vh">
        <CircularProgress />
        <Typography sx={{marginLeft: 2}}>Loading chart data...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Paper elevation={3} sx={{ padding: "20px", margin: "20px", textAlign: 'center' }}>
        <Typography variant="h6" color="error">{error}</Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={3} sx={{ padding: "24px", margin: "20px 0" }}>
      <Typography variant="h5" component="h2" gutterBottom sx={{ marginBottom: "24px" }}>
        Kretanje vrijednosti valute
      </Typography>

      <Grid container spacing={3} alignItems="flex-end" sx={{ marginBottom: "32px" }}>
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth>
            <InputLabel id="base-currency-label">Osnovna valuta</InputLabel>
            <Select
              labelId="base-currency-label"
              value={base}
              label="Osnovna valuta"
              onChange={e => setBase(e.target.value)}
            >
              {currencyOptions.map((c) => <MenuItem key={`base-${c}`} value={c}>{c}</MenuItem>)}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth>
            <InputLabel id="target-currency-label">U odnosu na</InputLabel>
            <Select
              labelId="target-currency-label"
              value={target}
              label="U odnosu na"
              onChange={e => setTarget(e.target.value)}
            >
              {currencyOptions.map((c) => <MenuItem key={`target-${c}`} value={c}>{c}</MenuItem>)}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth>
            <InputLabel id="range-label">Raspon</InputLabel>
            <Select
              labelId="range-label"
              value={range}
              label="Raspon"
              onChange={e => setRange(e.target.value)}
            >
              <MenuItem value="7">Zadnjih 7 dana</MenuItem>
              <MenuItem value="15">Zadnjih 15 dana</MenuItem>
              <MenuItem value="30">Zadnjih 30 dana</MenuItem>
              
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {chartData.length > 0 ? (
        <Box sx={{ width: "100%", height: 400 }}>
          <ResponsiveContainer>
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={['auto', 'auto']} tickFormatter={(tick) => parseFloat(tick).toFixed(4)} />
              <Tooltip formatter={(value) => parseFloat(value).toFixed(4)} />
              <Line type="monotone" dataKey="rate" stroke="#8884d8" strokeWidth={2} activeDot={{ r: 8 }} dot={{r: 3}}/>
            </LineChart>
          </ResponsiveContainer>
        </Box>
      ) : (
        <Typography sx={{textAlign: 'center', marginTop: 4}}>
          Nema dostupnih podataka za prikaz grafa s odabranim parametrima. Molimo provjerite formate datuma ili raspoloživost tečaja.
        </Typography>
      )}
    </Paper>
  );
}