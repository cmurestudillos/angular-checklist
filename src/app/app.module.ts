import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

// Módulos personalizados
import { AppRoutingModule } from './routes/app-routing.module';
import { MaterialModule } from './modules/material.module';

// Componentes principales
import { AppComponent } from './app.component';
import { HomeComponent } from './views/home/home.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { SidenavComponent } from './components/sidenav/sidenav.component';

// Servicios
import { StorageService } from './services/storage.service';
import { ExportImportService } from './services/export-import.service';
import { SettingsService } from './services/settings.service';
import { NotificationService } from './services/notificacion.service';

@NgModule({
  declarations: [AppComponent, HomeComponent, NavbarComponent, SidenavComponent],
  imports: [BrowserModule, BrowserAnimationsModule, FormsModule, ReactiveFormsModule, AppRoutingModule, MaterialModule],
  providers: [StorageService, NotificationService, ExportImportService, SettingsService],
  bootstrap: [AppComponent],
})
export class AppModule {}
