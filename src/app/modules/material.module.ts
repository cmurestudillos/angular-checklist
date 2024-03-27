import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {DragDropModule} from '@angular/cdk/drag-drop';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatInputModule} from '@angular/material/input';

import { MatButtonModule} from '@angular/material/button';
import { MatSelectModule} from '@angular/material/select';
import { MatIconModule} from '@angular/material/icon';
import { MatToolbarModule} from '@angular/material/toolbar';
import { MatCheckboxModule} from '@angular/material/checkbox';
import { MatMenuModule} from '@angular/material/menu';
import { MatSidenavModule} from '@angular/material/sidenav';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    BrowserAnimationsModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    MatToolbarModule,
    MatCheckboxModule,
    MatMenuModule,
    MatSidenavModule,
    DragDropModule
  ],
  exports: [
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    MatToolbarModule,
    MatCheckboxModule,
    MatMenuModule,
    MatSidenavModule,
    DragDropModule
  ]  
})
export class MaterialModule { }
