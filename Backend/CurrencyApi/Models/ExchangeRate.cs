using System;
using System.ComponentModel.DataAnnotations;

namespace CurrencyApi.Models
{
    public class ExchangeRate
    {
        public int Id { get; set; }

        [Required]
        public DateTime Date { get; set; }

        [Required]
        public string CurrencyCode { get; set; } = string.Empty;

        [Required]
        public string CurrencyName { get; set; } = string.Empty;

        [Required]
        public decimal BuyRate { get; set; }

        [Required]
        public decimal MiddleRate { get; set; }

        [Required]
        public decimal SellRate { get; set; }
    }
}
