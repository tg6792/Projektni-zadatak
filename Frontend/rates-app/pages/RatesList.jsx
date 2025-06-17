import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import {
  Container,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  CircularProgress,
  Alert,
  Box,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Tooltip
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import InfoIcon from '@mui/icons-material/Info';

// Debounce function
const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
};

export default function RatesList() {
  const [allRatesForUniqueCurrencies, setAllRatesForUniqueCurrencies] = useState([]); 
  const [displayedRates, setDisplayedRates] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0); 
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0); 

  const [filterDate, setFilterDate] = useState("");
  const [filterCurrency, setFilterCurrency] = useState("");
  const [uniqueCurrencies, setUniqueCurrencies] = useState([]);

  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const navigate = useNavigate();

  const fetchRates = useCallback((currentPage, currentRowsPerPage, dateFilter, currencyFilter) => {
    setLoading(true);
    setError("");

    const params = {
      page: currentPage + 1, 
      pageSize: currentRowsPerPage,
      sort: "desc", 
    };

    if (dateFilter) {
  
      params.fromDate = dateFilter;
      params.toDate = dateFilter;
    }
    if (currencyFilter) {
      params.currencyName = currencyFilter;
    }

    axios.get("http://localhost:5039/rates", { params })
      .then(res => {
        setDisplayedRates(res.data.data || []);
        setTotalCount(res.data.totalCount || 0);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching rates list:", err);
        setError("Failed to load rates list. Please try again later.");
        setDisplayedRates([]);
        setTotalCount(0);
        setLoading(false);
      });
  }, []); 


  useEffect(() => {
    axios.get("http://localhost:5039/rates", { params: { page: 1, pageSize: 5000 } }) 
      .then(res => {
        const ratesData = res.data.data || [];
        setAllRatesForUniqueCurrencies(ratesData); 
        const currencies = [...new Set(ratesData.map(rate => rate.currencyName))].sort();
        setUniqueCurrencies(currencies);
      })
      .catch(err => {
        console.error("Error fetching initial full list for currencies:", err);
       
      });
  }, []); 

  
  useEffect(() => {
    fetchRates(page, rowsPerPage, filterDate, filterCurrency);
  }, [page, rowsPerPage, filterDate, filterCurrency, fetchRates]);


  const debouncedFilterTrigger = useCallback(debounce(() => {
    setPage(0); 
    
  }, 500), []);


  const handleFilterDateChange = (e) => {
    setFilterDate(e.target.value);
    debouncedFilterTrigger();
  };

  const handleFilterCurrencyChange = (e) => {
    setFilterCurrency(e.target.value);
    debouncedFilterTrigger();
  };

  const handleApplyFilters = () => {
    setPage(0); 
    fetchRates(0, rowsPerPage, filterDate, filterCurrency); 
  };

  const clearFilters = () => {
    setFilterDate("");
    setFilterCurrency("");
    setPage(0); 
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const onCreate = (data) => {
    setCreateLoading(true);
    setCreateError("");
    setCreateSuccess("");
    const d = new Date(data.date);
    const pad = n => (n < 10 ? `0${n}` : n);
   
    const formattedDate = `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}.`;

    axios.post("http://localhost:5039/rates", {
      date: formattedDate,
      currencyCode: data.currencyCode,
      currencyName: data.currencyName,
      buyRate: Number(data.buyRate),
      middleRate: Number(data.middleRate),
      sellRate: Number(data.sellRate)
    })
      .then(res => {
        setCreateSuccess("Tečajnica uspješno kreirana!");
        reset();
        fetchRates(page, rowsPerPage, filterDate, filterCurrency);
        
       
        const newCurrencyName = res.data.data?.currencyName;
        if (newCurrencyName && !uniqueCurrencies.includes(newCurrencyName)) {
            setUniqueCurrencies(prev => [...new Set([...prev, newCurrencyName])].sort());
        }
      })
      .catch(err => {
        if (err.response && err.response.data && err.response.data.message) {
          setCreateError(err.response.data.message);
        } else if (err.response && err.response.data && err.response.data.errors) {
            
            const errorMessages = Object.values(err.response.data.errors).flat().join(' ');
            setCreateError(`Greška: ${errorMessages}`);
        }
        else {
          setCreateError("Greška prilikom kreiranja tečajnice.");
        }
      })
      .finally(() => setCreateLoading(false));
  };

  if (loading && displayedRates.length === 0 && page === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="70vh">
        <CircularProgress />
        <Typography sx={{ marginLeft: 2 }}>Loading rates...</Typography>
      </Box>
    );
  }

  if (error && displayedRates.length === 0) { 
    return (
      <Container sx={{ marginTop: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ marginTop: 4, marginBottom: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ textAlign: 'center', marginBottom: 3 }}>
        Tečajna Lista
      </Typography>

      <Paper elevation={2} sx={{ padding: 3, marginBottom: 3 }}>
        <Typography variant="h6" gutterBottom>Kreiranje tečajnice</Typography>
        <form onSubmit={handleSubmit(onCreate)}>
          <Grid container spacing={2}>
            <Grid xs={12} sm={6} md={3}> 
              <TextField
                fullWidth
                label="Datum primjene"
                type="date"
                InputLabelProps={{ shrink: true }}
                {...register("date", { required: "Obavezno polje" })}
                error={!!errors.date}
                helperText={errors.date?.message}
              />
            </Grid>
            <Grid xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                label="Šifra valute"
                {...register("currencyCode", { required: "Obavezno polje", maxLength: { value: 3, message: "Max 3 znaka" } })}
                error={!!errors.currencyCode}
                helperText={errors.currencyCode?.message}
              />
            </Grid>
            <Grid xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                label="Valuta"
                {...register("currencyName", { required: "Obavezno polje" })}
                error={!!errors.currencyName}
                helperText={errors.currencyName?.message}
              />
            </Grid>
            <Grid xs={6} sm={3} md={1}>
              <TextField
                fullWidth
                label="Kupovni"
                type="number"
                inputProps={{ step: "any" }}
                {...register("buyRate", { required: "Obavezno polje", valueAsNumber: true, min: {value: 0, message: "Ne može biti negativno"} })}
                error={!!errors.buyRate}
                helperText={errors.buyRate?.message}
              />
            </Grid>
            <Grid xs={6} sm={3} md={1}>
              <TextField
                fullWidth
                label="Srednji"
                type="number"
                inputProps={{ step: "any" }}
                {...register("middleRate", { required: "Obavezno polje", valueAsNumber: true, min: {value: 0, message: "Ne može biti negativno"} })}
                error={!!errors.middleRate}
                helperText={errors.middleRate?.message}
              />
            </Grid>
            <Grid xs={6} sm={3} md={1}>
              <TextField
                fullWidth
                label="Prodajni"
                type="number"
                inputProps={{ step: "any" }}
                {...register("sellRate", { required: "Obavezno polje", valueAsNumber: true, min: {value: 0, message: "Ne može biti negativno"} })}
                error={!!errors.sellRate}
                helperText={errors.sellRate?.message}
              />
            </Grid>
            <Grid xs={12} sm={3} md={2} sx={{ display: 'flex', alignItems: 'flex-end' }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                disabled={createLoading}
                fullWidth
              >
                {createLoading ? "Spremam..." : "Kreiraj"}
              </Button>
            </Grid>
            {createError && (
              <Grid xs={12}>
                <Alert severity="error" sx={{ marginTop: 2 }}>{createError}</Alert>
              </Grid>
            )}
            {createSuccess && (
              <Grid xs={12}>
                <Alert severity="success" sx={{ marginTop: 2 }}>{createSuccess}</Alert>
              </Grid>
            )}
          </Grid>
        </form>
      </Paper>

      <Paper elevation={2} sx={{ padding: 3, marginBottom: 3 }}>
        <Typography variant="h6" gutterBottom>Filteri</Typography>
        <Grid container spacing={2} alignItems="flex-end">
          <Grid xs={12} sm={5}>
            <TextField
              fullWidth
              label="Datum"
              type="date"
              value={filterDate}
              onChange={handleFilterDateChange}
              InputLabelProps={{ shrink: true }}
              variant="outlined"
              size="small"
            />
          </Grid>
          <Grid xs={12} sm={5}>
            <FormControl fullWidth variant="outlined" size="small">
              <InputLabel id="filter-currency-label">Valuta</InputLabel>
              <Select
                labelId="filter-currency-label"
                value={uniqueCurrencies.includes(filterCurrency) ? filterCurrency : ""}
                onChange={handleFilterCurrencyChange}
                label="Valuta"
              >
                <MenuItem value="">
                  <em>Sve valute</em>
                </MenuItem>
                {uniqueCurrencies.map(currency => (
                  <MenuItem key={currency} value={currency}>{currency}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid xs={12} sm={2}>
            <Button
              fullWidth
              variant="outlined" 
              onClick={clearFilters}
            >
              Očisti
            </Button>
          </Grid>
          
        </Grid>
      </Paper>

      <Paper elevation={3}>
        <TableContainer>
          <Table stickyHeader aria-label="rates table">
            <TableHead>
              <TableRow>
                <TableCell sx={{fontWeight: 'bold'}}>Datum</TableCell>
                <TableCell sx={{fontWeight: 'bold'}}>Šifra valute</TableCell>
                <TableCell sx={{fontWeight: 'bold'}}>Valuta</TableCell>
                <TableCell align="right" sx={{fontWeight: 'bold'}}>Kupovni</TableCell>
                <TableCell align="right" sx={{fontWeight: 'bold'}}>Srednji</TableCell>
                <TableCell align="right" sx={{fontWeight: 'bold'}}>Prodajni</TableCell>
                <TableCell align="center" sx={{fontWeight: 'bold'}}>Akcije</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && ( 
                <TableRow>
                    <TableCell colSpan={7} align="center">
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 2 }}>
                            <CircularProgress size={24} />
                            <Typography sx={{ marginLeft: 1 }}>Preuzimam...</Typography>
                        </Box>
                    </TableCell>
                </TableRow>
              )}
              {!loading && displayedRates.map((rate) => (
                rate && rate.id && ( 
                  <TableRow hover key={rate.id}>
                    <TableCell>{rate.date}</TableCell>
                    <TableCell>{rate.currencyCode}</TableCell>
                    <TableCell>{rate.currencyName}</TableCell>
                    <TableCell align="right">{rate.buyRate?.toFixed(4)}</TableCell>
                    <TableCell align="right">{rate.middleRate?.toFixed(4)}</TableCell>
                    <TableCell align="right">{rate.sellRate?.toFixed(4)}</TableCell>
                    <TableCell align="center">
                      <Tooltip title="Detalji tečaja">
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => navigate(`/rates/${rate.id}`)}
                          startIcon={<InfoIcon />}
                        >
                          Detalji
                        </Button>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                )
              ))}
              {!loading && displayedRates.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    Nema podataka za prikaz prema zadanim filterima.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Redaka po stranici:"
          labelDisplayedRows={({ from, to, count }) => {
            const fromValue = count === 0 ? 0 : page * rowsPerPage + 1;
            const toValue = Math.min((page + 1) * rowsPerPage, count);
            return `${fromValue}-${toValue} od ${count}`;
          }}
        />
      </Paper>
    </Container>
  );
}