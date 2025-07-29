import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../modules/material.module';

@NgModule({
  declarations: [],
  exports: [],
  imports: [CommonModule, MaterialModule, FormsModule, ReactiveFormsModule],
})
export class ComponentsModule {}
