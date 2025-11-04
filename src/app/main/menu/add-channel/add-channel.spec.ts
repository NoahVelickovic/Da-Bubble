import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddChannel } from './add-channel';

describe('AddChannel', () => {
  let component: AddChannel;
  let fixture: ComponentFixture<AddChannel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddChannel]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddChannel);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
