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
  const [currencyOptions, setCurrencyOptions] = useState([]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    axios.get(
      "http://localhost:5039/rates",
      { params: { page: 1, pageSize: 1000 } }
    )
      .then(res => {
        const fetchedRates = res.data.data || [];
        setRates(fetchedRates);
        const options = [...new Set(fetchedRates.map(r => r.currencyName))].sort();
        setCurrencyOptions(options);

        if (options.length > 0) {
          if (!options.includes("USD")) {
            setBase(options[0]);
          } else {
            setBase("USD");
          }
          if (!options.includes("EUR")) {
            setTarget(options.length > 1 ? options[1] : options[0]);
          } else {
            setTarget("EUR");
          }
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching rates:", err);
        setError("Failed to load rates data.");
        setCurrencyOptions([]);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!rates.length || !base || !target || currencyOptions.length === 0) {
      setChartData([]);
      return;
    }
    
    if (!currencyOptions.includes(base) || !currencyOptions.includes(target)) {
        setChartData([]);
        return;
    }

    const today = new Date();
    const fromDate = new Date(today);
    fromDate.setDate(today.getDate() - parseInt(range));

    const pad = n => (n < 10 ? "0" + n : n);
    const formatDateForCompare = (d) => `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}.`;
    
    const formatDateForDisplay = (dateString) => {
        const parts = dateString.split('.');
        if (parts.length === 3) {
            return `${parts[0]}.${parts[1]}`;
        }
        return dateString;
    };


    const datesInRange = [];
    for (let d = new Date(fromDate); d <= today; d.setDate(d.getDate() + 1)) {
      datesInRange.push(formatDateForCompare(new Date(d)));
    }

    const result = [];
    for (let d of datesInRange) {
      const baseRateEntry = rates.find(r => r.date === d && r.currencyName === base);
      const targetRateEntry = rates.find(r => r.date === d && r.currencyName === target);

      if (baseRateEntry && targetRateEntry && baseRateEntry.middleRate && targetRateEntry.middleRate) {
        const baseRateValue = parseFloat(String(baseRateEntry.middleRate).replace(',', '.'));
        const targetRateValue = parseFloat(String(targetRateEntry.middleRate).replace(',', '.'));
        if (targetRateValue !== 0 && !isNaN(baseRateValue) && !isNaN(targetRateValue)) {
            result.push({
              date: formatDateForDisplay(d),
              rate: parseFloat((baseRateValue / targetRateValue).toFixed(4))
            });
        }
      }
    }
    setChartData(result);
  }, [rates, base, target, range, currencyOptions]);


  if (loading && currencyOptions.length === 0) {
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
        <Grid xs={12} sm={6} md={3}>
          <FormControl fullWidth>
            <InputLabel id="base-currency-label">Osnovna valuta</InputLabel>
            <Select
              labelId="base-currency-label"
              value={currencyOptions.includes(base) ? base : ""}
              label="Osnovna valuta"
              onChange={e => setBase(e.target.value)}
            >
              {currencyOptions.map((c) => <MenuItem key={`base-${c}`} value={c}>{c}</MenuItem>)}
            </Select>
          </FormControl>
        </Grid>

        <Grid xs={12} sm={6} md={3}>
          <FormControl fullWidth>
            <InputLabel id="target-currency-label">U odnosu na</InputLabel>
            <Select
              labelId="target-currency-label"
              value={currencyOptions.includes(target) ? target : ""}
              label="U odnosu na"
              onChange={e => setTarget(e.target.value)}
            >
              {currencyOptions.map((c) => <MenuItem key={`target-${c}`} value={c}>{c}</MenuItem>)}
            </Select>
          </FormControl>
        </Grid>

        <Grid xs={12} sm={6} md={3}>
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
              <YAxis 
                domain={['auto', 'auto']} 
                tickFormatter={(tick) => typeof tick === 'number' ? tick.toFixed(4) : String(tick)} 
              />
              <Tooltip 
                formatter={(value) => typeof value === 'number' ? value.toFixed(4) : String(value)} 
              />
              <Line type="monotone" dataKey="rate" stroke="#8884d8" strokeWidth={2} activeDot={{ r: 8 }} dot={{r: 3}}/>
            </LineChart>
          </ResponsiveContainer>
        </Box>
      ) : (
        <Typography sx={{textAlign: 'center', marginTop: 4}}>
          Nema dostupnih podataka za prikaz grafa s odabranim parametrima. Molimo provjerite valute ili raspon.
        </Typography>
      )}
    </Paper>
  );
}