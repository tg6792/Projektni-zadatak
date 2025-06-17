import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Container,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  Box,
  CircularProgress,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  
  const formatDateForBackend = (dateString) => {
    if (!dateString || !dateString.includes('-')) return dateString; 
    const [year, month, day] = dateString.split('-');
    return `${day}.${month}.${year}.`;
  };


  const formatDateForPicker = (dateString) => {
    if (!dateString || !dateString.includes('.')) return dateString; 
    const parts = dateString.split('.');
    if (parts.length < 3) return dateString; 
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  };


  useEffect(() => {
    setLoading(true);
    axios.get(`http://localhost:5039/rates/${id}`)
      .then(res => {
        const rateData = res.data.data;
        setRate(rateData);
        setForm({
          ...rateData,
          date: formatDateForPicker(rateData.date) 
        });
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching rate details:", err);
        setError("Ne mogu dohvatiti detalje tečaja.");
        setLoading(false);
      });
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prevForm => ({
      ...prevForm,
      [name]: name.endsWith("Rate") || name === "unitValue" ? (value === "" ? "" : Number(value)) : value
    }));
  };

  const handleUpdate = () => {
    if (!form.date || !form.currencyCode || !form.currencyName) {
        setError("Datum, šifra valute i naziv valute su obavezni.");
        setSuccess("");
        return;
    }
    setIsSubmitting(true);
    setError("");
    setSuccess("");

    const payload = {
      ...form,
      date: formatDateForBackend(form.date) 
    };

    axios.put(`http://localhost:5039/rates/${id}`, payload)
      .then(() => {
        setSuccess("Tečaj uspješno ažuriran.");
        setIsSubmitting(false);
        
        setRate(payload); 
      })
      .catch((err) => {
        console.error("Error updating rate:", err);
        setError("Greška prilikom ažuriranja tečaja. Provjerite konzolu za detalje.");
        setIsSubmitting(false);
      });
  };

  const handleDelete = () => {
    setOpenDeleteDialog(false); 
    setIsSubmitting(true);
    setError("");
    setSuccess("");
    axios.delete(`http://localhost:5039/rates/${id}`)
      .then(() => {
        setSuccess("Tečaj uspješno izbrisan. Preusmjeravam...");
        setTimeout(() => navigate("/"), 2000); 
      })
      .catch((err) => {
        console.error("Error deleting rate:", err);
        setError("Greška prilikom brisanja tečaja.");
        setIsSubmitting(false);
      });
  };

  const handleClickOpenDeleteDialog = () => {
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="70vh">
        <CircularProgress />
        <Typography sx={{ marginLeft: 2 }}>Učitavanje detalja tečaja...</Typography>
      </Box>
    );
  }

  if (!rate && !loading) {
    return (
      <Container sx={{ marginTop: 4 }}>
        <Alert severity="warning">Tečaj nije pronađen ili je došlo do greške.</Alert>
        <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/")}
            sx={{ marginTop: 2 }}
        >
            Natrag na listu
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ padding: { xs: 2, sm: 3, md: 4 }, marginTop: 4, marginBottom: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ textAlign: 'center', marginBottom: 3 }}>
          Uredi Tečaj
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Datum primjene"
              name="date"
              type="date" 
              value={form.date}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
              variant="outlined"
              disabled={isSubmitting}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Šifra valute"
              name="currencyCode"
              value={form.currencyCode}
              onChange={handleChange}
              variant="outlined"
              disabled={isSubmitting}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Naziv valute"
              name="currencyName"
              value={form.currencyName}
              onChange={handleChange}
              variant="outlined"
              disabled={isSubmitting}
            />
          </Grid>
           
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Kupovni tečaj"
              name="buyRate"
              type="number"
              value={form.buyRate}
              onChange={handleChange}
              variant="outlined"
              InputProps={{ step: "any" }}
              disabled={isSubmitting}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Srednji tečaj"
              name="middleRate"
              type="number"
              value={form.middleRate}
              onChange={handleChange}
              variant="outlined"
              InputProps={{ step: "any" }}
              disabled={isSubmitting}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Prodajni tečaj"
              name="sellRate"
              type="number"
              value={form.sellRate}
              onChange={handleChange}
              variant="outlined"
              InputProps={{ step: "any" }}
              disabled={isSubmitting}
            />
          </Grid>

          {error && (
            <Grid item xs={12}>
              <Alert severity="error">{error}</Alert>
            </Grid>
          )}
          {success && (
            <Grid item xs={12}>
              <Alert severity="success">{success}</Alert>
            </Grid>
          )}

          <Grid item xs={12} container spacing={2} justifyContent="flex-end" sx={{ marginTop: 2 }}>
            <Grid item>
                <Button
                    variant="outlined"
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate("/")}
                    disabled={isSubmitting}
                >
                    Odustani
                </Button>
            </Grid>
            <Grid item>
              <Button
                variant="contained"
                color="primary"
                startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                onClick={handleUpdate}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Spremam..." : "Spremi izmjene"}
              </Button>
            </Grid>
            <Grid item>
              <Button
                variant="contained"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleClickOpenDeleteDialog}
                disabled={isSubmitting}
              >
                Izbriši
              </Button>
            </Grid>
          </Grid>
        </Grid>
      </Paper>

      <Dialog
        open={openDeleteDialog}
        onClose={handleCloseDeleteDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">Potvrda brisanja</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Jeste li sigurni da želite trajno izbrisati ovaj tečaj? Ova akcija se ne može poništiti.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} color="primary" disabled={isSubmitting}>
            Odustani
          </Button>
          <Button onClick={handleDelete} color="error" autoFocus disabled={isSubmitting}>
            {isSubmitting ? <CircularProgress size={20} /> : "Izbriši"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}