import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { webSocket } from 'rxjs/webSocket';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

type FlashField = 'price' | 'volume' | 'high' | 'low' | 'changePercent';

interface Instrument {
  symbol: string;
  price: number;
  volume: number;
  high: number;
  low: number;
  changePercent: number;
  exchangeTime: number;
  flash?: {
    price?: boolean;
    volume?: boolean;
    high?: boolean;
    low?: boolean;
    changePercent?: boolean;
  };
}

@Component({
  selector: 'app-crypto-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './crypto-table.component.html',
  styleUrls: ['./crypto-table.component.scss'],
})
export class CryptoTableComponent implements OnInit {
  // Используем BehaviorSubject для хранения списка инструментов
  private instrumentsSubject = new BehaviorSubject<Instrument[]>([]);
  // Observable для использования в шаблоне через async pipe
  instruments$ = this.instrumentsSubject.asObservable();

  // Дополнительные свойства для фильтрации, сортировки и темы
  filterText = '';
  sortField: keyof Instrument = 'symbol';
  sortAsc = true;
  loading = false;
  isDarkMode = false;
  currentDate = new Date();

  private apiUrl = 'https://api.binance.com/api/v3/ticker/24hr';
  private socket$ = webSocket<any>(
    'wss://stream.binance.com:9443/ws/!ticker@arr'
  );

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchInstruments();
    this.setupWebSocket();
  }

  // Получаем начальные данные из REST API
  fetchInstruments(): void {
    this.loading = true;
    this.http.get<any[]>(this.apiUrl).subscribe({
      next: (data) => {
        const instruments = data.slice(0, 1000).map((item) => ({
          symbol: item.symbol,
          price: parseFloat(item.lastPrice),
          volume: parseFloat(item.volume),
          high: parseFloat(item.highPrice),
          low: parseFloat(item.lowPrice),
          changePercent: parseFloat(item.priceChangePercent),
          exchangeTime: item.closeTime,
        }));
        this.instrumentsSubject.next(instruments);
        this.loading = false;
      },
      error: () => {
        console.error('Ошибка загрузки данных');
        this.loading = false;
      },
    });
  }

  // Подписка на WebSocket для обновления данных в реальном времени
  setupWebSocket(): void {
    this.socket$.subscribe({
      next: (updates) => {
        const instruments = this.instrumentsSubject.getValue();
        updates.forEach((update: any) => {
          const instrumentId = update.s;
          // Парсим новые данные
          const newPrice = parseFloat(update.c);
          const newVolume = parseFloat(update.v);
          const newHigh = parseFloat(update.h);
          const newLow = parseFloat(update.l);
          const newChangePercent = parseFloat(update.P);

          const index = instruments.findIndex((i) => i.symbol === instrumentId);
          if (index >= 0) {
            const inst = instruments[index];
            // Обновляем поля, если отформатированное значение изменилось
            this.updateField(inst, 'price', newPrice, this.formatPrice);
            this.updateField(inst, 'volume', newVolume, this.formatVolume);
            this.updateField(inst, 'high', newHigh, this.formatPrice);
            this.updateField(inst, 'low', newLow, this.formatPrice);
            // Для changePercent сравнение с округлением до двух знаков
            if (inst.changePercent.toFixed(2) !== newChangePercent.toFixed(2)) {
              inst.changePercent = newChangePercent;
              this.triggerFlash(inst, 'changePercent');
            }
          }
        });
        // После обновления пересылаем изменённый массив
        this.instrumentsSubject.next([...instruments]);
      },
      error: (err) => console.error('WebSocket error:', err),
      complete: () => console.log('WebSocket completed'),
    });
  }

  // Универсальный метод обновления поля с эффектом flash
  private updateField(
    inst: Instrument,
    field: FlashField,
    newValue: number,
    formatter: (val: number) => string
  ): void {
    if (formatter(inst[field] as number) !== formatter(newValue)) {
      inst[field] = newValue;
      this.triggerFlash(inst, field);
    }
  }

  // Устанавливаем flash для конкретного поля на 1 секунду
  private triggerFlash(inst: Instrument, field: FlashField): void {
    if (!inst.flash) {
      inst.flash = {};
    }
    inst.flash[field] = true;
    setTimeout(() => {
      if (inst.flash) {
        inst.flash[field] = false;
      }
    }, 1000);
  }

  // Геттер для фильтрации и сортировки инструментов
  get filteredInstruments$(): Observable<Instrument[]> {
    return this.instruments$.pipe(
      map((instruments) =>
        instruments.filter((i) =>
          i.symbol.toLowerCase().includes(this.filterText.toLowerCase())
        )
      ),
      map((list) =>
        list.sort((a, b) => {
          let comp = 0;
          if (this.sortField === 'symbol') {
            comp = a.symbol.localeCompare(b.symbol);
          } else {
            comp =
              (a[this.sortField] as number) - (b[this.sortField] as number);
          }
          return this.sortAsc ? comp : -comp;
        })
      )
    );
  }

  // Метод обновления фильтра; шаблон подхватит изменения через async pipe
  applyFilter(): void {
    // Значение filterText уже обновлено через двустороннее связывание
  }

  // Изменяем сортировку по выбранному столбцу
  sortBy(field: keyof Instrument): void {
    if (this.sortField === field) {
      this.sortAsc = !this.sortAsc;
    } else {
      this.sortField = field;
      this.sortAsc = true;
    }
  }

  // Переключение темы
  toggleTheme(): void {
    this.isDarkMode = !this.isDarkMode;
  }

  // Форматирование цены с четырьмя знаками после запятой
  formatPrice(price: number): string {
    return price.toFixed(4);
  }

  // Форматирование объёма (с сокращениями)
  formatVolume(vol: number): string {
    if (vol >= 1_000_000) {
      return (vol / 1_000_000).toFixed(1) + 'M';
    } else if (vol >= 1000) {
      return (vol / 1000).toFixed(1) + 'K';
    }
    return vol.toFixed(0);
  }

  // Локальное время – для примера
  getLocalTimeString(instrument: Instrument): string {
    return new Date().toLocaleString();
  }

  // Время обмена (серверное время)
  getServerTimeString(instrument: Instrument): string {
    return new Date(instrument.exchangeTime).toLocaleString();
  }
}
