import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Instrument {
  symbol: string;
  price: number;
  volume: number;
  high: number;
  low: number;
  changePercent: number;
  exchangeTime: number;
}

@Component({
  selector: 'app-crypto-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './crypto-table.component.html',
  styleUrls: ['./crypto-table.component.scss'],
})
export class CryptoTableComponent implements OnInit {
  instruments: Instrument[] = [];
  filteredInstruments: Instrument[] = [];
  loading = false;
  sortAsc = true;
  filterText = '';
  private apiUrl = 'https://api.binance.com/api/v3/ticker/24hr';

  constructor(private http: HttpClient) {}

  currentDate = new Date();

  ngOnInit(): void {
    this.fetchInstruments();
  }

  fetchInstruments(): void {
    this.loading = true;
    this.http.get<any[]>(this.apiUrl).subscribe({
      next: (data) => {
        const limitedData = data.slice(0, 1000);
        this.instruments = limitedData.map((item) => ({
          symbol: item.symbol,
          price: parseFloat(item.lastPrice),
          volume: parseFloat(item.volume),
          high: parseFloat(item.highPrice),
          low: parseFloat(item.lowPrice),
          changePercent: parseFloat(item.priceChangePercent),
          exchangeTime: item.closeTime,
        }));
        this.filteredInstruments = [...this.instruments];
        this.loading = false;
      },
      error: () => {
        console.error('Ошибка загрузки данных');
        this.loading = false;
      },
    });
  }

  getLocalTimeString(instrument: Instrument): string {
    const date = new Date();
    return date.toLocaleString();
  }

  getServerTimeString(instrument: Instrument): string {
    const date = new Date(instrument.exchangeTime);
    return date.toLocaleString();
  }

  applyFilter(): void {
    const text = this.filterText.toLowerCase();
    this.filteredInstruments = this.instruments.filter((i) =>
      i.symbol.toLowerCase().includes(text)
    );
  }

  sortByPrice(): void {
    this.sortAsc = !this.sortAsc;
    this.filteredInstruments.sort((a, b) =>
      this.sortAsc ? a.price - b.price : b.price - a.price
    );
  }

  formatPrice(price: number): string {
    return price.toFixed(4);
  }

  formatVolume(vol: number): string {
    if (vol >= 1_000_000) {
      return (vol / 1_000_000).toFixed(1) + 'M';
    } else if (vol >= 1000) {
      return (vol / 1000).toFixed(1) + 'K';
    }
    return vol.toFixed(0);
  }
}
