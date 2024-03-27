import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AppRoutingModule } from '../routes/app-routing.module';
import { MaterialModule } from '../modules/material.module';
import { NavbarComponent } from './navbar/navbar.component';

@NgModule({
  declarations: [
    NavbarComponent
  ],
  exports: [
    NavbarComponent
  ],  
  imports: [
    CommonModule,
    AppRoutingModule,
    MaterialModule,
    FormsModule
  ]
})
export class ComponentsModule { }
