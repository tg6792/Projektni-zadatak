using CurrencyApi.Data;
using CurrencyApi.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Globalization;


namespace CurrencyApi.Controllers
{
    [ApiController]
    [Route("rates")]
    public class RatesController : ControllerBase
    {
        private readonly RatesDbContext _context;

        public RatesController(RatesDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetRates(
            [FromQuery] string? currencyCode,
            [FromQuery] string? currencyName,
            [FromQuery] DateTime? fromDate,
            [FromQuery] DateTime? toDate,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string sort = "desc"
        )
        {
            var query = _context.ExchangeRates.AsQueryable();

            // Filtering
            if (!string.IsNullOrEmpty(currencyCode))
                query = query.Where(r => r.CurrencyCode == currencyCode);

            if (!string.IsNullOrEmpty(currencyName))
                query = query.Where(r => r.CurrencyName == currencyName);

            if (fromDate.HasValue && toDate.HasValue)
                query = query.Where(r => r.Date >= fromDate && r.Date <= toDate);
            else if (fromDate.HasValue)
                query = query.Where(r => r.Date >= fromDate);
            else if (toDate.HasValue)
                query = query.Where(r => r.Date <= toDate);

            // Sorting
            query = sort.ToLower() == "asc"
                ? query.OrderBy(r => r.Date)
                : query.OrderByDescending(r => r.Date);

            // Pagination
            var total = await query.CountAsync();
            var results = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            if (results.Count == 0)
            {
                return Ok(new
                {
                    status = "No exchange rates found.",
                    data = new List<ExchangeRate>()
                });
            }

            return Ok(new
            {
                status = "No error",
                total,
                page,
                pageSize,
                data = results.Select(r => new
                {
                    id = r.Id,
                    date = r.Date.ToString("dd.MM.yyyy."),
                    r.CurrencyCode,
                    r.CurrencyName,
                    r.BuyRate,
                    r.MiddleRate,
                    r.SellRate
                })
            });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetRateById(int id)
        {
            var rate = await _context.ExchangeRates.FindAsync(id);

            if (rate == null)
            {
                return NotFound(new
                {
                    status = $"Exchange rate with ID {id} not found."
                });
            }

            return Ok(new
            {
                status = "No error",
                data = new
                {
                    date = rate.Date.ToString("dd.MM.yyyy."),
                    rate.CurrencyCode,
                    rate.CurrencyName,
                    rate.BuyRate,
                    rate.MiddleRate,
                    rate.SellRate
                }
            });
        }

        [HttpPost]
        public async Task<IActionResult> CreateRate([FromBody] ExchangeRateCreateDto dto)
        {
            if (!DateTime.TryParseExact(dto.Date, "dd.MM.yyyy.", CultureInfo.InvariantCulture, DateTimeStyles.None, out DateTime parsedDate))
            {
                return BadRequest(new { status = "Invalid date format. Use dd.MM.yyyy." });
            }

            bool exists = await _context.ExchangeRates.AnyAsync(r =>
                r.Date.Date == parsedDate &&
                r.CurrencyCode == dto.CurrencyCode &&
                r.CurrencyName == dto.CurrencyName);

            if (exists)
            {
                return Conflict(new { status = "Exchange rate already exists for this date and currency." });
            }

            var newRate = new ExchangeRate
            {
                Date = parsedDate,
                CurrencyCode = dto.CurrencyCode,
                CurrencyName = dto.CurrencyName,
                BuyRate = dto.BuyRate,
                MiddleRate = dto.MiddleRate,
                SellRate = dto.SellRate
            };

            _context.ExchangeRates.Add(newRate);
            await _context.SaveChangesAsync();

            return Ok(new { status = "No error", id = newRate.Id });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateRate(int id, [FromBody] ExchangeRateCreateDto dto)
        {
            if (!DateTime.TryParseExact(dto.Date, "dd.MM.yyyy.", CultureInfo.InvariantCulture, DateTimeStyles.None, out DateTime parsedDate))
            {
                return BadRequest(new { status = "Invalid date format. Use dd.MM.yyyy." });
            }

            var rate = await _context.ExchangeRates.FindAsync(id);
            if (rate == null)
            {
                return NotFound(new { status = $"Exchange rate with ID {id} not found." });
            }

            // // Check for duplicate (but skip self)
            // bool duplicate = await _context.ExchangeRates.AnyAsync(r =>
            //     r.Id != id &&
            //     r.Date.Date == parsedDate &&
            //     r.CurrencyCode == dto.CurrencyCode &&
            //     r.CurrencyName == dto.CurrencyName); 

            // if (duplicate)
            // {
            //     return Conflict(new { status = "Another exchange rate already exists for this date and currency." });
            // }

            
            rate.Date = parsedDate;
            rate.CurrencyCode = dto.CurrencyCode;
            rate.CurrencyName = dto.CurrencyName;
            rate.BuyRate = dto.BuyRate;
            rate.MiddleRate = dto.MiddleRate;
            rate.SellRate = dto.SellRate;

            await _context.SaveChangesAsync();

            return Ok(new { status = "No error" });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteRate(int id)
        {
            var rate = await _context.ExchangeRates.FindAsync(id);
            if (rate == null)
                return NotFound(new { status = $"Rate with ID {id} not found." });

            _context.ExchangeRates.Remove(rate);
            await _context.SaveChangesAsync();

            return Ok(new { status = "Deleted successfully" });
        }




    }
}
