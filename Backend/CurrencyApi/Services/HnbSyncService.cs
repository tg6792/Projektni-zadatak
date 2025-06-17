using CurrencyApi.Data;
using CurrencyApi.Models;
using Microsoft.Extensions.Hosting;
using System.Globalization;
using System.Net.Http.Json;
using Cronos;

namespace CurrencyApi.Services
{
    public class HnbSyncService : BackgroundService
    {
        private readonly IServiceProvider _services;
        private readonly CronExpression _schedule = CronExpression.Parse("30 16 * * *"); // Runs at 16:30
        private DateTimeOffset? _nextRun;

        public HnbSyncService(IServiceProvider services)
        {
            _services = services;
            _nextRun = _schedule.GetNextOccurrence(DateTimeOffset.Now, TimeZoneInfo.Local);
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                var now = DateTimeOffset.Now;
                if (_nextRun.HasValue && now >= _nextRun.Value)
                {
                    await SyncFromHnbApi();
                    _nextRun = _schedule.GetNextOccurrence(DateTimeOffset.Now, TimeZoneInfo.Local);
                }

                await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken); 
            }
        }

        public async Task SyncFromHnbApiForToday()
        {
            await SyncFromHnbApi();
        }

        private async Task SyncFromHnbApi()
        {
            using var scope = _services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<RatesDbContext>();
            var client = new HttpClient();

            var today = DateTime.Today.ToString("yyyy-MM-dd");
            var url = $"https://api.hnb.hr/tecajn-eur/v3?datum-primjene={today}";

            try
            {
                var hnbRates = await client.GetFromJsonAsync<List<HnbRateDto>>(url);
                if (hnbRates == null) return;

                foreach (var hnb in hnbRates)
                {
                    var date = DateTime.ParseExact(hnb.datum_primjene!, "yyyy-MM-dd", CultureInfo.InvariantCulture);

                    bool exists = db.ExchangeRates.Any(r =>
                        r.Date == date &&
                        r.CurrencyCode == hnb.sifra_valute &&
                        r.CurrencyName == hnb.valuta);

                    if (!exists)
                    {
                        db.ExchangeRates.Add(new ExchangeRate
                        {
                            Date = date,
                            CurrencyCode = hnb.sifra_valute!,
                            CurrencyName = hnb.valuta!,
                            BuyRate = ParseDecimal(hnb.kupovni_tecaj!),
                            MiddleRate = ParseDecimal(hnb.srednji_tecaj!),
                            SellRate = ParseDecimal(hnb.prodajni_tecaj!)
                        });
                    }
                }

                await db.SaveChangesAsync();
                Console.WriteLine($"✔ Synced rates for {today}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Failed to sync HNB rates: {ex.Message}");
            }
        }

       public async Task SyncLast30Days()
{
    using var scope = _services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<RatesDbContext>();
    var client = new HttpClient();

    var from = DateTime.Today.AddDays(-30).ToString("yyyy-MM-dd");
    var to = DateTime.Today.ToString("yyyy-MM-dd");

    var url = $"https://api.hnb.hr/tecajn-eur/v3?datum-primjene-od={from}&datum-primjene-do={to}";
    Console.WriteLine($"➡ Fetching range: {url}");

    try
    {
        var hnbRates = await client.GetFromJsonAsync<List<HnbRateDto>>(url);
        if (hnbRates == null || hnbRates.Count == 0)
        {
            Console.WriteLine("⚠ No rates received.");
            return;
        }

        Console.WriteLine($"📦 Received {hnbRates.Count} exchange rate entries.");

        foreach (var hnb in hnbRates)
        {
            var parsedDate = DateTime.ParseExact(hnb.datum_primjene!, "yyyy-MM-dd", CultureInfo.InvariantCulture);

            bool exists = db.ExchangeRates.Any(r =>
                r.Date == parsedDate &&
                r.CurrencyCode == hnb.sifra_valute &&
                r.CurrencyName == hnb.valuta);

            if (!exists)
            {
                db.ExchangeRates.Add(new ExchangeRate
                {
                    Date = parsedDate,
                    CurrencyCode = hnb.sifra_valute!,
                    CurrencyName = hnb.valuta!,
                    BuyRate = ParseDecimal(hnb.kupovni_tecaj!),
                    MiddleRate = ParseDecimal(hnb.srednji_tecaj!),
                    SellRate = ParseDecimal(hnb.prodajni_tecaj!)
                });
            }
        }

        await db.SaveChangesAsync();
        Console.WriteLine("✔ Synced all available rates in range.");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"❌ Error during sync: {ex.Message}");
    }
}





        private decimal ParseDecimal(string input)
        {
            return decimal.Parse(input.Replace(",", "."), CultureInfo.InvariantCulture);
        }

        private class HnbRateDto
        {
            public string? broj_tecajnice { get; set; }
            public string? datum_primjene { get; set; }
            public string? drzava { get; set; }
            public string? drzava_iso { get; set; }
            public string? kupovni_tecaj { get; set; }
            public string? prodajni_tecaj { get; set; }
            public string? sifra_valute { get; set; }
            public string? srednji_tecaj { get; set; }
            public string? valuta { get; set; }
        }
    }
}
