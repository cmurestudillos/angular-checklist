import { SweetAlertIcon } from 'sweetalert2';

export interface NotificationConfig {
  title?: string;
  text?: string;
  icon?: SweetAlertIcon;
  confirmButtonText?: string;
  cancelButtonText?: string;
  showCancelButton?: boolean;
  timer?: number;
  toast?: boolean;
  position?:
    | 'top'
    | 'top-start'
    | 'top-end'
    | 'center'
    | 'center-start'
    | 'center-end'
    | 'bottom'
    | 'bottom-start'
    | 'bottom-end';
}
