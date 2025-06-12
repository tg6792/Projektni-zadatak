namespace CurrencyApi.Models
{
    public class ExchangeRateCreateDto
    {
        public string Date { get; set; } = string.Empty; // dd.MM.yyyy.
        public string CurrencyCode { get; set; } = string.Empty;
        public string CurrencyName { get; set; } = string.Empty;
        public decimal BuyRate { get; set; }
        public decimal MiddleRate { get; set; }
        public decimal SellRate { get; set; }
    }
}
