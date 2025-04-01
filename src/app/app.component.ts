import { Component } from '@angular/core';
import { CryptoTableComponent } from './crypto-table/crypto-table.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, CryptoTableComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'my-angular-app';
}
