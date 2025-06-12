using Microsoft.EntityFrameworkCore;
using CurrencyApi.Models;

namespace CurrencyApi.Data
{
    public class RatesDbContext : DbContext
    {
        public RatesDbContext(DbContextOptions<RatesDbContext> options) : base(options) {}

        public DbSet<ExchangeRate> ExchangeRates { get; set; }
    }
}
