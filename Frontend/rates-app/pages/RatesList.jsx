import { useEffect, useState } from 'react';
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
import { useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import InfoIcon from '@mui/icons-material/Info';

export default function RatesList() {
  const [allRates, setAllRates] = useState([]);
  const [filteredRates, setFilteredRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [filterDate, setFilterDate] = useState(""); // YYYY-MM-DD for TextField type="date"
  const [filterCurrency, setFilterCurrency] = useState("");
  const [uniqueCurrencies, setUniqueCurrencies] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    axios.get("http://localhost:5039/rates", { params: { page: 1, pageSize: 2000 } }) // Fetch a larger set for client-side filtering/pagination
      .then(res => {
        const ratesData = res.data.data;
        setAllRates(ratesData);
        setFilteredRates(ratesData); // Initially, show all rates
        const currencies = [...new Set(ratesData.map(rate => rate.currencyName))].sort();
        setUniqueCurrencies(currencies);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching rates list:", err);
        setError("Failed to load rates list. Please try again later.");
        setLoading(false);
      });
  }, []);

  const handleFilter = () => {
    let tempRates = [...allRates];

    if (filterDate) {
      // Backend date format is DD.MM.YYYY.
      const d = new Date(filterDate);
      const userTimezoneOffset = d.getTimezoneOffset() * 60000;
      const correctedDate = new Date(d.getTime() - userTimezoneOffset);
      const pad = (n) => (n < 10 ? `0${n}` : n);
      const formattedFilterDate = `${pad(correctedDate.getDate())}.${pad(correctedDate.getMonth() + 1)}.${correctedDate.getFullYear()}.`;
      tempRates = tempRates.filter(rate => rate.date.trim() === formattedFilterDate.trim());
    }

    if (filterCurrency) {
      tempRates = tempRates.filter(rate => rate.currencyName === filterCurrency);
    }

    setFilteredRates(tempRates);
    setPage(0); // Reset to first page after filtering
  };

  const clearFilters = () => {
    setFilterDate("");
    setFilterCurrency("");
    setFilteredRates(allRates);
    setPage(0);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="70vh">
        <CircularProgress />
        <Typography sx={{ marginLeft: 2 }}>Loading rates...</Typography>
      </Box>
    );
  }

  if (error) {
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
        <Typography variant="h6" gutterBottom>Filteri</Typography>
        <Grid container spacing={2} alignItems="flex-end">
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Datum"
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              variant="outlined"
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth variant="outlined" size="small">
              <InputLabel id="filter-currency-label">Valuta</InputLabel>
              <Select
                labelId="filter-currency-label"
                value={filterCurrency}
                onChange={(e) => setFilterCurrency(e.target.value)}
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
          <Grid item xs={12} sm={2}>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              onClick={handleFilter}
              startIcon={<SearchIcon />}
            >
              Traži
            </Button>
          </Grid>
          <Grid item xs={12} sm={2}>
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
                <TableCell sx={{fontWeight: 'bold'}}>Valuta</TableCell>
                <TableCell sx={{fontWeight: 'bold'}}>Jedinica</TableCell>
                <TableCell align="right" sx={{fontWeight: 'bold'}}>Kupovni</TableCell>
                <TableCell align="right" sx={{fontWeight: 'bold'}}>Srednji</TableCell>
                <TableCell align="right" sx={{fontWeight: 'bold'}}>Prodajni</TableCell>
                <TableCell align="center" sx={{fontWeight: 'bold'}}>Akcije</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRates.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((rate) => (
                <TableRow hover key={rate.id}>
                  <TableCell>{rate.date}</TableCell>
                  <TableCell>{rate.currencyName}</TableCell>
                  <TableCell>{rate.unitValue}</TableCell>
                  <TableCell align="right">{rate.buyRate}</TableCell>
                  <TableCell align="right">{rate.middleRate}</TableCell>
                  <TableCell align="right">{rate.sellRate}</TableCell>
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
              ))}
              {filteredRates.length === 0 && !loading && (
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
          count={filteredRates.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Redaka po stranici:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} od ${count}`}
        />
      </Paper>
    </Container>
  );
}