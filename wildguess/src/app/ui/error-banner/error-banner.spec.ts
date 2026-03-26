import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { By } from '@angular/platform-browser';
import { describe, it, expect, beforeEach } from 'vitest';
import { ErrorBannerComponent } from './error-banner';

@Component({
  template: `
    <wg-error-banner [dismissible]="dismissible" (dismiss)="onDismiss()">
      {{ errorMessage }}
    </wg-error-banner>
  `,
  imports: [ErrorBannerComponent],
})
class TestHostComponent {
  errorMessage = 'Something went wrong';
  dismissible = true;
  dismissed = false;

  onDismiss() {
    this.dismissed = true;
  }
}

describe('ErrorBannerComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let component: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent, ErrorBannerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should display the projected content', () => {
    const bannerText = fixture.debugElement.query(By.css('wg-error-banner')).nativeElement
      .textContent;
    expect(bannerText).toContain('Something went wrong');
  });

  it('should show the dismiss button by default and emit dismiss event when clicked', () => {
    const dismissButton = fixture.debugElement.query(By.css('button'));
    expect(dismissButton).toBeTruthy();

    dismissButton.nativeElement.click();
    expect(component.dismissed).toBe(true);
  });

  it('should not render a dismiss button if dismissible is false', () => {
    const fixture2 = TestBed.createComponent(TestHostComponent);
    fixture2.componentInstance.dismissible = false;
    fixture2.detectChanges();

    const dismissButton = fixture2.debugElement.query(By.css('button'));
    expect(dismissButton).toBeFalsy();
  });
});
