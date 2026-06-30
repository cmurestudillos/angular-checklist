import { Injectable, signal } from '@angular/core';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

@Injectable({ providedIn: 'root' })
export class PwaService {
  public readonly canInstall = signal(false);
  public readonly isInstalled = signal(false);

  private deferredPrompt: BeforeInstallPromptEvent | null = null;

  constructor() {
    window.addEventListener('beforeinstallprompt', (e: Event) => {
      e.preventDefault();
      this.deferredPrompt = e as BeforeInstallPromptEvent;
      this.canInstall.set(true);
    });

    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      this.canInstall.set(false);
      this.isInstalled.set(true);
    });

    if (window.matchMedia('(display-mode: standalone)').matches) {
      this.isInstalled.set(true);
    }
  }

  public async install(): Promise<void> {
    if (!this.deferredPrompt) {
      return;
    }
    await this.deferredPrompt.prompt();
    const { outcome } = await this.deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      this.canInstall.set(false);
    }
    this.deferredPrompt = null;
  }
}
