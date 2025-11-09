import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEmojis } from './add-emojis';

describe('AddEmojis', () => {
  let component: AddEmojis;
  let fixture: ComponentFixture<AddEmojis>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddEmojis]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddEmojis);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
