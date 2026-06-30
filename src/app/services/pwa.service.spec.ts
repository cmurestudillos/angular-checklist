import { TestBed } from '@angular/core/testing';

import { PwaService } from './pwa.service';

describe('PwaService', () => {
  let service: PwaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PwaService);
  });

  it('should have canInstall false initially', () => {
    expect(service.canInstall()).toBeFalse();
  });

  it('should have isInstalled false initially (non-standalone browser)', () => {
    // In Karma the display-mode is not standalone, so isInstalled starts false
    expect(service.isInstalled()).toBeFalse();
  });

  it('should set canInstall to true on beforeinstallprompt', () => {
    const event = new Event('beforeinstallprompt');
    Object.defineProperty(event, 'preventDefault', { value: jasmine.createSpy('preventDefault') });
    window.dispatchEvent(event);
    expect(service.canInstall()).toBeTrue();
  });

  it('should set isInstalled to true and canInstall to false on appinstalled', () => {
    // First simulate beforeinstallprompt so canInstall is true
    const promptEvent = new Event('beforeinstallprompt');
    Object.defineProperty(promptEvent, 'preventDefault', { value: jasmine.createSpy('preventDefault') });
    window.dispatchEvent(promptEvent);
    expect(service.canInstall()).toBeTrue();

    // Then simulate appinstalled
    window.dispatchEvent(new Event('appinstalled'));
    expect(service.canInstall()).toBeFalse();
    expect(service.isInstalled()).toBeTrue();
  });

  it('should not call prompt if deferredPrompt is null', async () => {
    await expectAsync(service.install()).toBeResolved();
  });
});
