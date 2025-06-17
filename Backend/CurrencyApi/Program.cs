using CurrencyApi.Data;
using Microsoft.EntityFrameworkCore;
using CurrencyApi.Services;


var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend",
        policy => policy
            .WithOrigins("http://localhost:5173") 
            .AllowAnyHeader()
            .AllowAnyMethod());
});


builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddDbContext<RatesDbContext>(options =>
    options.UseSqlite("Data Source=exchangeRates.db"));
builder.Services.AddHostedService<HnbSyncService>();


var app = builder.Build();

// Use CORS
app.UseCors("AllowFrontend");

// Configure middleware
app.UseSwagger();
app.UseSwaggerUI();

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();



using (var scope = app.Services.CreateScope())
{
    var sync = new HnbSyncService(scope.ServiceProvider);
    await sync.SyncLast30Days(); 
}


app.Run();
