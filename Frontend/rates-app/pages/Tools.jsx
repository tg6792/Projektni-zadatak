import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Container,
  Paper,
  Typography,
  Grid,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Box,
  CircularProgress,
  Alert
} from '@mui/material';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz'; // Icon for the button

export default function Tools() {
  const [allRates, setAllRates] = useState([]);
  const [date, setDate] = useState(""); // YYYY-MM-DD format for date input
  const [amount, setAmount] = useState(1);
  const [fromCurrency, setFromCurrency] = useState("USD");
  const [toCurrency, setToCurrency] = useState("EUR");
  const [rateType, setRateType] = useState("middleRate");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    axios
      .get("http://localhost:5039/rates", { params: { page: 1, pageSize: 1000 } }) // Fetch more rates if needed
      .then(res => {
        setAllRates(res.data.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching rates:", err);
        setError("Failed to load currency rates. Please try again later.");
        setLoading(false);
      });
  }, []);

  const getFormattedDateForFiltering = (inputDate) => {
    const d = inputDate ? new Date(inputDate) : new Date();
    // Adjust for timezone offset to ensure the selected date is used correctly
    const userTimezoneOffset = d.getTimezoneOffset() * 60000;
    const correctedDate = new Date(d.getTime() - userTimezoneOffset);

    const pad = (n) => (n < 10 ? `0${n}` : n);
    // Backend expects DD.MM.YYYY.
    return `${pad(correctedDate.getDate())}.${pad(correctedDate.getMonth() + 1)}.${correctedDate.getFullYear()}.`;
  };


  const convert = () => {
    setCalculating(true);
    setError("");
    setResult(null);

    if (!amount || !fromCurrency || !toCurrency || !rateType) {
      setError("Sva polja moraju biti ispunjena.");
      setCalculating(false);
      return;
    }
    if (amount <= 0) {
      setError("Iznos mora biti pozitivan broj.");
      setCalculating(false);
      return;
    }

    const filterDate = getFormattedDateForFiltering(date);
    const ratesForDate = allRates.filter(r => r.date.trim() === filterDate.trim());

    if (ratesForDate.length === 0) {
      setError(`Nema dostupnih tečajeva za datum ${date ? new Date(date).toLocaleDateString() : 'danas'}.`);
      setCalculating(false);
      return;
    }

    const sourceRateData = ratesForDate.find(r => r.currencyName === fromCurrency);
    const targetRateData = ratesForDate.find(r => r.currencyName === toCurrency);

    if (!sourceRateData || !targetRateData) {
      setError("Jedna od odabranih valuta nije dostupna za odabrani datum.");
      setCalculating(false);
      return;
    }

    const sourceRate = parseFloat(String(sourceRateData[rateType]).replace(',', '.'));
    const targetRate = parseFloat(String(targetRateData[rateType]).replace(',', '.'));

    if (isNaN(sourceRate) || isNaN(targetRate) || targetRate === 0) {
      setError("Neispravni tečajevi za odabrane valute ili vrstu tečaja.");
      setCalculating(false);
      return;
    }

    const value = (parseFloat(amount) * sourceRate) / targetRate;
    setResult(`${amount} ${fromCurrency} = ${value.toFixed(4)} ${toCurrency}`);
    setCalculating(false);
  };

  const uniqueCurrencyOptions = loading ? [] : [...new Set(allRates.map(r => r.currencyName))].sort();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="70vh">
        <CircularProgress />
        <Typography sx={{ marginLeft: 2 }}>Loading currency data...</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ padding: { xs: 2, sm: 3, md: 4 }, marginTop: 4, marginBottom: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ textAlign: 'center', marginBottom: 3 }}>
          Kalkulator za konverziju valuta
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Iznos"
              type="number"
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              variant="outlined"
              InputProps={{ inputProps: { min: 0.01, step: "any" } }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Datum (opcionalno, danas po defaultu)"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth variant="outlined">
              <InputLabel id="from-currency-label">Iz valute</InputLabel>
              <Select
                labelId="from-currency-label"
                value={fromCurrency}
                onChange={(e) => setFromCurrency(e.target.value)}
                label="Iz valute"
              >
                {uniqueCurrencyOptions.map((currency) => (
                  <MenuItem key={`from-${currency}`} value={currency}>
                    {currency}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth variant="outlined">
              <InputLabel id="to-currency-label">U valutu</InputLabel>
              <Select
                labelId="to-currency-label"
                value={toCurrency}
                onChange={(e) => setToCurrency(e.target.value)}
                label="U valutu"
              >
                {uniqueCurrencyOptions.map((currency) => (
                  <MenuItem key={`to-${currency}`} value={currency}>
                    {currency}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth variant="outlined">
              <InputLabel id="rate-type-label">Vrsta tečaja</InputLabel>
              <Select
                labelId="rate-type-label"
                value={rateType}
                onChange={(e) => setRateType(e.target.value)}
                label="Vrsta tečaja"
              >
                <MenuItem value="buyRate">Kupovni (Banka kupuje devizu)</MenuItem>
                <MenuItem value="middleRate">Srednji</MenuItem>
                <MenuItem value="sellRate">Prodajni (Banka prodaje devizu)</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sx={{ textAlign: 'center', marginTop: 2 }}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={convert}
              disabled={calculating}
              startIcon={calculating ? <CircularProgress size={20} color="inherit" /> : <SwapHorizIcon />}
            >
              {calculating ? "Računam..." : "Konvertiraj"}
            </Button>
          </Grid>
        </Grid>

        {error && (
          <Alert severity="error" sx={{ marginTop: 3 }}>
            {error}
          </Alert>
        )}

        {result && (
          <Paper elevation={1} sx={{ padding: 2, marginTop: 3, backgroundColor: 'success.light' }}>
            <Typography variant="h6" sx={{ textAlign: 'center', color: 'success.contrastText' }}>
              Rezultat: {result}
            </Typography>
          </Paper>
        )}
      </Paper>
    </Container>
  );
}